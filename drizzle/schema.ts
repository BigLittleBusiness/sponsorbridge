import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── TENANTS ────────────────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  customDomain: varchar("customDomain", { length: 255 }),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#D14A2E"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#F4A261"),
  // Feature toggles
  featureVlogs: boolean("featureVlogs").default(true),
  featurePooling: boolean("featurePooling").default(false),
  featureTranslation: boolean("featureTranslation").default(true),
  featureSocialSharing: boolean("featureSocialSharing").default(true),
  featureBequest: boolean("featureBequest").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId").references(() => tenants.id),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "system_admin",
    "program_manager",
    "safeguarding_officer",
    "field_worker",
    "finance_officer",
    "sponsor_relations",
    "volunteer",
    "sponsor",
    "admin", // legacy compat
    "user",  // legacy compat
  ]).default("user").notNull(),
  isActive: boolean("isActive").default(true),
  policyAcknowledgedAt: timestamp("policyAcknowledgedAt"),
  policyVersion: varchar("policyVersion", { length: 20 }),
  backgroundCheckStatus: mysqlEnum("backgroundCheckStatus", [
    "not_required",
    "pending",
    "under_review",
    "verified",
    "expired",
  ]).default("not_required"),
  backgroundCheckExpiry: timestamp("backgroundCheckExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── POLICY ACKNOWLEDGMENTS ──────────────────────────────────────────────────
export const policyAcknowledgments = mysqlTable("policy_acknowledgments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  policyVersion: varchar("policyVersion", { length: 20 }).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

// ─── CHILDREN ────────────────────────────────────────────────────────────────
export const children = mysqlTable("children", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  country: varchar("country", { length: 100 }),
  region: varchar("region", { length: 100 }),
  bio: text("bio"),
  interests: text("interests"),
  photoUrl: text("photoUrl"),
  photoKey: varchar("photoKey", { length: 500 }),
  status: mysqlEnum("status", [
    "AVAILABLE",
    "SPONSORED",
    "GRADUATED",
    "WAITLISTED",
  ]).default("AVAILABLE").notNull(),
  educationLevel: varchar("educationLevel", { length: 100 }),
  schoolName: varchar("schoolName", { length: 255 }),
  healthStatus: text("healthStatus"),
  programType: varchar("programType", { length: 100 }),
  hasSpecialNeeds: boolean("hasSpecialNeeds").default(false),
  specialNeedsDetails: text("specialNeedsDetails"),
  // Consent
  parentalConsentGranted: boolean("parentalConsentGranted").default(false),
  parentalConsentDate: timestamp("parentalConsentDate"),
  parentalConsentExpiry: timestamp("parentalConsentExpiry"),
  photoConsentGranted: boolean("photoConsentGranted").default(false),
  videoConsentGranted: boolean("videoConsentGranted").default(false),
  // Field worker assignment
  assignedFieldWorkerId: int("assignedFieldWorkerId").references(() => users.id),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── SPONSORS ────────────────────────────────────────────────────────────────
export const sponsors = mysqlTable("sponsors", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  // Preferences
  preferredChildAgeMin: int("preferredChildAgeMin"),
  preferredChildAgeMax: int("preferredChildAgeMax"),
  preferredGender: mysqlEnum("preferredGender", ["male", "female", "no_preference"]).default("no_preference"),
  preferredCountry: varchar("preferredCountry", { length: 100 }),
  communicationStyle: mysqlEnum("communicationStyle", ["frequent", "occasional", "minimal"]).default("occasional"),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  // Preferences
  emailNotifications: boolean("emailNotifications").default(true),
  smsNotifications: boolean("smsNotifications").default(false),
  marketingConsent: boolean("marketingConsent").default(false),
  dataConsent: boolean("dataConsent").default(true),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── SPONSORSHIPS (MATCHES) ───────────────────────────────────────────────────
export const sponsorships = mysqlTable("sponsorships", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  sponsorId: int("sponsorId").notNull().references(() => sponsors.id),
  childId: int("childId").notNull().references(() => children.id),
  status: mysqlEnum("status", [
    "pending_approval",
    "active",
    "paused",
    "cancelled",
    "completed",
  ]).default("pending_approval").notNull(),
  matchedBy: mysqlEnum("matchedBy", ["sponsor_choice", "child_choice", "algorithm", "staff"]).default("sponsor_choice"),
  approvedById: int("approvedById").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  monthlyAmount: int("monthlyAmount").default(4000), // in cents
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  notes: text("notes"),
  // Onboarding sequence tracking
  onboardingDay1SentAt: timestamp("onboardingDay1SentAt"),
  onboardingDay3SentAt: timestamp("onboardingDay3SentAt"),
  onboardingDay7SentAt: timestamp("onboardingDay7SentAt"),
  onboardingDay14SentAt: timestamp("onboardingDay14SentAt"),
  onboardingDay30SentAt: timestamp("onboardingDay30SentAt"),
  onboardingDay90SentAt: timestamp("onboardingDay90SentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── VLOGS ────────────────────────────────────────────────────────────────────
export const vlogs = mysqlTable("vlogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  sponsorshipId: int("sponsorshipId").references(() => sponsorships.id),
  childId: int("childId").references(() => children.id),
  uploadedById: int("uploadedById").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  videoUrl: text("videoUrl"),
  videoKey: varchar("videoKey", { length: 500 }),
  thumbnailUrl: text("thumbnailUrl"),
  durationSeconds: int("durationSeconds"),
  fileSize: int("fileSize"),
  direction: mysqlEnum("direction", ["child_to_sponsor", "sponsor_to_child"]).default("child_to_sponsor"),
  status: mysqlEnum("status", [
    "pending_review",
    "approved",
    "rejected",
    "flagged",
  ]).default("pending_review").notNull(),
  moderatedById: int("moderatedById").references(() => users.id),
  moderatedAt: timestamp("moderatedAt"),
  moderationNotes: text("moderationNotes"),
  isSafeguardingConcern: boolean("isSafeguardingConcern").default(false),
  metadataStripped: boolean("metadataStripped").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  sponsorshipId: int("sponsorshipId").notNull().references(() => sponsorships.id),
  senderId: int("senderId").notNull().references(() => users.id),
  direction: mysqlEnum("direction", ["sponsor_to_child", "child_to_sponsor"]).notNull(),
  originalText: text("originalText").notNull(),
  translatedText: text("translatedText"),
  originalLanguage: varchar("originalLanguage", { length: 10 }),
  translatedLanguage: varchar("translatedLanguage", { length: 10 }),
  status: mysqlEnum("status", [
    "pending_approval",
    "approved",
    "rejected",
    "flagged",
    "quarantined",
  ]).default("pending_approval").notNull(),
  moderatedById: int("moderatedById").references(() => users.id),
  moderatedAt: timestamp("moderatedAt"),
  moderationNotes: text("moderationNotes"),
  isSafeguardingConcern: boolean("isSafeguardingConcern").default(false),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  sponsorshipId: int("sponsorshipId").notNull().references(() => sponsorships.id),
  sponsorId: int("sponsorId").notNull().references(() => sponsors.id),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", [
    "pending",
    "succeeded",
    "failed",
    "refunded",
    "disputed",
  ]).default("pending").notNull(),
  failureReason: text("failureReason"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── NPS / CSAT SURVEYS ───────────────────────────────────────────────────────
export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  sponsorId: int("sponsorId").notNull().references(() => sponsors.id),
  sponsorshipId: int("sponsorshipId").references(() => sponsorships.id),
  type: mysqlEnum("type", ["nps", "csat"]).notNull(),
  trigger: varchar("trigger", { length: 100 }), // e.g. "day_90", "annual", "post_interaction"
  npsScore: int("npsScore"), // 0-10
  csatScore: int("csatScore"), // 1-5
  feedback: text("feedback"),
  status: mysqlEnum("status", ["sent", "completed", "skipped"]).default("sent"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── SAFEGUARDING INCIDENTS ───────────────────────────────────────────────────
export const safeguardingIncidents = mysqlTable("safeguarding_incidents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  reportedById: int("reportedById").references(() => users.id),
  assignedToId: int("assignedToId").references(() => users.id),
  childId: int("childId").references(() => children.id),
  relatedMessageId: int("relatedMessageId").references(() => messages.id),
  relatedVlogId: int("relatedVlogId").references(() => vlogs.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", [
    "open",
    "triaged",
    "under_investigation",
    "referred",
    "closed",
  ]).default("open").notNull(),
  isEmergency: boolean("isEmergency").default(false),
  referredToAuthorities: boolean("referredToAuthorities").default(false),
  referralDetails: text("referralDetails"),
  outcome: text("outcome"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── AUDIT LOGS (IMMUTABLE) ───────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").references(() => users.id),
  userEmail: varchar("userEmail", { length: 320 }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: varchar("entityId", { length: 100 }),
  beforeValue: json("beforeValue"),
  afterValue: json("afterValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // NOTE: No updatedAt — this table is append-only and immutable
});

// ─── CONSENT RECORDS ──────────────────────────────────────────────────────────
export const consentRecords = mysqlTable("consent_records", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  childId: int("childId").references(() => children.id),
  sponsorId: int("sponsorId").references(() => sponsors.id),
  consentType: mysqlEnum("consentType", [
    "parental",
    "sponsor_data",
    "marketing",
    "photo_video",
    "gdpr",
  ]).notNull(),
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("grantedAt"),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── BACKGROUND CHECKS ────────────────────────────────────────────────────────
export const backgroundChecks = mysqlTable("background_checks", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", [
    "pending",
    "under_review",
    "verified",
    "expired",
    "failed",
  ]).default("pending").notNull(),
  documentUrl: text("documentUrl"),
  documentKey: varchar("documentKey", { length: 500 }),
  verifiedById: int("verifiedById").references(() => users.id),
  verifiedAt: timestamp("verifiedAt"),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  userId: int("userId").notNull().references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── REFERRALS & AMBASSADOR PROGRAM ─────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").references(() => tenants.id),
  referrerId: int("referrerId").notNull().references(() => users.id), // user who shared the link
  referredUserId: int("referredUserId").references(() => users.id),   // user who signed up via link
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "converted", "expired"]).default("pending").notNull(),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;
export type Sponsorship = typeof sponsorships.$inferSelect;
export type InsertSponsorship = typeof sponsorships.$inferInsert;
export type Vlog = typeof vlogs.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SafeguardingIncident = typeof safeguardingIncidents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type BackgroundCheck = typeof backgroundChecks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
