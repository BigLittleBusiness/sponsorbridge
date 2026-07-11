import { z } from "zod/v4";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  platformSettings,
  featureFlags,
  tenants,
  users,
  auditLogs,
  payments,
  customAccounts,
} from "../../drizzle/schema";

// Only system_admin role can access these procedures
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "system_admin" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "System admin access required" });
  }
  return next({ ctx });
});

export const sysAdminRouter = router({
  // ── PLATFORM SETTINGS ────────────────────────────────────────────────────
  getSettings: adminProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.category
        ? [eq(platformSettings.category, input.category)]
        : [];
      const rows = await db.select().from(platformSettings)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(platformSettings.category, platformSettings.settingKey);
      // Mask secret values in response
      return rows.map(r => ({
        ...r,
        settingValue: r.isSecret ? (r.settingValue ? "••••••••" : null) : r.settingValue,
      }));
    }),

  upsertSetting: adminProcedure
    .input(z.object({
      settingKey: z.string().min(1).max(128),
      settingValue: z.string().nullable(),
      category: z.string().min(1).max(64),
      isSecret: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(platformSettings).values({
        settingKey: input.settingKey,
        settingValue: input.settingValue,
        category: input.category,
        isSecret: input.isSecret,
        updatedBy: ctx.user.id,
      }).onDuplicateKeyUpdate({
        set: {
          settingValue: input.settingValue,
          isSecret: input.isSecret,
          updatedBy: ctx.user.id,
        },
      });
      // Audit log
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? undefined,
        action: "platform_setting_updated",
        entityType: "platform_settings",
        entityId: input.settingKey,
        afterValue: { key: input.settingKey, category: input.category },
      });
      return { success: true };
    }),

  testEmailConfig: adminProcedure
    .input(z.object({ toEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      // In production this would use the stored SES/SMTP settings to send a test email
      // For now, return a structured response indicating what would happen
      return {
        success: true,
        message: `Test email would be sent to ${input.toEmail} using the configured SES/SMTP settings.`,
        note: "Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM in the Email settings tab to enable live sending.",
      };
    }),

  // ── FEATURE FLAGS ─────────────────────────────────────────────────────────
  getFeatureFlags: adminProcedure
    .input(z.object({ tenantId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = input.tenantId !== undefined
        ? [eq(featureFlags.tenantId, input.tenantId)]
        : [isNull(featureFlags.tenantId)];
      return db.select().from(featureFlags).where(and(...conditions)).orderBy(featureFlags.flagKey);
    }),

  upsertFeatureFlag: adminProcedure
    .input(z.object({
      flagKey: z.string().min(1).max(128),
      tenantId: z.number().nullable().optional(),
      enabled: z.boolean(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(featureFlags).values({
        flagKey: input.flagKey,
        tenantId: input.tenantId ?? null,
        enabled: input.enabled,
        description: input.description,
        updatedBy: ctx.user.id,
      }).onDuplicateKeyUpdate({
        set: { enabled: input.enabled, description: input.description, updatedBy: ctx.user.id },
      });
      return { success: true };
    }),

  // ── TENANT MANAGEMENT ─────────────────────────────────────────────────────
  listTenants: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const allTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    // Enrich with user counts
    const enriched = await Promise.all(allTenants.map(async (t) => {
      const [userCount] = await db.select({ count: sql<number>`count(*)` })
        .from(users).where(eq(users.tenantId, t.id));
      const [paymentSum] = await db.select({ total: sql<number>`coalesce(sum(amount),0)` })
        .from(payments).where(and(eq(payments.tenantId, t.id), eq(payments.status, "succeeded")));
      return {
        ...t,
        userCount: Number(userCount?.count ?? 0),
        totalRevenueCents: Number(paymentSum?.total ?? 0),
      };
    }));
    return enriched;
  }),

  updateTenantStatus: adminProcedure
    .input(z.object({ tenantId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(tenants).set({ isActive: input.isActive }).where(eq(tenants.id, input.tenantId));
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? undefined,
        action: input.isActive ? "tenant_activated" : "tenant_suspended",
        entityType: "tenants",
        entityId: String(input.tenantId),
      });
      return { success: true };
    }),

  // ── PLATFORM BILLING OVERVIEW ─────────────────────────────────────────────
  getBillingOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [totalAccounts] = await db.select({ count: sql<number>`count(*)` }).from(customAccounts);
    const [verifiedAccounts] = await db.select({ count: sql<number>`count(*)` })
      .from(customAccounts).where(eq(customAccounts.isVerified, true));

    // Revenue by tier
    const tierBreakdown = await db.select({
      tier: customAccounts.planTier,
      count: sql<number>`count(*)`,
    }).from(customAccounts).where(eq(customAccounts.isVerified, true))
      .groupBy(customAccounts.planTier);

    // Total payments in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentRevenue] = await db.select({ total: sql<number>`coalesce(sum(amount),0)` })
      .from(payments).where(
        and(eq(payments.status, "succeeded"), sql`${payments.paidAt} >= ${thirtyDaysAgo}`)
      );

    // All-time revenue
    const [allTimeRevenue] = await db.select({ total: sql<number>`coalesce(sum(amount),0)` })
      .from(payments).where(eq(payments.status, "succeeded"));

    return {
      totalAccounts: Number(totalAccounts?.count ?? 0),
      verifiedAccounts: Number(verifiedAccounts?.count ?? 0),
      tierBreakdown: tierBreakdown.map(t => ({ tier: t.tier, count: Number(t.count) })),
      last30DaysRevenueCents: Number(recentRevenue?.total ?? 0),
      allTimeRevenueCents: Number(allTimeRevenue?.total ?? 0),
    };
  }),

  // ── SYSTEM HEALTH ─────────────────────────────────────────────────────────
  getSystemHealth: adminProcedure.query(async () => {
    const db = await getDb();
    const dbConnected = !!db;

    let dbTableCount = 0;
    if (db) {
      try {
        const [result] = await db.execute(sql`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE()`);
        dbTableCount = Number((result as any)?.[0]?.cnt ?? 0);
      } catch { /* ignore */ }
    }

    return {
      database: { connected: dbConnected, tableCount: dbTableCount },
      server: { uptime: Math.floor(process.uptime()), memoryMb: Math.floor(process.memoryUsage().rss / 1024 / 1024) },
      timestamp: new Date().toISOString(),
    };
  }),

  // ── AUDIT LOG VIEWER ──────────────────────────────────────────────────────
  getAuditLogs: adminProcedure
    .input(z.object({
      tenantId: z.number().optional(),
      action: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [];
      if (input.tenantId) conditions.push(eq(auditLogs.tenantId, input.tenantId));
      if (input.action) conditions.push(eq(auditLogs.action, input.action));
      const rows = await db.select().from(auditLogs)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),

  // ── REGISTERED ACCOUNTS ───────────────────────────────────────────────────
  listAccounts: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select({
        id: customAccounts.id,
        orgName: customAccounts.orgName,
        email: customAccounts.email,
        firstName: customAccounts.firstName,
        lastName: customAccounts.lastName,
        planTier: customAccounts.planTier,
        isVerified: customAccounts.isVerified,
        createdAt: customAccounts.createdAt,
        lastSignedIn: customAccounts.lastSignedIn,
        onboardingCompletedAt: customAccounts.onboardingCompletedAt,
      }).from(customAccounts)
        .orderBy(desc(customAccounts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),
});
