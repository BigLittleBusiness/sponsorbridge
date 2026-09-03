/**
 * SponsorBridge — Stripe Integration
 *
 * Handles recurring monthly sponsorship billing via Stripe Subscriptions.
 * Sponsors are billed monthly; the default amount is $40/month (4000 cents).
 *
 * Routes:
 *   POST /api/stripe/webhook        — Stripe event delivery
 *   POST /api/stripe/create-session — Create a checkout session for a sponsorship
 */

import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { payments, sponsorships, sponsors } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = ENV.stripeChildWebhookSecret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  // Test event short-circuit — required for Stripe webhook verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received: ${event.type} (${event.id})`);

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "database unavailable" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sponsorshipId = session.metadata?.sponsorshipId ? parseInt(session.metadata.sponsorshipId) : null;
        const tenantId = session.metadata?.tenantId ? parseInt(session.metadata.tenantId) : null;
        const sponsorId = session.metadata?.sponsorId ? parseInt(session.metadata.sponsorId) : null;

        if (sponsorshipId && tenantId && sponsorId) {
          // Update sponsorship with Stripe subscription ID
          if (session.subscription) {
            await db.update(sponsorships)
              .set({ stripeSubscriptionId: session.subscription as string, updatedAt: new Date() })
              .where(eq(sponsorships.id, sponsorshipId));
          }

          // Update sponsor with Stripe customer ID
          if (session.customer) {
            await db.update(sponsors)
              .set({ stripeCustomerId: session.customer as string, updatedAt: new Date() })
              .where(eq(sponsors.id, sponsorId));
          }

          // Record the initial payment
          await db.insert(payments).values({
            tenantId,
            sponsorshipId,
            sponsorId,
            amount: session.amount_total ?? 4000,
            currency: session.currency ?? "usd",
            status: "succeeded",
            stripePaymentIntentId: session.payment_intent as string | null,
            stripeInvoiceId: null,
            paidAt: new Date(),
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null; payment_intent?: string | null };
        const subscriptionId = invoice.subscription as string | null;

        if (subscriptionId) {
          // Find the sponsorship by subscription ID
          const [sponsorship] = await db.select()
            .from(sponsorships)
            .where(eq(sponsorships.stripeSubscriptionId, subscriptionId))
            .limit(1);

          if (sponsorship) {
            await db.insert(payments).values({
              tenantId: sponsorship.tenantId,
              sponsorshipId: sponsorship.id,
              sponsorId: sponsorship.sponsorId,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: "succeeded",
              stripePaymentIntentId: (invoice.payment_intent as string | null) ?? null,
              stripeInvoiceId: invoice.id,
              paidAt: new Date(),
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null; payment_intent?: string | null };
        const subscriptionId = invoice.subscription as string | null;

        if (subscriptionId) {
          const [sponsorship] = await db.select()
            .from(sponsorships)
            .where(eq(sponsorships.stripeSubscriptionId, subscriptionId))
            .limit(1);

          if (sponsorship) {
            await db.insert(payments).values({
              tenantId: sponsorship.tenantId,
              sponsorshipId: sponsorship.id,
              sponsorId: sponsorship.sponsorId,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: "failed",
              stripePaymentIntentId: (invoice.payment_intent as string | null) ?? null,
              stripeInvoiceId: invoice.id,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.update(sponsorships)
          .set({ status: "cancelled", endDate: new Date(), updatedAt: new Date() })
          .where(eq(sponsorships.stripeSubscriptionId, subscription.id));
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Stripe Webhook] Processing error:", error);
    return res.status(500).json({ error: message });
  }
}

// ─── Create Checkout Session ──────────────────────────────────────────────────

export async function createCheckoutSessionHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { sponsorshipId, tenantId, sponsorId, monthlyAmount = 4000 } = req.body as {
      sponsorshipId: number;
      tenantId: number;
      sponsorId: number;
      monthlyAmount?: number;
    };

    const origin = (ENV.appBaseUrl || req.headers.origin || "https://sponsorapp-k6ifqkyq.manus.space").replace(/\/+$/, "");

    // Create a Stripe Price for the monthly sponsorship amount
    const price = await stripe.prices.create({
      unit_amount: monthlyAmount,
      currency: "usd",
      recurring: { interval: "month" },
      product_data: {
        name: "Child Sponsorship — Monthly",
        metadata: { sponsorshipId: sponsorshipId.toString() },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      client_reference_id: user.id.toString(),
      metadata: {
        sponsorshipId: sponsorshipId.toString(),
        tenantId: tenantId.toString(),
        sponsorId: sponsorId.toString(),
        user_id: user.id.toString(),
        customer_email: user.email ?? "",
        customer_name: user.name ?? "",
      },
      success_url: `${origin}/sponsorships/${sponsorshipId}?payment=success`,
      cancel_url: `${origin}/sponsorships/${sponsorshipId}?payment=cancelled`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Stripe] Create session error:", error);
    return res.status(500).json({ error: message });
  }
}

// ─── Register Routes ──────────────────────────────────────────────────────────

export function registerStripeRoutes(app: Express) {
  // Webhook MUST use raw body parser — before express.json()
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler
  );

  // Checkout session creation
  app.post("/api/stripe/create-session", createCheckoutSessionHandler);
}
