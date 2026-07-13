/**
 * SponsorBridge — Sponsor Portal Auth & Data Router
 * Handles sponsor self-service login (email/password + OTP magic link),
 * session management, and all data endpoints for the sponsor portal.
 * Uses the same JWT/cookie pattern as customAuth.ts but scoped to
 * sponsor_portal_accounts and the sb_sponsor_token cookie.
 */
import bcrypt from "bcryptjs";
import { Router } from "express";
import { and, eq, desc, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getDb } from "./db";
import {
  sponsorPortalAccounts,
  sponsors,
  sponsorships,
  children,
  payments,
  messages,
  childUpdates,
  tenants,
} from "../drizzle/schema";

const router = Router();

// ─── JWT helpers ─────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sponsorbridge-custom-auth-secret"
);
const JWT_ISSUER = "sponsorbridge";
const JWT_AUDIENCE = "sponsorbridge-sponsor";

async function signSponsorToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySponsorToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as { portalAccountId: number; sponsorId: number; tenantId: number; email: string };
  } catch {
    return null;
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────

function getMailTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER ?? "test@ethereal.email",
      pass: process.env.ETHEREAL_PASS ?? "testpassword",
    },
  });
}

async function sendSponsorOtpEmail(to: string, firstName: string, otp: string) {
  const transport = getMailTransport();
  const info = await transport.sendMail({
    from: `"SponsorBridge" <${process.env.SMTP_FROM ?? "noreply@sponsorbridge.com"}>`,
    to,
    subject: "Your SponsorBridge sign-in code",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-footer-light_b62cd37a.svg" alt="SponsorBridge" style="height:40px;width:auto;display:inline-block;" />
        </div>
        <h2 style="font-size:20px;font-weight:600;color:#1a3a2e;margin-bottom:8px;">Your sign-in code</h2>
        <p style="color:#4a5568;margin-bottom:24px;">Hi ${firstName}, here is your one-time sign-in code for the SponsorBridge Sponsor Portal.</p>
        <div style="background:#f7f7f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#C1440E;">${otp}</span>
        </div>
        <p style="color:#718096;font-size:13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[Sponsor OTP] Preview URL:", nodemailer.getTestMessageUrl(info));
    console.log("[Sponsor OTP] Code sent to", to, ":", otp);
  }
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Auth middleware helper ───────────────────────────────────────────────────

async function requireSponsorAuth(req: any, res: any) {
  const token = req.cookies?.sb_sponsor_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorised" });
    return null;
  }
  const payload = await verifySponsorToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
  return payload;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/sponsor/login
 * Accepts email + password OR requests an OTP magic link.
 */
router.post("/login", async (req, res) => {
  const parse = z.object({
    email: z.string().email(),
    password: z.string().optional(),
    requestOtp: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parse.success) return res.status(400).json({ error: "Invalid request" });
  const { email, password, requestOtp } = parse.data;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [account] = await db
    .select()
    .from(sponsorPortalAccounts)
    .where(eq(sponsorPortalAccounts.email, email.toLowerCase()))
    .limit(1);

  if (!account) return res.status(401).json({ error: "No sponsor account found with this email address." });
  if (!account.isActive) return res.status(403).json({ error: "This account has been deactivated. Please contact your sponsorship organisation." });

  // OTP magic link path
  if (requestOtp) {
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.update(sponsorPortalAccounts)
      .set({ otpCode: otp, otpExpiresAt, otpAttempts: 0 })
      .where(eq(sponsorPortalAccounts.id, account.id));

    // Get sponsor name for email
    const [sponsor] = await db.select({ firstName: sponsors.firstName })
      .from(sponsors).where(eq(sponsors.id, account.sponsorId)).limit(1);

    try {
      await sendSponsorOtpEmail(email, sponsor?.firstName ?? "Sponsor", otp);
    } catch (err) {
      console.error("[Sponsor OTP] Failed to send:", err);
    }

    return res.json({ success: true, otpSent: true, message: "A sign-in code has been sent to your email." });
  }

  // Password path
  if (!password) return res.status(400).json({ error: "Password required" });
  if (!account.passwordHash) return res.status(400).json({ error: "This account uses magic link sign-in. Please request an OTP." });

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return res.status(401).json({ error: "Incorrect email or password." });

  await db.update(sponsorPortalAccounts)
    .set({ lastLoginAt: new Date() })
    .where(eq(sponsorPortalAccounts.id, account.id));

  const token = await signSponsorToken({
    portalAccountId: account.id,
    sponsorId: account.sponsorId,
    tenantId: account.tenantId,
    email: account.email,
  });

  res.cookie("sb_sponsor_token", token, {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({ success: true });
});

/**
 * POST /api/sponsor/verify-otp
 * Verifies the OTP sent via magic link and issues a session cookie.
 */
router.post("/verify-otp", async (req, res) => {
  const parse = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }).safeParse(req.body);

  if (!parse.success) return res.status(400).json({ error: "Invalid request" });
  const { email, otp } = parse.data;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [account] = await db
    .select()
    .from(sponsorPortalAccounts)
    .where(eq(sponsorPortalAccounts.email, email.toLowerCase()))
    .limit(1);

  if (!account) return res.status(404).json({ error: "Account not found." });
  if ((account.otpAttempts ?? 0) >= 5) {
    return res.status(429).json({ error: "Too many attempts. Please request a new code." });
  }
  if (!account.otpExpiresAt || new Date() > account.otpExpiresAt) {
    return res.status(400).json({ error: "Code has expired. Please request a new one." });
  }
  if (account.otpCode !== otp) {
    await db.update(sponsorPortalAccounts)
      .set({ otpAttempts: (account.otpAttempts ?? 0) + 1 })
      .where(eq(sponsorPortalAccounts.id, account.id));
    return res.status(400).json({ error: "Incorrect code." });
  }

  await db.update(sponsorPortalAccounts)
    .set({ isVerified: true, otpCode: null, otpExpiresAt: null, otpAttempts: 0, lastLoginAt: new Date() })
    .where(eq(sponsorPortalAccounts.id, account.id));

  const token = await signSponsorToken({
    portalAccountId: account.id,
    sponsorId: account.sponsorId,
    tenantId: account.tenantId,
    email: account.email,
  });

  res.cookie("sb_sponsor_token", token, {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({ success: true });
});

/**
 * POST /api/sponsor/logout
 */
router.post("/logout", (_req, res) => {
  res.clearCookie("sb_sponsor_token", { path: "/" });
  return res.json({ success: true });
});

/**
 * GET /api/sponsor/me
 * Returns sponsor profile + active sponsorships.
 */
router.get("/me", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [sponsor] = await db
    .select()
    .from(sponsors)
    .where(eq(sponsors.id, payload.sponsorId))
    .limit(1);

  if (!sponsor) return res.status(404).json({ error: "Sponsor profile not found." });

  // Get active sponsorships with child details
  const activeSponsorships = await db
    .select({
      id: sponsorships.id,
      status: sponsorships.status,
      startDate: sponsorships.startDate,
      monthlyAmount: sponsorships.monthlyAmount,
      childId: children.id,
      childFirstName: children.firstName,
      childLastName: children.lastName,
      childCountry: children.country,
      childPhotoUrl: children.photoUrl,
      childDateOfBirth: children.dateOfBirth,
      childGender: children.gender,
      childProgramType: children.programType,
    })
    .from(sponsorships)
    .innerJoin(children, eq(sponsorships.childId, children.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(sponsorships.status, "active")
      )
    );

  return res.json({ sponsor, sponsorships: activeSponsorships });
});

/**
 * GET /api/sponsor/dashboard
 * KPI cards: total donated, months active, child updates count, messages count.
 */
router.get("/dashboard", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [totalDonated] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(payments)
    .where(and(eq(payments.sponsorId, payload.sponsorId), eq(payments.status, "succeeded")));

  const [activeSponsorshipRow] = await db
    .select({ id: sponsorships.id, startDate: sponsorships.startDate })
    .from(sponsorships)
    .where(and(eq(sponsorships.sponsorId, payload.sponsorId), eq(sponsorships.status, "active")))
    .limit(1);

  const monthsActive = activeSponsorshipRow?.startDate
    ? Math.floor((Date.now() - new Date(activeSponsorshipRow.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0;

  // Child updates for this sponsor's sponsorships
  const [updatesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(childUpdates)
    .innerJoin(sponsorships, eq(childUpdates.sponsorshipId, sponsorships.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(childUpdates.isPublished, true)
      )
    );

  const [messagesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .innerJoin(sponsorships, eq(messages.sponsorshipId, sponsorships.id))
    .where(eq(sponsorships.sponsorId, payload.sponsorId));

  // Recent updates (last 3)
  const recentUpdates = await db
    .select({
      id: childUpdates.id,
      title: childUpdates.title,
      content: childUpdates.content,
      updateType: childUpdates.updateType,
      mediaUrl: childUpdates.mediaUrl,
      publishedAt: childUpdates.publishedAt,
      childFirstName: children.firstName,
      childLastName: children.lastName,
      childPhotoUrl: children.photoUrl,
    })
    .from(childUpdates)
    .innerJoin(sponsorships, eq(childUpdates.sponsorshipId, sponsorships.id))
    .innerJoin(children, eq(childUpdates.childId, children.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(childUpdates.isPublished, true)
      )
    )
    .orderBy(desc(childUpdates.publishedAt))
    .limit(3);

  return res.json({
    totalDonatedCents: Number(totalDonated?.total ?? 0),
    monthsActive,
    updatesCount: Number(updatesCount?.count ?? 0),
    messagesCount: Number(messagesCount?.count ?? 0),
    recentUpdates,
  });
});

/**
 * GET /api/sponsor/child-updates
 * Paginated updates feed for sponsored children.
 */
router.get("/child-updates", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const page = parseInt(req.query.page as string ?? "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const updates = await db
    .select({
      id: childUpdates.id,
      title: childUpdates.title,
      content: childUpdates.content,
      updateType: childUpdates.updateType,
      mediaUrl: childUpdates.mediaUrl,
      publishedAt: childUpdates.publishedAt,
      childId: children.id,
      childFirstName: children.firstName,
      childLastName: children.lastName,
      childPhotoUrl: children.photoUrl,
    })
    .from(childUpdates)
    .innerJoin(sponsorships, eq(childUpdates.sponsorshipId, sponsorships.id))
    .innerJoin(children, eq(childUpdates.childId, children.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(childUpdates.isPublished, true)
      )
    )
    .orderBy(desc(childUpdates.publishedAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(childUpdates)
    .innerJoin(sponsorships, eq(childUpdates.sponsorshipId, sponsorships.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(childUpdates.isPublished, true)
      )
    );

  return res.json({
    updates,
    pagination: {
      page,
      limit,
      total: Number(total?.count ?? 0),
      totalPages: Math.ceil(Number(total?.count ?? 0) / limit),
    },
  });
});

/**
 * GET /api/sponsor/payments
 * Payment history for the sponsor.
 */
router.get("/payments", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const paymentHistory = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      stripeInvoiceId: payments.stripeInvoiceId,
      childFirstName: children.firstName,
      childLastName: children.lastName,
    })
    .from(payments)
    .innerJoin(sponsorships, eq(payments.sponsorshipId, sponsorships.id))
    .innerJoin(children, eq(sponsorships.childId, children.id))
    .where(eq(payments.sponsorId, payload.sponsorId))
    .orderBy(desc(payments.createdAt))
    .limit(50);

  const [summary] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(payments)
    .where(and(eq(payments.sponsorId, payload.sponsorId), eq(payments.status, "succeeded")));

  return res.json({
    payments: paymentHistory,
    totalDonatedCents: Number(summary?.total ?? 0),
  });
});

/**
 * GET /api/sponsor/messages
 * Message thread for the sponsor's sponsorships.
 */
router.get("/messages", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const thread = await db
    .select({
      id: messages.id,
      direction: messages.direction,
      originalText: messages.originalText,
      translatedText: messages.translatedText,
      status: messages.status,
      deliveredAt: messages.deliveredAt,
      createdAt: messages.createdAt,
      childFirstName: children.firstName,
      childLastName: children.lastName,
    })
    .from(messages)
    .innerJoin(sponsorships, eq(messages.sponsorshipId, sponsorships.id))
    .innerJoin(children, eq(sponsorships.childId, children.id))
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(messages.status, "approved")
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(50);

  return res.json({ messages: thread });
});

/**
 * POST /api/sponsor/messages
 * Send a message to the sponsored child (goes into moderation queue).
 */
router.post("/messages", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const parse = z.object({
    sponsorshipId: z.number().int().positive(),
    text: z.string().min(1).max(2000),
  }).safeParse(req.body);

  if (!parse.success) return res.status(400).json({ error: "Invalid request" });
  const { sponsorshipId, text } = parse.data;

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  // Verify this sponsorship belongs to this sponsor
  const [sponsorship] = await db
    .select({ id: sponsorships.id, tenantId: sponsorships.tenantId })
    .from(sponsorships)
    .where(
      and(
        eq(sponsorships.id, sponsorshipId),
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(sponsorships.status, "active")
      )
    )
    .limit(1);

  if (!sponsorship) return res.status(403).json({ error: "Sponsorship not found or not active." });

  // Use the sponsor's userId — look it up from sponsors table
  const [sponsor] = await db
    .select({ userId: sponsors.userId })
    .from(sponsors)
    .where(eq(sponsors.id, payload.sponsorId))
    .limit(1);

  if (!sponsor) return res.status(404).json({ error: "Sponsor not found." });

  await db.insert(messages).values({
    tenantId: sponsorship.tenantId,
    sponsorshipId,
    senderId: sponsor.userId,
    direction: "sponsor_to_child",
    originalText: text,
    status: "pending_approval",
  });

  return res.json({ success: true, message: "Message sent and awaiting moderation." });
});

/**
 * GET /api/sponsor/child/:childId
 * Full child profile with all updates history.
 */
router.get("/child/:childId", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const childId = parseInt(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid child ID" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  // Verify this sponsor has an active sponsorship with this child
  const [sponsorship] = await db
    .select({ id: sponsorships.id })
    .from(sponsorships)
    .where(
      and(
        eq(sponsorships.sponsorId, payload.sponsorId),
        eq(sponsorships.childId, childId),
        eq(sponsorships.status, "active")
      )
    )
    .limit(1);

  if (!sponsorship) return res.status(403).json({ error: "You do not have an active sponsorship with this child." });

  const [child] = await db
    .select()
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);

  if (!child) return res.status(404).json({ error: "Child not found." });

  const updates = await db
    .select()
    .from(childUpdates)
    .where(
      and(
        eq(childUpdates.childId, childId),
        eq(childUpdates.isPublished, true)
      )
    )
    .orderBy(desc(childUpdates.publishedAt));

  return res.json({ child, updates });
});

/**
 * PUT /api/sponsor/profile
 * Update sponsor notification preferences.
 */
router.put("/profile", async (req, res) => {
  const payload = await requireSponsorAuth(req, res);
  if (!payload) return;

  const parse = z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parse.success) return res.status(400).json({ error: "Invalid request" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  await db.update(sponsors)
    .set(parse.data)
    .where(eq(sponsors.id, payload.sponsorId));

  return res.json({ success: true });
});

export { router as sponsorAuthRouter };
