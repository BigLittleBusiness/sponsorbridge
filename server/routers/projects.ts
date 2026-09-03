import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";
import {
  getProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  incrementProjectRaised,
  getProjectContributions,
  getContributionsByProject,
  createProjectContribution,
  updateProjectContribution,
  getContributionByStripePaymentIntent,
  getContributionByStripeSubscription,
  getProjectUpdates,
  createProjectUpdate,
  deleteProjectUpdate,
  appendAuditLog,
  getSponsorByUserId,
} from "../db";
import { ENV } from "../_core/env";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STAFF_ROLES = ["system_admin", "program_manager", "safeguarding_officer", "field_worker", "finance_officer", "sponsor_relations", "volunteer", "admin"];
const MANAGER_ROLES = ["system_admin", "program_manager", "admin"];

function requireRole(role: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions." });
  }
}

function getStripe() {
  if (!ENV.stripeSecretKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured." });
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-06-24.dahlia" });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

function getPublicProjectUrl(projectSlug: string) {
  const baseUrl = (ENV.appBaseUrl || "https://sponsorapp-k6ifqkyq.manus.space").replace(/\/+$/, "");
  return `${baseUrl}/fund/${encodeURIComponent(projectSlug)}`;
}

// ─── SES EMAIL HELPER ─────────────────────────────────────────────────────────
// In production on AWS, replace this with the SES SDK call.
// The function signature and parameters are SES-ready.
async function sendProjectEmail(opts: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) {
  // AWS SES production implementation:
  // const ses = new AWS.SES({ region: process.env.AWS_REGION ?? "ap-southeast-2" });
  // await ses.sendEmail({
  //   Source: process.env.SES_FROM_EMAIL ?? "noreply@sponsorbridge.com",
  //   Destination: { ToAddresses: [opts.to] },
  //   Message: {
  //     Subject: { Data: opts.subject },
  //     Body: {
  //       Html: { Data: opts.htmlBody },
  //       Text: { Data: opts.textBody },
  //     },
  //   },
  // }).promise();
  console.log(`[SES] Would send email to ${opts.to}: ${opts.subject}`);
}

async function sendContributionConfirmationEmail(opts: {
  email: string;
  name: string;
  projectTitle: string;
  amountCents: number;
  currency: string;
  isRecurring: boolean;
  projectSlug: string;
}) {
  const amount = (opts.amountCents / 100).toFixed(2);
  const freq = opts.isRecurring ? "monthly recurring" : "one-off";
  await sendProjectEmail({
    to: opts.email,
    subject: `Thank you for supporting "${opts.projectTitle}" — SponsorBridge`,
    htmlBody: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#c1440e">Thank you, ${opts.name}!</h2>
        <p>Your ${freq} contribution of <strong>${opts.currency} $${amount}</strong> to <strong>${opts.projectTitle}</strong> has been received.</p>
        <p>You'll receive updates from the charity as the project progresses.</p>
        <a href="${getPublicProjectUrl(opts.projectSlug)}"
           style="display:inline-block;background:#c1440e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">
          View Project
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px">SponsorBridge — Empowering child sponsorship charities</p>
      </div>`,
    textBody: `Thank you, ${opts.name}! Your ${freq} contribution of ${opts.currency} $${amount} to "${opts.projectTitle}" has been received.`,
  });
}

async function sendProjectUpdateEmail(opts: {
  emails: string[];
  projectTitle: string;
  updateTitle: string;
  updateContent: string;
  projectSlug: string;
}) {
  for (const email of opts.emails) {
    await sendProjectEmail({
      to: email,
      subject: `Update on "${opts.projectTitle}" — ${opts.updateTitle}`,
      htmlBody: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#c1440e">Project Update: ${opts.projectTitle}</h2>
          <h3>${opts.updateTitle}</h3>
          <p>${opts.updateContent}</p>
          <a href="${getPublicProjectUrl(opts.projectSlug)}"
             style="display:inline-block;background:#c1440e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">
            View Project
          </a>
        </div>`,
      textBody: `${opts.projectTitle} — ${opts.updateTitle}\n\n${opts.updateContent}`,
    });
  }
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const projectsRouter = router({

  // ── Staff: list all projects for a tenant ──
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      status: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, STAFF_ROLES);
      const { tenantId, ...filters } = input;
      return getProjects(tenantId, filters);
    }),

  // ── Public: list active public projects for a tenant ──
  listPublic: publicProcedure
    .input(z.object({ tenantId: z.number(), category: z.string().optional() }))
    .query(async ({ input }) => {
      return getProjects(input.tenantId, { status: "active", isPublic: true, category: input.category });
    }),

  // ── Staff: get project by ID ──
  getById: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, STAFF_ROLES);
      return (await getProjectById(input.id, input.tenantId)) ?? null;
    }),

  // ── Public: get project by slug (for fundraising page) ──
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const project = await getProjectBySlug(input.slug, input.tenantId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      // Only expose public active/funded projects to the public
      if (!project.isPublic) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      return project;
    }),

  // ── Staff: create project ──
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      title: z.string().min(3).max(255),
      description: z.string().min(10),
      shortDescription: z.string().max(500).optional(),
      category: z.enum(["infrastructure", "education", "equipment", "event", "emergency", "health", "other"]).default("other"),
      goalAmountCents: z.number().int().positive(),
      currency: z.string().length(3).default("AUD"),
      coverImageUrl: z.string().url().optional(),
      isPublic: z.boolean().default(false),
      allowRecurring: z.boolean().default(true),
      showDonorWall: z.boolean().default(true),
      deadlineAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
      const slug = slugify(input.title) + "-" + Date.now().toString(36);
      await createProject({
        ...input,
        slug,
        createdById: ctx.user.id,
        status: "draft",
      } as any);
      await appendAuditLog({
        userId: ctx.user.id,
        tenantId: input.tenantId,
        action: "PROJECT_CREATED",
        entityType: "project",
        afterValue: { title: input.title, category: input.category },
      });
      return { success: true, slug };
    }),

  // ── Staff: update project ──
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      title: z.string().min(3).max(255).optional(),
      description: z.string().min(10).optional(),
      shortDescription: z.string().max(500).optional(),
      category: z.enum(["infrastructure", "education", "equipment", "event", "emergency", "health", "other"]).optional(),
      goalAmountCents: z.number().int().positive().optional(),
      coverImageUrl: z.string().url().optional(),
      status: z.enum(["draft", "active", "funded", "completed", "cancelled"]).optional(),
      isPublic: z.boolean().optional(),
      allowRecurring: z.boolean().optional(),
      showDonorWall: z.boolean().optional(),
      deadlineAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
      const { id, tenantId, ...data } = input;
      await updateProject(id, tenantId, data as any);
      await appendAuditLog({
        userId: ctx.user.id,
        tenantId,
        action: "PROJECT_UPDATED",
        entityType: "project",
        entityId: String(id),
        afterValue: data,
      });
      return { success: true };
    }),

  // ── Staff: get contributions for a project ──
  getContributions: protectedProcedure
    .input(z.object({ projectId: z.number(), tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...MANAGER_ROLES, "finance_officer", "sponsor_relations"]);
      return getProjectContributions(input.projectId, input.tenantId);
    }),

  // ── Public: get donor wall (succeeded, non-anonymous) ──
  getDonorWall: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const contributions = await getContributionsByProject(input.projectId);
      return contributions
        .filter((c) => !c.isAnonymous)
        .map((c) => ({
          id: c.id,
          name: c.guestName ?? "Supporter",
          amountCents: c.amountCents,
          currency: c.currency,
          message: c.message,
          paidAt: c.paidAt,
          isRecurring: c.isRecurring,
        }));
    }),

  // ── Public: create Stripe checkout session for a project contribution ──
  createCheckout: publicProcedure
    .input(z.object({
      projectId: z.number(),
      tenantId: z.number(),
      amountCents: z.number().int().min(50),
      currency: z.string().length(3).default("AUD"),
      isRecurring: z.boolean().default(false),
      isAnonymous: z.boolean().default(false),
      message: z.string().max(500).optional(),
      donorName: z.string().min(1).max(255),
      donorEmail: z.string().email(),
      sponsorId: z.number().optional(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId, input.tenantId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      if (project.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "This project is not currently accepting contributions." });

      const stripe = getStripe();

      // Create a pending contribution record first
      const contribResult = await createProjectContribution({
        tenantId: input.tenantId,
        projectId: input.projectId,
        sponsorId: input.sponsorId ?? null,
        guestName: input.donorName,
        guestEmail: input.donorEmail,
        amountCents: input.amountCents,
        currency: input.currency.toLowerCase(),
        isRecurring: input.isRecurring,
        isAnonymous: input.isAnonymous,
        message: input.message ?? null,
        status: "pending",
      } as any);

      const contribId = (contribResult as any).insertId;

      let session;

      if (input.isRecurring) {
        // Recurring: create a price on the fly and use subscription mode
        const price = await stripe.prices.create({
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          recurring: { interval: "month" },
          product_data: { name: `Monthly support — ${project.title}` },
        });

        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: input.donorEmail,
          line_items: [{ price: price.id, quantity: 1 }],
          allow_promotion_codes: true,
          success_url: input.successUrl + `?session_id={CHECKOUT_SESSION_ID}&contrib_id=${contribId}`,
          cancel_url: input.cancelUrl,
          metadata: {
            contribution_id: String(contribId),
            project_id: String(input.projectId),
            tenant_id: String(input.tenantId),
            donor_name: input.donorName,
            donor_email: input.donorEmail,
            is_recurring: "true",
          },
        });
      } else {
        // One-off payment intent
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: input.donorEmail,
          line_items: [{
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amountCents,
              product_data: { name: project.title, description: project.shortDescription ?? undefined },
            },
            quantity: 1,
          }],
          allow_promotion_codes: true,
          success_url: input.successUrl + `?session_id={CHECKOUT_SESSION_ID}&contrib_id=${contribId}`,
          cancel_url: input.cancelUrl,
          metadata: {
            contribution_id: String(contribId),
            project_id: String(input.projectId),
            tenant_id: String(input.tenantId),
            donor_name: input.donorName,
            donor_email: input.donorEmail,
            is_recurring: "false",
          },
        });
      }

      return { checkoutUrl: session.url!, sessionId: session.id };
    }),

  // ── Staff: post project update (notifies contributors via SES) ──
  postUpdate: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      projectId: z.number(),
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      mediaUrl: z.string().url().optional(),
      isPublished: z.boolean().default(true),
      notifyContributors: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations", "field_worker"]);
      const project = await getProjectById(input.projectId, input.tenantId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });

      await createProjectUpdate({
        tenantId: input.tenantId,
        projectId: input.projectId,
        postedById: ctx.user.id,
        title: input.title,
        content: input.content,
        mediaUrl: input.mediaUrl ?? null,
        isPublished: input.isPublished,
        publishedAt: input.isPublished ? new Date() : undefined,
      } as any);

      // Notify contributors via SES if requested
      if (input.isPublished && input.notifyContributors) {
        const contributions = await getContributionsByProject(input.projectId);
        const emailSet = new Set<string>();
        contributions.forEach((c) => { if (c.guestEmail) emailSet.add(c.guestEmail); });
        const emails = Array.from(emailSet);
        if (emails.length > 0) {
          await sendProjectUpdateEmail({
            emails,
            projectTitle: project.title,
            updateTitle: input.title,
            updateContent: input.content,
            projectSlug: project.slug,
          });
        }
      }

      await appendAuditLog({
        userId: ctx.user.id,
        tenantId: input.tenantId,
        action: "PROJECT_UPDATE_POSTED",
        entityType: "project",
        entityId: String(input.projectId),
        afterValue: { title: input.title },
      });

      return { success: true };
    }),

  // ── Public: get project updates ──
  getUpdates: publicProcedure
    .input(z.object({ projectId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      return getProjectUpdates(input.projectId, input.tenantId);
    }),

  // ── Staff: delete project update ──
  deleteUpdate: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
      await deleteProjectUpdate(input.id, input.tenantId);
      return { success: true };
    }),

  // ── Sponsor: get my project contributions ──
  myContributions: protectedProcedure
    .query(async ({ ctx }) => {
      const sponsor = await getSponsorByUserId(ctx.user.id);
      if (!sponsor) return [];
      const tenantId = sponsor.tenantId;
      if (!tenantId) return [];
      const { getSponsorProjectContributions } = await import("../db");
      return getSponsorProjectContributions(sponsor.id, tenantId);
    }),

  // ── Staff: upload an image for a project update ──
  uploadUpdateImage: protectedProcedure
    .input(z.object({
      // base64-encoded image data
      base64: z.string(),
      mimeType: z.string().regex(/^image\//),
      filename: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, [...STAFF_ROLES]);
      const buffer = Buffer.from(input.base64, "base64");
      const key = `project-updates/${ctx.user.id}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

// ─── STRIPE WEBHOOK HANDLER ──────────────────────────────────────────────────
// Register this in server/_core/index.ts BEFORE express.json() middleware.
// Route: POST /api/projects/webhook

export async function handleProjectStripeWebhook(rawBody: Buffer, signature: string) {
  if (!ENV.stripeSecretKey || !ENV.stripeProjectWebhookSecret) {
    throw new Error("Stripe not configured");
  }
  const stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-06-24.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, ENV.stripeProjectWebhookSecret);
  } catch {
    throw new Error("Invalid webhook signature");
  }

  // Test event bypass
  if (event.id.startsWith("evt_test_")) {
    console.log("[ProjectWebhook] Test event, returning verified");
    return { verified: true };
  }

  console.log(`[ProjectWebhook] Event: ${event.type} (${event.id})`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const contribId = meta.contribution_id ? parseInt(meta.contribution_id) : null;
    const projectId = meta.project_id ? parseInt(meta.project_id) : null;
    const tenantId = meta.tenant_id ? parseInt(meta.tenant_id) : null;
    const isRecurring = meta.is_recurring === "true";

    if (!contribId || !projectId || !tenantId) return { received: true };

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent : session.payment_intent?.id;
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string"
      ? session.customer : session.customer?.id;

    await updateProjectContribution(contribId, {
      status: "succeeded",
      stripePaymentIntentId: paymentIntentId ?? undefined,
      stripeSubscriptionId: subscriptionId ?? undefined,
      stripeCustomerId: customerId ?? undefined,
      paidAt: new Date(),
    } as any);

    // Increment the project's raised amount
    const amountTotal = session.amount_total ?? 0;
    if (amountTotal > 0) {
      await incrementProjectRaised(projectId, amountTotal);
    }

    // Check if project is now fully funded
    const project = await getProjectById(projectId, tenantId);
    if (project && project.raisedAmountCents + amountTotal >= project.goalAmountCents) {
      await updateProject(projectId, tenantId, { status: "funded", completedAt: new Date() } as any);
    }

    // Send confirmation email via SES
    const donorEmail = meta.donor_email ?? session.customer_details?.email;
    const donorName = meta.donor_name ?? session.customer_details?.name ?? "Supporter";
    if (donorEmail && project) {
      await sendContributionConfirmationEmail({
        email: donorEmail,
        name: donorName,
        projectTitle: project.title,
        amountCents: amountTotal,
        currency: (session.currency ?? "aud").toUpperCase(),
        isRecurring,
        projectSlug: project.slug,
      });
    }
  }

  if (event.type === "invoice.paid") {
    // Handle recurring subscription payments
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription : (invoice as any).subscription?.id;
    if (!subscriptionId) return { received: true };

    const existing = await getContributionByStripeSubscription(subscriptionId);
    if (!existing) return { received: true };

    // Create a new contribution record for this recurring payment
    await createProjectContribution({
      tenantId: existing.tenantId,
      projectId: existing.projectId,
      sponsorId: existing.sponsorId ?? null,
      guestName: existing.guestName,
      guestEmail: existing.guestEmail,
      amountCents: invoice.amount_paid,
      currency: (invoice.currency ?? "aud").toUpperCase(),
      isRecurring: true,
      isAnonymous: existing.isAnonymous,
      message: null,
      status: "succeeded",
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
      paidAt: new Date(),
    } as any);

    await incrementProjectRaised(existing.projectId, invoice.amount_paid);
  }

  return { received: true };
}
