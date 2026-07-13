import { z } from "zod/v4";
import { eq, desc, and, isNull, sql, gte, like, or } from "drizzle-orm";
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
  children,
  sponsors,
  sponsorships,
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

  // ── PLATFORM OVERVIEW (new holistic stats) ────────────────────────────────
  getPlatformOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [[totalOrgs], [totalSponsors], [totalChildren], [activeSpons], [activeSponsorships],
      [newOrgs30d], [newSponsors30d], [totalPayments], [recentPayments]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customAccounts),
      db.select({ count: sql<number>`count(*)` }).from(sponsors),
      db.select({ count: sql<number>`count(*)` }).from(children),
      db.select({ count: sql<number>`count(*)` }).from(sponsors).where(eq(sponsors.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(sponsorships).where(eq(sponsorships.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(customAccounts).where(gte(customAccounts.createdAt, thirtyDaysAgo)),
      db.select({ count: sql<number>`count(*)` }).from(sponsors).where(gte(sponsors.createdAt, thirtyDaysAgo)),
      db.select({ total: sql<number>`coalesce(sum(amount),0)` }).from(payments).where(eq(payments.status, "succeeded")),
      db.select({ total: sql<number>`coalesce(sum(amount),0)` }).from(payments).where(and(eq(payments.status, "succeeded"), gte(payments.paidAt, thirtyDaysAgo))),
    ]);

    // Children by status
    const childrenByStatus = await db.select({
      status: children.status,
      count: sql<number>`count(*)`,
    }).from(children).groupBy(children.status);

    // Sponsorships by status
    const sponsorshipsByStatus = await db.select({
      status: sponsorships.status,
      count: sql<number>`count(*)`,
    }).from(sponsorships).groupBy(sponsorships.status);

    // Signups per day for last 30 days (client orgs)
    const signupTrend = await db.select({
      day: sql<string>`DATE(${customAccounts.createdAt})`,
      count: sql<number>`count(*)`,
    }).from(customAccounts)
      .where(gte(customAccounts.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${customAccounts.createdAt})`)
      .orderBy(sql`DATE(${customAccounts.createdAt})`);

    // New sponsors per day for last 30 days
    const sponsorTrend = await db.select({
      day: sql<string>`DATE(${sponsors.createdAt})`,
      count: sql<number>`count(*)`,
    }).from(sponsors)
      .where(gte(sponsors.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${sponsors.createdAt})`)
      .orderBy(sql`DATE(${sponsors.createdAt})`);

    // Accounts verified vs unverified
    const [verifiedCount] = await db.select({ count: sql<number>`count(*)` })
      .from(customAccounts).where(eq(customAccounts.isVerified, true));

    // Active users in last 7 days
    const [activeUsers7d] = await db.select({ count: sql<number>`count(*)` })
      .from(customAccounts).where(gte(customAccounts.lastSignedIn, sevenDaysAgo));

    return {
      totalOrgs: Number(totalOrgs?.count ?? 0),
      totalSponsors: Number(totalSponsors?.count ?? 0),
      totalChildren: Number(totalChildren?.count ?? 0),
      activeSponsors: Number(activeSpons?.count ?? 0),
      activeSponsorships: Number(activeSponsorships?.count ?? 0),
      newOrgs30d: Number(newOrgs30d?.count ?? 0),
      newSponsors30d: Number(newSponsors30d?.count ?? 0),
      allTimeRevenueCents: Number(totalPayments?.total ?? 0),
      last30DaysRevenueCents: Number(recentPayments?.total ?? 0),
      verifiedOrgs: Number(verifiedCount?.count ?? 0),
      activeUsers7d: Number(activeUsers7d?.count ?? 0),
      childrenByStatus: childrenByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      sponsorshipsByStatus: sponsorshipsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      signupTrend: signupTrend.map(r => ({ day: r.day, count: Number(r.count) })),
      sponsorTrend: sponsorTrend.map(r => ({ day: r.day, count: Number(r.count) })),
    };
  }),

  // ── CLIENT ACCOUNTS — searchable/filterable ───────────────────────────────
  searchAccounts: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      planTier: z.enum(["starter", "growth", "professional", "enterprise"]).optional(),
      isVerified: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions: any[] = [];
      if (input.search) {
        conditions.push(or(
          like(customAccounts.orgName, `%${input.search}%`),
          like(customAccounts.email, `%${input.search}%`),
          like(customAccounts.firstName, `%${input.search}%`),
          like(customAccounts.lastName, `%${input.search}%`),
        ));
      }
      if (input.planTier) conditions.push(eq(customAccounts.planTier, input.planTier));
      if (input.isVerified !== undefined) conditions.push(eq(customAccounts.isVerified, input.isVerified));

      const rows = await db.select({
        id: customAccounts.id,
        orgName: customAccounts.orgName,
        orgCountry: customAccounts.orgCountry,
        orgSize: customAccounts.orgSize,
        email: customAccounts.email,
        firstName: customAccounts.firstName,
        lastName: customAccounts.lastName,
        jobTitle: customAccounts.jobTitle,
        planTier: customAccounts.planTier,
        isVerified: customAccounts.isVerified,
        createdAt: customAccounts.createdAt,
        lastSignedIn: customAccounts.lastSignedIn,
        onboardingCompletedAt: customAccounts.onboardingCompletedAt,
        tenantId: customAccounts.tenantId,
      }).from(customAccounts)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(customAccounts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Enrich with per-tenant counts
      const enriched = await Promise.all(rows.map(async (acc) => {
        if (!acc.tenantId) return { ...acc, childCount: 0, sponsorCount: 0, activeSponsorships: 0 };
        const [[childCount], [sponsorCount], [activeSponsorshipCount]] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(children).where(eq(children.tenantId, acc.tenantId)),
          db.select({ count: sql<number>`count(*)` }).from(sponsors).where(eq(sponsors.tenantId, acc.tenantId)),
          db.select({ count: sql<number>`count(*)` }).from(sponsorships).where(and(eq(sponsorships.tenantId, acc.tenantId), eq(sponsorships.status, "active"))),
        ]);
        return {
          ...acc,
          childCount: Number(childCount?.count ?? 0),
          sponsorCount: Number(sponsorCount?.count ?? 0),
          activeSponsorships: Number(activeSponsorshipCount?.count ?? 0),
        };
      }));

      const [totalRow] = await db.select({ count: sql<number>`count(*)` })
        .from(customAccounts)
        .where(conditions.length ? and(...conditions) : undefined);

      return { rows: enriched, total: Number(totalRow?.count ?? 0) };
    }),

  // ── UPDATE ACCOUNT PLAN / VERIFIED STATUS ─────────────────────────────────
  updateAccount: adminProcedure
    .input(z.object({
      accountId: z.number(),
      planTier: z.enum(["starter", "growth", "professional", "enterprise"]).optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updates: Record<string, any> = {};
      if (input.planTier !== undefined) updates.planTier = input.planTier;
      if (input.isVerified !== undefined) updates.isVerified = input.isVerified;
      if (Object.keys(updates).length === 0) return { success: true };
      await db.update(customAccounts).set(updates).where(eq(customAccounts.id, input.accountId));
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? undefined,
        action: "account_updated",
        entityType: "custom_accounts",
        entityId: String(input.accountId),
        afterValue: updates,
      });
      return { success: true };
    }),

  // ── SPONSOR USERS — cross-tenant list ────────────────────────────────────
  listSponsors: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions: any[] = [];
      if (input.search) {
        conditions.push(or(
          like(sponsors.firstName, `%${input.search}%`),
          like(sponsors.lastName, `%${input.search}%`),
          like(sponsors.email, `%${input.search}%`),
          like(sponsors.country, `%${input.search}%`),
        ));
      }
      if (input.isActive !== undefined) conditions.push(eq(sponsors.isActive, input.isActive));

      const rows = await db.select({
        id: sponsors.id,
        tenantId: sponsors.tenantId,
        firstName: sponsors.firstName,
        lastName: sponsors.lastName,
        email: sponsors.email,
        country: sponsors.country,
        isActive: sponsors.isActive,
        createdAt: sponsors.createdAt,
        stripeCustomerId: sponsors.stripeCustomerId,
      }).from(sponsors)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(sponsors.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Enrich with active sponsorship count and tenant name
      const enriched = await Promise.all(rows.map(async (s) => {
        const [[sponsorshipCount], tenant] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(sponsorships)
            .where(and(eq(sponsorships.sponsorId, s.id), eq(sponsorships.status, "active"))),
          db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, s.tenantId)).limit(1),
        ]);
        return {
          ...s,
          activeSponsorships: Number(sponsorshipCount?.count ?? 0),
          tenantName: tenant[0]?.name ?? "Unknown",
        };
      }));

      const [totalRow] = await db.select({ count: sql<number>`count(*)` })
        .from(sponsors)
        .where(conditions.length ? and(...conditions) : undefined);

      return { rows: enriched, total: Number(totalRow?.count ?? 0) };
    }),

  // ── TOGGLE SPONSOR ACTIVE STATUS ─────────────────────────────────────────
  updateSponsorStatus: adminProcedure
    .input(z.object({ sponsorId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(sponsors).set({ isActive: input.isActive }).where(eq(sponsors.id, input.sponsorId));
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? undefined,
        action: input.isActive ? "sponsor_activated" : "sponsor_deactivated",
        entityType: "sponsors",
        entityId: String(input.sponsorId),
      });
      return { success: true };
    }),
});
