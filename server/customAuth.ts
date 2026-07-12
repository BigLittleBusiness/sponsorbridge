/**
 * SponsorBridge Custom Auth
 * Handles charity admin registration, OTP email verification, and JWT login.
 * Completely separate from the Manus OAuth flow used by internal staff.
 */
import bcrypt from "bcryptjs";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import { customAccounts, onboardingProgress, tenants, passwordResetTokens } from "../drizzle/schema";

const router = Router();

// ─── JWT helpers ────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sponsorbridge-custom-auth-secret"
);
const JWT_ISSUER = "sponsorbridge";
const JWT_AUDIENCE = "sponsorbridge-app";

async function signToken(payload: Record<string, unknown>, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyCustomToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as { accountId: number; email: string; orgName: string; planTier: string };
  } catch {
    return null;
  }
}

// ─── Email helper ────────────────────────────────────────────────────────────

function getMailTransport() {
  // In production, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars.
  // Falls back to Ethereal (test) transport when env vars are absent.
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Ethereal test transport — logs preview URL to console
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER ?? "test@ethereal.email",
      pass: process.env.ETHEREAL_PASS ?? "testpassword",
    },
  });
}

async function sendOtpEmail(to: string, firstName: string, otp: string) {
  const transport = getMailTransport();
  const info = await transport.sendMail({
    from: `"SponsorBridge" <${process.env.SMTP_FROM ?? "noreply@sponsorbridge.com"}>`,
    to,
    subject: "Your SponsorBridge verification code",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-footer-light_b62cd37a.svg" alt="SponsorBridge" style="height:40px;width:auto;display:inline-block;" />
        </div>
        <h2 style="font-size:20px;font-weight:600;color:#1a2e1a;margin-bottom:8px;">Verify your email address</h2>
        <p style="color:#4a5568;margin-bottom:24px;">Hi ${firstName}, thanks for signing up. Enter the code below to verify your account.</p>
        <div style="background:#f7f7f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#D14A2E;">${otp}</span>
        </div>
        <p style="color:#718096;font-size:13px;">This code expires in 15 minutes. If you didn't create a SponsorBridge account, you can safely ignore this email.</p>
      </div>
    `,
  });
  // In dev/test, log the preview URL so the OTP can be seen
  if (process.env.NODE_ENV !== "production") {
    console.log("[OTP Email] Preview URL:", nodemailer.getTestMessageUrl(info));
    console.log("[OTP Email] Code sent to", to, ":", otp);
  }
}

// ─── OTP generator ───────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  jobTitle: z.string().max(150).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  orgName: z.string().min(2).max(255),
  orgCountry: z.string().min(2).max(100),
  orgWebsite: z.string().url().optional().or(z.literal("")),
  orgSize: z.enum(["1-10", "11-50", "51-200", "200+"]).optional(),
  planTier: z.enum(["starter", "growth", "professional", "enterprise"]).optional(),
  agreedToTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ResendOtpSchema = z.object({
  email: z.string().email(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

/** POST /api/auth/register */
router.post("/register", async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.flatten() });
  }
  const data = parse.data;
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  // Check for duplicate email
  const existing = await db
    .select({ id: customAccounts.id })
    .from(customAccounts)
    .where(eq(customAccounts.email, data.email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Create a tenant for this organisation
  const [tenantResult] = await db.insert(tenants).values({
    name: data.orgName,
    subdomain: data.orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 100),
    primaryColor: "#D14A2E",
    secondaryColor: "#F4A261",
  });
  const tenantId = (tenantResult as any).insertId as number;

  await db.insert(customAccounts).values({
    tenantId,
    orgName: data.orgName,
    orgCountry: data.orgCountry,
    orgWebsite: data.orgWebsite ?? null,
    orgSize: data.orgSize ?? null,
    firstName: data.firstName,
    lastName: data.lastName,
    jobTitle: data.jobTitle ?? null,
    email: data.email.toLowerCase(),
    phone: data.phone ?? null,
    passwordHash,
    isVerified: false,
    otpCode: otp,
    otpExpiresAt,
    otpAttempts: 0,
    planTier: data.planTier ?? "starter",
  });

  // Send OTP email (non-blocking — don't fail registration if email fails)
  try {
    await sendOtpEmail(data.email, data.firstName, otp);
  } catch (err) {
    console.error("[OTP Email] Failed to send:", err);
  }

  return res.status(201).json({
    success: true,
    message: "Account created. Please check your email for the verification code.",
    email: data.email.toLowerCase(),
  });
});

/** POST /api/auth/verify-otp */
router.post("/verify-otp", async (req, res) => {
  const parse = VerifyOtpSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const { email, otp } = parse.data;
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [account] = await db
    .select()
    .from(customAccounts)
    .where(eq(customAccounts.email, email.toLowerCase()))
    .limit(1);

  if (!account) return res.status(404).json({ error: "Account not found." });
  if (account.isVerified) return res.status(400).json({ error: "Account already verified." });

  // Rate limit: max 5 attempts
  if ((account.otpAttempts ?? 0) >= 5) {
    return res.status(429).json({ error: "Too many attempts. Please request a new code." });
  }

  // Check expiry
  if (!account.otpExpiresAt || new Date() > account.otpExpiresAt) {
    return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
  }

  // Check code
  if (account.otpCode !== otp) {
    await db
      .update(customAccounts)
      .set({ otpAttempts: (account.otpAttempts ?? 0) + 1 })
      .where(eq(customAccounts.id, account.id));
    return res.status(400).json({ error: "Incorrect verification code." });
  }

  // Mark verified and clear OTP
  await db
    .update(customAccounts)
    .set({
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      lastSignedIn: new Date(),
    })
    .where(eq(customAccounts.id, account.id));

  // Seed onboarding checklist steps
  const steps = ["org_profile", "first_child", "invite_team", "safeguarding_policy", "payment_setup"];
  await db.insert(onboardingProgress).values(
    steps.map((stepKey) => ({ accountId: account.id, stepKey }))
  );

  const token = await signToken({
    accountId: account.id,
    email: account.email,
    orgName: account.orgName,
    planTier: account.planTier ?? "starter",
    tenantId: account.tenantId,
  });

  res.cookie("sb_token", token, {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  return res.json({
    success: true,
    account: {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      orgName: account.orgName,
      planTier: account.planTier,
      onboardingCompletedAt: account.onboardingCompletedAt,
    },
  });
});

/** POST /api/auth/resend-otp */
router.post("/resend-otp", async (req, res) => {
  const parse = ResendOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid email" });
  const { email } = parse.data;
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [account] = await db
    .select()
    .from(customAccounts)
    .where(eq(customAccounts.email, email.toLowerCase()))
    .limit(1);

  if (!account) return res.status(404).json({ error: "Account not found." });
  if (account.isVerified) return res.status(400).json({ error: "Account already verified." });

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .update(customAccounts)
    .set({ otpCode: otp, otpExpiresAt, otpAttempts: 0 })
    .where(eq(customAccounts.id, account.id));

  try {
    await sendOtpEmail(email, account.firstName, otp);
  } catch (err) {
    console.error("[OTP Email] Resend failed:", err);
  }

  return res.json({ success: true, message: "A new verification code has been sent." });
});

/** POST /api/auth/login */
router.post("/login", async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid credentials" });
  const { email, password } = parse.data;
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [account] = await db
    .select()
    .from(customAccounts)
    .where(eq(customAccounts.email, email.toLowerCase()))
    .limit(1);

  if (!account) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  if (!account.isVerified) {
    return res.status(403).json({ error: "Please verify your email before logging in.", needsVerification: true, email: account.email });
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password." });

  await db.update(customAccounts).set({ lastSignedIn: new Date() }).where(eq(customAccounts.id, account.id));

  const token = await signToken({
    accountId: account.id,
    email: account.email,
    orgName: account.orgName,
    planTier: account.planTier ?? "starter",
    tenantId: account.tenantId,
  });

  res.cookie("sb_token", token, {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    success: true,
    account: {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      orgName: account.orgName,
      planTier: account.planTier,
      onboardingCompletedAt: account.onboardingCompletedAt,
    },
  });
});

/** GET /api/auth/me-custom */
router.get("/me-custom", async (req, res) => {
  const token = req.cookies?.sb_token;
  if (!token) return res.json({ account: null });

  const payload = await verifyCustomToken(token);
  if (!payload) return res.json({ account: null });

  const db = await getDb();
  if (!db) return res.json({ account: null });

  const [account] = await db
    .select({
      id: customAccounts.id,
      email: customAccounts.email,
      firstName: customAccounts.firstName,
      lastName: customAccounts.lastName,
      orgName: customAccounts.orgName,
      planTier: customAccounts.planTier,
      onboardingCompletedAt: customAccounts.onboardingCompletedAt,
      tenantId: customAccounts.tenantId,
    })
    .from(customAccounts)
    .where(eq(customAccounts.id, payload.accountId))
    .limit(1);

  return res.json({ account: account ?? null });
});

/** POST /api/auth/logout-custom */
router.post("/logout-custom", (_req, res) => {
  res.clearCookie("sb_token", { path: "/" });
  return res.json({ success: true });
});

/** GET /api/auth/onboarding-progress */
router.get("/onboarding-progress", async (req, res) => {
  const token = req.cookies?.sb_token;
  if (!token) return res.status(401).json({ error: "Unauthorised" });
  const payload = await verifyCustomToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorised" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const steps = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.accountId, payload.accountId));

  return res.json({ steps });
});

/** POST /api/auth/complete-onboarding-step */
router.post("/complete-onboarding-step", async (req, res) => {
  const token = req.cookies?.sb_token;
  if (!token) return res.status(401).json({ error: "Unauthorised" });
  const payload = await verifyCustomToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorised" });

  const { stepKey } = z.object({ stepKey: z.string() }).parse(req.body);
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  await db
    .update(onboardingProgress)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(onboardingProgress.accountId, payload.accountId),
        eq(onboardingProgress.stepKey, stepKey)
      )
    );

  // Check if all steps are complete
  const allSteps = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.accountId, payload.accountId));
  const allDone = allSteps.every((s) => s.completedAt !== null);

  if (allDone) {
    await db
      .update(customAccounts)
      .set({ onboardingCompletedAt: new Date() })
      .where(eq(customAccounts.id, payload.accountId));
  }

  return res.json({ success: true, allComplete: allDone });
});

/** POST /api/auth/complete-onboarding */
router.post("/complete-onboarding", async (req, res) => {
  const token = req.cookies?.sb_token;
  if (!token) return res.status(401).json({ error: "Unauthorised" });
  const payload = await verifyCustomToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorised" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  await db
    .update(customAccounts)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(customAccounts.id, payload.accountId));

  return res.json({ success: true });
});

// ─── Forgot Password ────────────────────────────────────────────────────────

/** POST /api/auth/forgot-password */
router.post("/forgot-password", async (req, res) => {
  const parse = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Valid email required" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  // Always return success to prevent email enumeration
  const [account] = await db.select().from(customAccounts)
    .where(eq(customAccounts.email, parse.data.email)).limit(1);

  if (account && account.isVerified) {
    // Generate a secure token
    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      accountId: account.id,
      token,
      expiresAt,
    });

    const resetUrl = `${req.headers.origin ?? "https://sponsorbridge.com"}/reset-password?token=${token}`;
    const transport = getMailTransport();
    const fromName = process.env.EMAIL_FROM_NAME ?? "SponsorBridge";
    const fromEmail = process.env.EMAIL_FROM ?? "noreply@sponsorbridge.com";

    try {
      await transport.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: account.email,
        subject: "Reset your SponsorBridge password",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <div style="text-align:center;margin-bottom:24px;">
              <img src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-footer-light_b62cd37a.svg" alt="SponsorBridge" style="height:40px;width:auto;display:inline-block;" />
            </div>
            <h2 style="color:#1e3a5f">Reset your password</h2>
            <p>Hi ${account.firstName},</p>
            <p>We received a request to reset the password for your SponsorBridge account associated with <strong>${account.email}</strong>.</p>
            <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
            <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#999;font-size:12px">SponsorBridge — Empowering child sponsorship organisations worldwide.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[Auth] Failed to send password reset email:", err);
    }
  }

  // Always return success to prevent email enumeration
  return res.json({ success: true });
});

/** POST /api/auth/reset-password */
router.post("/reset-password", async (req, res) => {
  const parse = z.object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }).safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues[0]?.message ?? "Invalid request" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [resetToken] = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, parse.data.token)).limit(1);

  if (!resetToken) return res.status(400).json({ error: "Invalid or expired reset link" });
  if (resetToken.usedAt) return res.status(400).json({ error: "This reset link has already been used" });
  if (new Date() > resetToken.expiresAt) return res.status(400).json({ error: "This reset link has expired. Please request a new one." });

  const passwordHash = await bcrypt.hash(parse.data.password, 12);

  await db.update(customAccounts)
    .set({ passwordHash })
    .where(eq(customAccounts.id, resetToken.accountId));

  // Mark token as used
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return res.json({ success: true });
});

/** GET /api/auth/validate-reset-token */
router.get("/validate-reset-token", async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ valid: false, error: "Token required" });

  const db = await getDb();
  if (!db) return res.status(503).json({ valid: false });

  const [resetToken] = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token)).limit(1);

  if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
    return res.json({ valid: false });
  }
  return res.json({ valid: true });
});

export { router as customAuthRouter };
