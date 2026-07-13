import { and, desc, eq, gte, isNull, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  backgroundChecks,
  children,
  childUpdates,
  consentRecords,
  InsertUser,
  messages,
  notifications,
  payments,
  policyAcknowledgments,
  safeguardingIncidents,
  sponsors,
  sponsorships,
  surveys,
  tenants,
  users,
  vlogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── TENANTS ──────────────────────────────────────────────────────────────────

export async function createTenant(data: { name: string; subdomain: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tenants).values(data);
  return result;
}

export async function getTenantBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
  return result[0];
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0];
}

export async function getAllTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function updateTenant(id: number, data: Partial<typeof tenants.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, id));
}

// ─── POLICY ACKNOWLEDGMENTS ───────────────────────────────────────────────────

export async function acknowledgePolicy(userId: number, policyVersion: string, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(policyAcknowledgments).values({ userId, policyVersion, ipAddress });
  await db.update(users).set({ policyAcknowledgedAt: new Date(), policyVersion, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getLatestPolicyAck(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(policyAcknowledgments).where(eq(policyAcknowledgments.userId, userId)).orderBy(desc(policyAcknowledgments.acknowledgedAt)).limit(1);
  return result[0];
}

// ─── CHILDREN ─────────────────────────────────────────────────────────────────

export async function getChildren(tenantId: number, filters?: {
  status?: string; gender?: string; country?: string; search?: string;
  ageMin?: number; ageMax?: number; hasSpecialNeeds?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(children.tenantId, tenantId), eq(children.isActive, true)];
  if (filters?.status) conditions.push(eq(children.status, filters.status as any));
  if (filters?.gender) conditions.push(eq(children.gender, filters.gender as any));
  if (filters?.country) conditions.push(eq(children.country, filters.country));
  if (filters?.hasSpecialNeeds !== undefined) conditions.push(eq(children.hasSpecialNeeds, filters.hasSpecialNeeds));
  if (filters?.search) {
    conditions.push(or(
      like(children.firstName, `%${filters.search}%`),
      like(children.lastName, `%${filters.search}%`),
      like(children.bio, `%${filters.search}%`),
    )!);
  }
  if (filters?.ageMin) {
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - filters.ageMin);
    conditions.push(lte(children.dateOfBirth, maxDob));
  }
  if (filters?.ageMax) {
    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - filters.ageMax - 1);
    conditions.push(gte(children.dateOfBirth, minDob));
  }

  return db.select().from(children).where(and(...conditions)).orderBy(desc(children.createdAt));
}

export async function getChildById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(children).where(and(eq(children.id, id), eq(children.tenantId, tenantId))).limit(1);
  return result[0];
}

export async function createChild(data: typeof children.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(children).values(data);
  return result;
}

export async function updateChild(id: number, tenantId: number, data: Partial<typeof children.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(children).set({ ...data, updatedAt: new Date() }).where(and(eq(children.id, id), eq(children.tenantId, tenantId)));
}

// ─── SPONSORS ─────────────────────────────────────────────────────────────────

export async function getSponsors(tenantId: number, filters?: { search?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(sponsors.tenantId, tenantId)];
  if (filters?.isActive !== undefined) conditions.push(eq(sponsors.isActive, filters.isActive));
  if (filters?.search) {
    conditions.push(or(
      like(sponsors.firstName, `%${filters.search}%`),
      like(sponsors.lastName, `%${filters.search}%`),
      like(sponsors.email, `%${filters.search}%`),
    )!);
  }
  return db.select().from(sponsors).where(and(...conditions)).orderBy(desc(sponsors.createdAt));
}

export async function getSponsorById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sponsors).where(and(eq(sponsors.id, id), eq(sponsors.tenantId, tenantId))).limit(1);
  return result[0];
}

export async function getSponsorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sponsors).where(eq(sponsors.userId, userId)).limit(1);
  return result[0];
}

export async function createSponsor(data: typeof sponsors.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(sponsors).values(data);
  return result;
}

export async function updateSponsor(id: number, tenantId: number, data: Partial<typeof sponsors.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sponsors).set({ ...data, updatedAt: new Date() }).where(and(eq(sponsors.id, id), eq(sponsors.tenantId, tenantId)));
}

// ─── SPONSORSHIPS ─────────────────────────────────────────────────────────────

export async function getSponsorships(tenantId: number, filters?: { status?: string; sponsorId?: number; childId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(sponsorships.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(sponsorships.status, filters.status as any));
  if (filters?.sponsorId) conditions.push(eq(sponsorships.sponsorId, filters.sponsorId));
  if (filters?.childId) conditions.push(eq(sponsorships.childId, filters.childId));
  return db.select().from(sponsorships).where(and(...conditions)).orderBy(desc(sponsorships.createdAt));
}

export async function getSponsorshipById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sponsorships).where(and(eq(sponsorships.id, id), eq(sponsorships.tenantId, tenantId))).limit(1);
  return result[0];
}

export async function createSponsorship(data: typeof sponsorships.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(sponsorships).values(data);
  return result;
}

export async function updateSponsorship(id: number, tenantId: number, data: Partial<typeof sponsorships.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sponsorships).set({ ...data, updatedAt: new Date() }).where(and(eq(sponsorships.id, id), eq(sponsorships.tenantId, tenantId)));
}

// Get sponsorships due for onboarding sequence steps
export async function getSponsorshipsDueForOnboarding(day: 1 | 3 | 7 | 14 | 30 | 90) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const dayMs = day * 24 * 60 * 60 * 1000;
  const fieldMap = {
    1: sponsorships.onboardingDay1SentAt,
    3: sponsorships.onboardingDay3SentAt,
    7: sponsorships.onboardingDay7SentAt,
    14: sponsorships.onboardingDay14SentAt,
    30: sponsorships.onboardingDay30SentAt,
    90: sponsorships.onboardingDay90SentAt,
  };

  const sentAtField = fieldMap[day];
  const cutoff = new Date(now.getTime() - dayMs);

  return db.select().from(sponsorships).where(
    and(
      eq(sponsorships.status, "active"),
      lte(sponsorships.startDate, cutoff),
      isNull(sentAtField),
    )
  );
}

// ─── VLOGS ────────────────────────────────────────────────────────────────────

export async function getVlogs(tenantId: number, filters?: { status?: string; sponsorshipId?: number; childId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(vlogs.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(vlogs.status, filters.status as any));
  if (filters?.sponsorshipId) conditions.push(eq(vlogs.sponsorshipId, filters.sponsorshipId));
  if (filters?.childId) conditions.push(eq(vlogs.childId, filters.childId));
  return db.select().from(vlogs).where(and(...conditions)).orderBy(desc(vlogs.createdAt));
}

export async function createVlog(data: typeof vlogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(vlogs).values(data);
  return result;
}

export async function moderateVlog(id: number, tenantId: number, status: "approved" | "rejected" | "flagged", moderatedById: number, notes?: string, isSafeguardingConcern?: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(vlogs).set({
    status,
    moderatedById,
    moderatedAt: new Date(),
    moderationNotes: notes,
    isSafeguardingConcern: isSafeguardingConcern ?? false,
    updatedAt: new Date(),
  }).where(and(eq(vlogs.id, id), eq(vlogs.tenantId, tenantId)));
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export async function getMessages(tenantId: number, filters?: { status?: string; sponsorshipId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(messages.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(messages.status, filters.status as any));
  if (filters?.sponsorshipId) conditions.push(eq(messages.sponsorshipId, filters.sponsorshipId));
  return db.select().from(messages).where(and(...conditions)).orderBy(desc(messages.createdAt));
}

export async function createMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  return result;
}

export async function moderateMessage(id: number, tenantId: number, status: "approved" | "rejected" | "flagged" | "quarantined", moderatedById: number, notes?: string, isSafeguardingConcern?: boolean) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {
    status,
    moderatedById,
    moderatedAt: new Date(),
    moderationNotes: notes,
    isSafeguardingConcern: isSafeguardingConcern ?? false,
  };
  if (status === "approved") updateData.deliveredAt = new Date();
  await db.update(messages).set(updateData as any).where(and(eq(messages.id, id), eq(messages.tenantId, tenantId)));
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export async function getPayments(tenantId: number, filters?: { sponsorId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(payments.tenantId, tenantId)];
  if (filters?.sponsorId) conditions.push(eq(payments.sponsorId, filters.sponsorId));
  if (filters?.status) conditions.push(eq(payments.status, filters.status as any));
  return db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return result;
}

// ─── SURVEYS ──────────────────────────────────────────────────────────────────

export async function getSurveys(tenantId: number, filters?: { type?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(surveys.tenantId, tenantId)];
  if (filters?.type) conditions.push(eq(surveys.type, filters.type as any));
  if (filters?.status) conditions.push(eq(surveys.status, filters.status as any));
  return db.select().from(surveys).where(and(...conditions)).orderBy(desc(surveys.sentAt));
}

export async function createSurvey(data: typeof surveys.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(surveys).values(data);
  return result;
}

export async function completeSurvey(id: number, tenantId: number, npsScore?: number, csatScore?: number, feedback?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveys).set({
    npsScore,
    csatScore,
    feedback,
    status: "completed",
    completedAt: new Date(),
  }).where(and(eq(surveys.id, id), eq(surveys.tenantId, tenantId)));
}

// ─── SAFEGUARDING INCIDENTS ───────────────────────────────────────────────────

export async function getIncidents(tenantId: number, filters?: { status?: string; priority?: string; childId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(safeguardingIncidents.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(safeguardingIncidents.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(safeguardingIncidents.priority, filters.priority as any));
  if (filters?.childId) conditions.push(eq(safeguardingIncidents.childId, filters.childId));
  return db.select().from(safeguardingIncidents).where(and(...conditions)).orderBy(desc(safeguardingIncidents.createdAt));
}

export async function createIncident(data: typeof safeguardingIncidents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(safeguardingIncidents).values(data);
  return result;
}

export async function updateIncident(id: number, tenantId: number, data: Partial<typeof safeguardingIncidents.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(safeguardingIncidents).set({ ...data, updatedAt: new Date() }).where(and(eq(safeguardingIncidents.id, id), eq(safeguardingIncidents.tenantId, tenantId)));
}

// ─── AUDIT LOGS (IMMUTABLE APPEND-ONLY) ──────────────────────────────────────

export async function appendAuditLog(data: {
  tenantId?: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  // NEVER update or delete audit logs — append only
  await db.insert(auditLogs).values({
    tenantId: data.tenantId,
    userId: data.userId,
    userEmail: data.userEmail,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    beforeValue: data.beforeValue as any,
    afterValue: data.afterValue as any,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

export async function getAuditLogs(tenantId: number, filters?: { entityType?: string; entityId?: string; userId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(auditLogs.tenantId, tenantId)];
  if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters?.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  return db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(filters?.limit ?? 100);
}

// ─── CONSENT RECORDS ──────────────────────────────────────────────────────────

export async function getConsentRecords(tenantId: number, filters?: { childId?: number; sponsorId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(consentRecords.tenantId, tenantId)];
  if (filters?.childId) conditions.push(eq(consentRecords.childId, filters.childId));
  if (filters?.sponsorId) conditions.push(eq(consentRecords.sponsorId, filters.sponsorId));
  return db.select().from(consentRecords).where(and(...conditions)).orderBy(desc(consentRecords.createdAt));
}

export async function createConsentRecord(data: typeof consentRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(consentRecords).values(data);
  return result;
}

// ─── BACKGROUND CHECKS ────────────────────────────────────────────────────────

export async function getBackgroundChecks(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(backgroundChecks).where(eq(backgroundChecks.tenantId, tenantId)).orderBy(desc(backgroundChecks.createdAt));
}

export async function createBackgroundCheck(data: typeof backgroundChecks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(backgroundChecks).values(data);
  return result;
}

export async function updateBackgroundCheck(id: number, tenantId: number, data: Partial<typeof backgroundChecks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(backgroundChecks).set({ ...data, updatedAt: new Date() }).where(and(eq(backgroundChecks.id, id), eq(backgroundChecks.tenantId, tenantId)));
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

// ─── ANALYTICS HELPERS ────────────────────────────────────────────────────────

export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalSponsors] = await db.select({ count: sql<number>`count(*)` }).from(sponsors).where(and(eq(sponsors.tenantId, tenantId), eq(sponsors.isActive, true)));
  const [totalChildren] = await db.select({ count: sql<number>`count(*)` }).from(children).where(and(eq(children.tenantId, tenantId), eq(children.isActive, true)));
  const [activeSponsored] = await db.select({ count: sql<number>`count(*)` }).from(children).where(and(eq(children.tenantId, tenantId), eq(children.status, "SPONSORED")));
  const [availableChildren] = await db.select({ count: sql<number>`count(*)` }).from(children).where(and(eq(children.tenantId, tenantId), eq(children.status, "AVAILABLE")));
  const [activeSponsorships] = await db.select({ count: sql<number>`count(*)` }).from(sponsorships).where(and(eq(sponsorships.tenantId, tenantId), eq(sponsorships.status, "active")));
  const [pendingVlogs] = await db.select({ count: sql<number>`count(*)` }).from(vlogs).where(and(eq(vlogs.tenantId, tenantId), eq(vlogs.status, "pending_review")));
  const [pendingMessages] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.tenantId, tenantId), eq(messages.status, "pending_approval")));
  const [openIncidents] = await db.select({ count: sql<number>`count(*)` }).from(safeguardingIncidents).where(and(eq(safeguardingIncidents.tenantId, tenantId), or(eq(safeguardingIncidents.status, "open"), eq(safeguardingIncidents.status, "under_investigation"))));

  const revenueResult = await db.select({ total: sql<number>`sum(amount)` }).from(payments).where(and(eq(payments.tenantId, tenantId), eq(payments.status, "succeeded")));

  return {
    totalSponsors: totalSponsors?.count ?? 0,
    totalChildren: totalChildren?.count ?? 0,
    activeSponsored: activeSponsored?.count ?? 0,
    availableChildren: availableChildren?.count ?? 0,
    activeSponsorships: activeSponsorships?.count ?? 0,
    pendingVlogs: pendingVlogs?.count ?? 0,
    pendingMessages: pendingMessages?.count ?? 0,
    openIncidents: openIncidents?.count ?? 0,
    totalRevenueCents: revenueResult[0]?.total ?? 0,
  };
}

// ─── SPONSOR IMPACT DATA ──────────────────────────────────────────────────────

export async function getSponsorImpactData(sponsorId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  // All sponsorships for this sponsor
  const sponsorshipList = await db.select().from(sponsorships)
    .where(and(eq(sponsorships.sponsorId, sponsorId), eq(sponsorships.tenantId, tenantId)));

  // Payment history (succeeded payments)
  const paymentHistory = await db.select({
    id: payments.id,
    amount: payments.amount,
    currency: payments.currency,
    status: payments.status,
    paidAt: payments.paidAt,
    createdAt: payments.createdAt,
    sponsorshipId: payments.sponsorshipId,
  }).from(payments)
    .where(and(
      eq(payments.sponsorId, sponsorId),
      eq(payments.tenantId, tenantId),
      eq(payments.status, "succeeded"),
    ))
    .orderBy(payments.createdAt);

  // Total lifetime giving in cents
  const totalCents = paymentHistory.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // Monthly aggregation for chart (last 12 months)
  const now = new Date();
  const monthlyData: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const monthTotal = paymentHistory
      .filter(p => {
        const pd = p.paidAt ?? p.createdAt;
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      })
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    monthlyData.push({ month: label, amount: Math.round(monthTotal / 100) });
  }

  // Approved vlogs for this sponsor (via their sponsorships)
  const sponsorshipIds = sponsorshipList.map(s => s.id);
  const vlogFeed = sponsorshipIds.length > 0
    ? await db.select({
        id: vlogs.id,
        title: vlogs.title,
        description: vlogs.description,
        videoUrl: vlogs.videoUrl,
        thumbnailUrl: vlogs.thumbnailUrl,
        direction: vlogs.direction,
        createdAt: vlogs.createdAt,
        childId: vlogs.childId,
        sponsorshipId: vlogs.sponsorshipId,
      }).from(vlogs)
        .where(and(eq(vlogs.tenantId, tenantId), eq(vlogs.status, "approved")))
        .orderBy(desc(vlogs.createdAt))
        .limit(10)
    : [];

  // Approved messages for this sponsor's sponsorships
  const messageFeed = sponsorshipIds.length > 0
    ? await db.select({
        id: messages.id,
        originalText: messages.originalText,
        translatedText: messages.translatedText,
        direction: messages.direction,
        createdAt: messages.createdAt,
        sponsorshipId: messages.sponsorshipId,
      }).from(messages)
        .where(and(eq(messages.tenantId, tenantId), eq(messages.status, "approved")))
        .orderBy(desc(messages.createdAt))
        .limit(10)
    : [];

  // Community impact stats
  const [communityChildren] = await db.select({ count: sql<number>`count(*)` })
    .from(children).where(and(eq(children.tenantId, tenantId), eq(children.status, "SPONSORED")));
  const [communitySponsors] = await db.select({ count: sql<number>`count(*)` })
    .from(sponsors).where(eq(sponsors.tenantId, tenantId));

  return {
    sponsorships: sponsorshipList,
    paymentHistory,
    monthlyData,
    totalLifetimeCents: totalCents,
    totalPayments: paymentHistory.length,
    vlogFeed,
    messageFeed,
    communityChildrenSponsored: communityChildren?.count ?? 0,
    communityTotalSponsors: communitySponsors?.count ?? 0,
  };
}

// ─── CHILD UPDATES ────────────────────────────────────────────────────────────

export async function createChildUpdate(data: typeof childUpdates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(childUpdates).values(data);
  return result;
}

export async function getChildUpdates(childId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(childUpdates)
    .where(and(eq(childUpdates.childId, childId), eq(childUpdates.tenantId, tenantId)))
    .orderBy(desc(childUpdates.createdAt));
}

export async function deleteChildUpdate(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(childUpdates).where(and(eq(childUpdates.id, id), eq(childUpdates.tenantId, tenantId)));
}
