import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { nanoid } from "nanoid";
import { eq, and, count } from "drizzle-orm";
import { getDb } from "./db";
import { referrals } from "../drizzle/schema";
import {
  acknowledgePolicy,
  appendAuditLog,
  completeSurvey,
  createBackgroundCheck,
  createChild,
  createConsentRecord,
  createIncident,
  createMessage,
  createNotification,
  createPayment,
  createSponsor,
  createSponsorship,
  createSurvey,
  createTenant,
  createVlog,
  getAllTenants,
  getAuditLogs,
  getBackgroundChecks,
  getChildById,
  getChildren,
  getConsentRecords,
  getDashboardStats,
  getIncidents,
  getMessages,
  getNotifications,
  getPayments,
  getSponsorById,
  getSponsorByUserId,
  getSponsorships,
  getSponsorshipById,
  getSponsors,
  getSurveys,
  getTenantById,
  getTenantBySubdomain,
  getUsersByTenant,
  getVlogs,
  markNotificationRead,
  moderateMessage,
  moderateVlog,
  updateBackgroundCheck,
  updateChild,
  updateIncident,
  updateSponsor,
  updateSponsorship,
  updateTenant,
  updateUserRole,
  getSponsorImpactData,
} from "./db";
import { TRPCError } from "@trpc/server";

// ─── PERMISSION HELPERS ───────────────────────────────────────────────────────

const STAFF_ROLES = ["system_admin", "program_manager", "safeguarding_officer", "field_worker", "finance_officer", "sponsor_relations", "volunteer", "admin"];
const MANAGER_ROLES = ["system_admin", "program_manager", "admin"];
const SAFEGUARDING_ROLES = ["system_admin", "safeguarding_officer", "admin"];
const FINANCE_ROLES = ["system_admin", "finance_officer", "admin"];
const MODERATION_ROLES = ["system_admin", "program_manager", "safeguarding_officer", "sponsor_relations", "admin"];

function requireRole(role: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions for this action." });
  }
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    acknowledgePolicy: protectedProcedure
      .input(z.object({ policyVersion: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const ip = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket?.remoteAddress;
        await acknowledgePolicy(ctx.user.id, input.policyVersion, ip);
        await appendAuditLog({ userId: ctx.user.id, action: "POLICY_ACKNOWLEDGED", entityType: "user", entityId: String(ctx.user.id), afterValue: { policyVersion: input.policyVersion } });
        return { success: true };
      }),
  }),

  // ─── TENANTS ───────────────────────────────────────────────────────────────
  tenants: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["system_admin", "admin"]);
      return getAllTenants();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...STAFF_ROLES]);
        return getTenantById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(2), subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/) }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["system_admin", "admin"]);
        const existing = await getTenantBySubdomain(input.subdomain);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Subdomain already taken." });
        await createTenant(input);
        await appendAuditLog({ userId: ctx.user.id, action: "TENANT_CREATED", entityType: "tenant", afterValue: input });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        featureVlogs: z.boolean().optional(),
        featurePooling: z.boolean().optional(),
        featureTranslation: z.boolean().optional(),
        featureSocialSharing: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES]);
        const { id, ...data } = input;
        await updateTenant(id, data);
        await appendAuditLog({ userId: ctx.user.id, tenantId: id, action: "TENANT_UPDATED", entityType: "tenant", entityId: String(id), afterValue: data });
        return { success: true };
      }),
  }),

  // ─── USERS / RBAC ──────────────────────────────────────────────────────────
  users: router({
    listByTenant: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
        return getUsersByTenant(input.tenantId);
      }),
    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["system_admin", "program_manager", "safeguarding_officer", "field_worker", "finance_officer", "sponsor_relations", "volunteer", "sponsor"]) }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["system_admin", "admin"]);
        await updateUserRole(input.userId, input.role);
        await appendAuditLog({ userId: ctx.user.id, action: "USER_ROLE_UPDATED", entityType: "user", entityId: String(input.userId), afterValue: { role: input.role } });
        return { success: true };
      }),
  }),

  // ─── CHILDREN ──────────────────────────────────────────────────────────────
  children: router({
    list: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        status: z.string().optional(),
        gender: z.string().optional(),
        country: z.string().optional(),
        search: z.string().optional(),
        ageMin: z.number().optional(),
        ageMax: z.number().optional(),
        hasSpecialNeeds: z.boolean().optional(),
      }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        const { tenantId, ...filters } = input;
        return getChildren(tenantId, filters);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        return getChildById(input.id, input.tenantId);
      }),
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.date().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        bio: z.string().optional(),
        interests: z.string().optional(),
        educationLevel: z.string().optional(),
        schoolName: z.string().optional(),
        healthStatus: z.string().optional(),
        programType: z.string().optional(),
        hasSpecialNeeds: z.boolean().optional(),
        specialNeedsDetails: z.string().optional(),
        parentalConsentGranted: z.boolean().optional(),
        photoConsentGranted: z.boolean().optional(),
        videoConsentGranted: z.boolean().optional(),
        assignedFieldWorkerId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "field_worker"]);
        await createChild(input as any);
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "CHILD_CREATED", entityType: "child", afterValue: { firstName: input.firstName, lastName: input.lastName } });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        status: z.enum(["AVAILABLE", "SPONSORED", "GRADUATED", "WAITLISTED"]).optional(),
        bio: z.string().optional(),
        educationLevel: z.string().optional(),
        healthStatus: z.string().optional(),
        parentalConsentGranted: z.boolean().optional(),
        parentalConsentExpiry: z.date().optional(),
        photoConsentGranted: z.boolean().optional(),
        videoConsentGranted: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "field_worker"]);
        const { id, tenantId, ...data } = input;
        const before = await getChildById(id, tenantId);
        await updateChild(id, tenantId, data as any);
        await appendAuditLog({ userId: ctx.user.id, tenantId, action: "CHILD_UPDATED", entityType: "child", entityId: String(id), beforeValue: before, afterValue: data });
        return { success: true };
      }),
    uploadPhoto: protectedProcedure
      .input(z.object({ childId: z.number(), tenantId: z.number(), photoUrl: z.string(), photoKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "field_worker"]);
        await updateChild(input.childId, input.tenantId, { photoUrl: input.photoUrl, photoKey: input.photoKey });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "CHILD_PHOTO_UPLOADED", entityType: "child", entityId: String(input.childId) });
        return { success: true };
      }),
  }),

  // ─── SPONSORS ──────────────────────────────────────────────────────────────
  sponsors: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), search: z.string().optional(), isActive: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations", "finance_officer"]);
        const { tenantId, ...filters } = input;
        return getSponsors(tenantId, filters);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
        return getSponsorById(input.id, input.tenantId);
      }),
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return getSponsorByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        country: z.string().optional(),
        preferredChildAgeMin: z.number().optional(),
        preferredChildAgeMax: z.number().optional(),
        preferredGender: z.enum(["male", "female", "no_preference"]).optional(),
        preferredCountry: z.string().optional(),
        communicationStyle: z.enum(["frequent", "occasional", "minimal"]).optional(),
        marketingConsent: z.boolean().optional(),
        dataConsent: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createSponsor({ ...input, userId: ctx.user.id });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "SPONSOR_CREATED", entityType: "sponsor", afterValue: { email: input.email } });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        preferredChildAgeMin: z.number().optional(),
        preferredChildAgeMax: z.number().optional(),
        preferredGender: z.enum(["male", "female", "no_preference"]).optional(),
        communicationStyle: z.enum(["frequent", "occasional", "minimal"]).optional(),
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, tenantId, ...data } = input;
        await updateSponsor(id, tenantId, data);
        await appendAuditLog({ userId: ctx.user.id, tenantId, action: "SPONSOR_UPDATED", entityType: "sponsor", entityId: String(id), afterValue: data });
        return { success: true };
      }),
  }),

  // ─── SPONSORSHIPS / MATCHING ───────────────────────────────────────────────
  sponsorships: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), status: z.string().optional(), sponsorId: z.number().optional(), childId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        const { tenantId, ...filters } = input;
        return getSponsorships(tenantId, filters);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        return getSponsorshipById(input.id, input.tenantId);
      }),
    requestMatch: protectedProcedure
      .input(z.object({ tenantId: z.number(), childId: z.number(), sponsorId: z.number(), matchedBy: z.enum(["sponsor_choice", "child_choice", "algorithm", "staff"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        await createSponsorship({ ...input, status: "pending_approval", matchedBy: input.matchedBy ?? "sponsor_choice" });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "MATCH_REQUESTED", entityType: "sponsorship", afterValue: input });
        return { success: true };
      }),
    approve: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MANAGER_ROLES);
        const now = new Date();
        await updateSponsorship(input.id, input.tenantId, {
          status: "active",
          approvedById: ctx.user.id,
          approvedAt: now,
          startDate: now,
        });
        // Update child status to SPONSORED
        const sponsorship = await getSponsorshipById(input.id, input.tenantId);
        if (sponsorship) {
          await updateChild(sponsorship.childId, input.tenantId, { status: "SPONSORED" });
        }
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "MATCH_APPROVED", entityType: "sponsorship", entityId: String(input.id) });
        return { success: true };
      }),
    reject: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MANAGER_ROLES);
        await updateSponsorship(input.id, input.tenantId, { status: "cancelled", notes: input.notes });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "MATCH_REJECTED", entityType: "sponsorship", entityId: String(input.id) });
        return { success: true };
      }),
    pause: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MANAGER_ROLES);
        await updateSponsorship(input.id, input.tenantId, { status: "paused" });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "SPONSORSHIP_PAUSED", entityType: "sponsorship", entityId: String(input.id) });
        return { success: true };
      }),
    complete: protectedProcedure
      .input(z.object({ id: z.number(), tenantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MANAGER_ROLES);
        await updateSponsorship(input.id, input.tenantId, { status: "completed", endDate: new Date() });
        const sponsorship = await getSponsorshipById(input.id, input.tenantId);
        if (sponsorship) {
          await updateChild(sponsorship.childId, input.tenantId, { status: "GRADUATED" });
        }
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "SPONSORSHIP_COMPLETED", entityType: "sponsorship", entityId: String(input.id) });
        return { success: true };
      }),
  }),

  // ─── VLOGS ─────────────────────────────────────────────────────────────────
  vlogs: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), status: z.string().optional(), sponsorshipId: z.number().optional(), childId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        const { tenantId, ...filters } = input;
        return getVlogs(tenantId, filters);
      }),
    upload: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        sponsorshipId: z.number().optional(),
        childId: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        videoUrl: z.string(),
        videoKey: z.string(),
        durationSeconds: z.number().optional(),
        fileSize: z.number().optional(),
        direction: z.enum(["child_to_sponsor", "sponsor_to_child"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createVlog({ ...input, uploadedById: ctx.user.id, metadataStripped: true });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "VLOG_UPLOADED", entityType: "vlog", afterValue: { title: input.title, childId: input.childId } });
        return { success: true };
      }),
    moderate: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["approved", "rejected", "flagged"]),
        notes: z.string().optional(),
        isSafeguardingConcern: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MODERATION_ROLES);
        await moderateVlog(input.id, input.tenantId, input.status, ctx.user.id, input.notes, input.isSafeguardingConcern);
        if (input.isSafeguardingConcern) {
          await createIncident({
            tenantId: input.tenantId,
            reportedById: ctx.user.id,
            relatedVlogId: input.id,
            title: "Safeguarding concern flagged in vlog",
            description: input.notes ?? "Content flagged during moderation review.",
            priority: "urgent",
            isEmergency: true,
          });
        }
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: `VLOG_${input.status.toUpperCase()}`, entityType: "vlog", entityId: String(input.id) });
        return { success: true };
      }),
  }),

  // ─── MESSAGES ──────────────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), status: z.string().optional(), sponsorshipId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, STAFF_ROLES);
        const { tenantId, ...filters } = input;
        return getMessages(tenantId, filters);
      }),
    send: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        sponsorshipId: z.number(),
        direction: z.enum(["sponsor_to_child", "child_to_sponsor"]),
        originalText: z.string().min(1),
        originalLanguage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createMessage({ ...input, senderId: ctx.user.id });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "MESSAGE_SENT", entityType: "message", afterValue: { direction: input.direction, sponsorshipId: input.sponsorshipId } });
        return { success: true };
      }),
    moderate: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["approved", "rejected", "flagged", "quarantined"]),
        notes: z.string().optional(),
        isSafeguardingConcern: z.boolean().optional(),
        translatedText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, MODERATION_ROLES);
        await moderateMessage(input.id, input.tenantId, input.status, ctx.user.id, input.notes, input.isSafeguardingConcern);
        if (input.isSafeguardingConcern) {
          await createIncident({
            tenantId: input.tenantId,
            reportedById: ctx.user.id,
            relatedMessageId: input.id,
            title: "Safeguarding concern flagged in message",
            description: input.notes ?? "Message flagged during moderation review.",
            priority: "urgent",
            isEmergency: true,
          });
        }
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: `MESSAGE_${input.status.toUpperCase()}`, entityType: "message", entityId: String(input.id) });
        return { success: true };
      }),
  }),

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  payments: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), sponsorId: z.number().optional(), status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...FINANCE_ROLES, "program_manager"]);
        const { tenantId, ...filters } = input;
        return getPayments(tenantId, filters);
      }),
    record: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        sponsorshipId: z.number(),
        sponsorId: z.number(),
        amount: z.number(),
        currency: z.string().optional(),
        stripePaymentIntentId: z.string().optional(),
        stripeInvoiceId: z.string().optional(),
        status: z.enum(["pending", "succeeded", "failed", "refunded", "disputed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...FINANCE_ROLES]);
        await createPayment(input);
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "PAYMENT_RECORDED", entityType: "payment", afterValue: { amount: input.amount, status: input.status } });
        return { success: true };
      }),
  }),

  // ─── SURVEYS ───────────────────────────────────────────────────────────────
  surveys: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), type: z.string().optional(), status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
        const { tenantId, ...filters } = input;
        return getSurveys(tenantId, filters);
      }),
    send: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        sponsorId: z.number(),
        sponsorshipId: z.number().optional(),
        type: z.enum(["nps", "csat"]),
        trigger: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations"]);
        await createSurvey(input);
        return { success: true };
      }),
    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        npsScore: z.number().min(0).max(10).optional(),
        csatScore: z.number().min(1).max(5).optional(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await completeSurvey(input.id, input.tenantId, input.npsScore, input.csatScore, input.feedback);
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "SURVEY_COMPLETED", entityType: "survey", entityId: String(input.id) });
        return { success: true };
      }),
  }),

  // ─── SAFEGUARDING ──────────────────────────────────────────────────────────
  safeguarding: router({
    listIncidents: protectedProcedure
      .input(z.object({ tenantId: z.number(), status: z.string().optional(), priority: z.string().optional(), childId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES, "program_manager"]);
        const { tenantId, ...filters } = input;
        return getIncidents(tenantId, filters);
      }),
    reportIncident: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        childId: z.number().optional(),
        title: z.string().min(5),
        description: z.string().min(10),
        isAnonymous: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        isEmergency: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createIncident({
          ...input,
          reportedById: input.isAnonymous ? undefined : ctx.user.id,
        });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "INCIDENT_REPORTED", entityType: "incident", afterValue: { title: input.title, priority: input.priority } });
        return { success: true };
      }),
    updateIncident: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["open", "triaged", "under_investigation", "referred", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedToId: z.number().optional(),
        outcome: z.string().optional(),
        referredToAuthorities: z.boolean().optional(),
        referralDetails: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES, "program_manager"]);
        const { id, tenantId, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.status === "closed") updateData.closedAt = new Date();
        await updateIncident(id, tenantId, updateData as any);
        await appendAuditLog({ userId: ctx.user.id, tenantId, action: "INCIDENT_UPDATED", entityType: "incident", entityId: String(id), afterValue: data });
        return { success: true };
      }),
    listBackgroundChecks: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES, "program_manager"]);
        return getBackgroundChecks(input.tenantId);
      }),
    updateBackgroundCheck: protectedProcedure
      .input(z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["pending", "under_review", "verified", "expired", "failed"]),
        expiresAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES]);
        const { id, tenantId, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.status === "verified") { updateData.verifiedById = ctx.user.id; updateData.verifiedAt = new Date(); }
        await updateBackgroundCheck(id, tenantId, updateData as any);
        await appendAuditLog({ userId: ctx.user.id, tenantId, action: "BACKGROUND_CHECK_UPDATED", entityType: "background_check", entityId: String(id), afterValue: data });
        return { success: true };
      }),
  }),

  // ─── AUDIT LOGS ────────────────────────────────────────────────────────────
  audit: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), entityType: z.string().optional(), entityId: z.string().optional(), userId: z.number().optional(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES, "program_manager", "finance_officer"]);
        const { tenantId, ...filters } = input;
        return getAuditLogs(tenantId, filters);
      }),
  }),

  // ─── CONSENT ───────────────────────────────────────────────────────────────
  consent: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), childId: z.number().optional(), sponsorId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...SAFEGUARDING_ROLES, "program_manager"]);
        const { tenantId, ...filters } = input;
        return getConsentRecords(tenantId, filters);
      }),
    record: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        childId: z.number().optional(),
        sponsorId: z.number().optional(),
        consentType: z.enum(["parental", "sponsor_data", "marketing", "photo_video", "gdpr"]),
        granted: z.boolean(),
        expiresAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "safeguarding_officer"]);
        await createConsentRecord({ ...input, grantedAt: new Date() });
        await appendAuditLog({ userId: ctx.user.id, tenantId: input.tenantId, action: "CONSENT_RECORDED", entityType: "consent", afterValue: { consentType: input.consentType, granted: input.granted } });
        return { success: true };
      }),
  }),

  // ─── ANALYTICS ─────────────────────────────────────────────────────────────
  analytics: router({
    dashboard: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...MANAGER_ROLES, "sponsor_relations", "finance_officer"]);
        return getDashboardStats(input.tenantId);
      }),
    sponsorImpact: protectedProcedure
      .input(z.object({ sponsorId: z.number(), tenantId: z.number() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, [...STAFF_ROLES]);
        return getSponsorImpactData(input.sponsorId, input.tenantId);
      }),
  }),

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
  // ─── COMMUNITY & AMBASSADOR PROGRAM ──────────────────────────────────────────────
  community: router({
    // Get or create the current user's referral code
    myReferralCode: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Find existing referral record for this user (as referrer)
      const existing = await db.select().from(referrals)
        .where(eq(referrals.referrerId, ctx.user.id))
        .limit(1);
      if (existing.length > 0) {
        return { code: existing[0].referralCode };
      }
      // Create a new referral code
      const code = `SB-${ctx.user.id}-${nanoid(5).toUpperCase()}`;
      await db.insert(referrals).values({
        referrerId: ctx.user.id,
        referralCode: code,
        status: "pending",
      });
      return { code };
    }),
    // Get referral stats for the current user
    myStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [result] = await db.select({ total: count() }).from(referrals)
        .where(and(eq(referrals.referrerId, ctx.user.id), eq(referrals.status, "converted")));
      const convertedCount = result?.total ?? 0;
      // Determine ambassador tier
      let tier = "Advocate";
      if (convertedCount >= 25) tier = "Patron";
      else if (convertedCount >= 10) tier = "Ambassador";
      else if (convertedCount >= 3) tier = "Champion";
      return {
        referralCount: convertedCount,
        tier,
        monthlyImpact: convertedCount * 40,
      };
    }),
    // Track a referral conversion (called when a referred user signs up)
    trackConversion: publicProcedure
      .input(z.object({ referralCode: z.string() }))
      .mutation(async ({ ctx }) => {
        // This would be called during signup flow
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
