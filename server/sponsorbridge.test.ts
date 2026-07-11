import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  acknowledgePolicy: vi.fn().mockResolvedValue(undefined),
  appendAuditLog: vi.fn().mockResolvedValue(undefined),
  completeSurvey: vi.fn().mockResolvedValue(undefined),
  createBackgroundCheck: vi.fn().mockResolvedValue(undefined),
  createChild: vi.fn().mockResolvedValue(undefined),
  createConsentRecord: vi.fn().mockResolvedValue(undefined),
  createIncident: vi.fn().mockResolvedValue(undefined),
  createMessage: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  createPayment: vi.fn().mockResolvedValue(undefined),
  createSponsor: vi.fn().mockResolvedValue(undefined),
  createSponsorship: vi.fn().mockResolvedValue(undefined),
  createSurvey: vi.fn().mockResolvedValue(undefined),
  createTenant: vi.fn().mockResolvedValue(undefined),
  createVlog: vi.fn().mockResolvedValue(undefined),
  getAllTenants: vi.fn().mockResolvedValue([{ id: 1, name: "Test Charity", subdomain: "test" }]),
  getAuditLogs: vi.fn().mockResolvedValue([]),
  getBackgroundChecks: vi.fn().mockResolvedValue([]),
  getChildById: vi.fn().mockResolvedValue({ id: 1, firstName: "Alice", status: "AVAILABLE", tenantId: 1 }),
  getChildren: vi.fn().mockResolvedValue([]),
  getConsentRecords: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ totalSponsors: 0, totalChildren: 0, activeSponshorships: 0, totalRevenue: 0 }),
  getIncidents: vi.fn().mockResolvedValue([]),
  getMessages: vi.fn().mockResolvedValue([]),
  getNotifications: vi.fn().mockResolvedValue([]),
  getPayments: vi.fn().mockResolvedValue([]),
  getSponsorById: vi.fn().mockResolvedValue(null),
  getSponsorByUserId: vi.fn().mockResolvedValue(null),
  getSponsorships: vi.fn().mockResolvedValue([]),
  getSponsorshipById: vi.fn().mockResolvedValue({ id: 1, childId: 1, sponsorId: 1, tenantId: 1, status: "pending_approval" }),
  getSponsors: vi.fn().mockResolvedValue([]),
  getSurveys: vi.fn().mockResolvedValue([]),
  getTenantById: vi.fn().mockResolvedValue({ id: 1, name: "Test Charity" }),
  getTenantBySubdomain: vi.fn().mockResolvedValue(null),
  getUsersByTenant: vi.fn().mockResolvedValue([]),
  getVlogs: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  moderateMessage: vi.fn().mockResolvedValue(undefined),
  moderateVlog: vi.fn().mockResolvedValue(undefined),
  updateBackgroundCheck: vi.fn().mockResolvedValue(undefined),
  updateChild: vi.fn().mockResolvedValue(undefined),
  updateIncident: vi.fn().mockResolvedValue(undefined),
  updateSponsor: vi.fn().mockResolvedValue(undefined),
  updateSponsorship: vi.fn().mockResolvedValue(undefined),
  updateTenant: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeCtx(role: string = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "admin@test.com",
      name: "Test Admin",
      loginMethod: "manus",
      role: role as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, socket: { remoteAddress: "127.0.0.1" } } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── RBAC Tests ───────────────────────────────────────────────────────────────
describe("RBAC — role enforcement", () => {
  it("denies tenant list to non-admin roles", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    await expect(caller.tenants.list()).rejects.toThrow("Insufficient permissions");
  });

  it("allows tenant list to system_admin", async () => {
    const caller = appRouter.createCaller(makeCtx("system_admin"));
    const result = await caller.tenants.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies safeguarding incident list to volunteer role", async () => {
    const caller = appRouter.createCaller(makeCtx("volunteer"));
    await expect(caller.safeguarding.listIncidents({ tenantId: 1 })).rejects.toThrow("Insufficient permissions");
  });

  it("allows safeguarding incident list to safeguarding_officer", async () => {
    const caller = appRouter.createCaller(makeCtx("safeguarding_officer"));
    const result = await caller.safeguarding.listIncidents({ tenantId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies payment recording to non-finance roles", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    await expect(
      caller.payments.record({
        tenantId: 1,
        sponsorshipId: 1,
        sponsorId: 1,
        amount: 50,
        status: "succeeded",
      })
    ).rejects.toThrow("Insufficient permissions");
  });

  it("allows payment recording to finance_officer", async () => {
    const caller = appRouter.createCaller(makeCtx("finance_officer"));
    const result = await caller.payments.record({
      tenantId: 1,
      sponsorshipId: 1,
      sponsorId: 1,
      amount: 50,
      status: "succeeded",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Child Management Tests ───────────────────────────────────────────────────
describe("Children — status workflow", () => {
  it("allows field_worker to create a child", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    const result = await caller.children.create({
      tenantId: 1,
      firstName: "Alice",
      lastName: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("allows program_manager to update child status to SPONSORED", async () => {
    const caller = appRouter.createCaller(makeCtx("program_manager"));
    const result = await caller.children.update({
      id: 1,
      tenantId: 1,
      status: "SPONSORED",
    });
    expect(result.success).toBe(true);
  });

  it("allows valid child status values: AVAILABLE, SPONSORED, GRADUATED, WAITLISTED", async () => {
    const caller = appRouter.createCaller(makeCtx("program_manager"));
    for (const status of ["AVAILABLE", "SPONSORED", "GRADUATED", "WAITLISTED"] as const) {
      const result = await caller.children.update({ id: 1, tenantId: 1, status });
      expect(result.success).toBe(true);
    }
  });
});

// ─── Sponsorship Matching Tests ───────────────────────────────────────────────
describe("Sponsorships — matching workflow", () => {
  it("allows any authenticated user to request a match", async () => {
    const caller = appRouter.createCaller(makeCtx("sponsor"));
    const result = await caller.sponsorships.requestMatch({ tenantId: 1, childId: 1, sponsorId: 1 });
    expect(result.success).toBe(true);
  });

  it("allows program_manager to approve a match", async () => {
    const caller = appRouter.createCaller(makeCtx("program_manager"));
    const result = await caller.sponsorships.approve({ id: 1, tenantId: 1 });
    expect(result.success).toBe(true);
  });

  it("denies match approval to field_worker", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    await expect(caller.sponsorships.approve({ id: 1, tenantId: 1 })).rejects.toThrow("Insufficient permissions");
  });

  it("allows program_manager to reject a match", async () => {
    const caller = appRouter.createCaller(makeCtx("program_manager"));
    const result = await caller.sponsorships.reject({ id: 1, tenantId: 1, notes: "Not suitable" });
    expect(result.success).toBe(true);
  });
});

// ─── Safeguarding Tests ───────────────────────────────────────────────────────
describe("Safeguarding — incident reporting", () => {
  it("allows any staff member to report an incident", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    const result = await caller.safeguarding.reportIncident({
      tenantId: 1,
      title: "Concern raised",
      description: "A concern was raised during a field visit.",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("allows anonymous incident reporting", async () => {
    const caller = appRouter.createCaller(makeCtx("volunteer"));
    const result = await caller.safeguarding.reportIncident({
      tenantId: 1,
      title: "Anonymous concern",
      description: "Reported anonymously from a community member.",
      isAnonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it("allows safeguarding_officer to update incident status", async () => {
    const caller = appRouter.createCaller(makeCtx("safeguarding_officer"));
    const result = await caller.safeguarding.updateIncident({
      id: 1,
      tenantId: 1,
      status: "under_investigation",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Vlog Moderation Tests ────────────────────────────────────────────────────
describe("Vlogs — moderation and safeguarding escalation", () => {
  it("allows sponsor_relations to approve a vlog", async () => {
    const caller = appRouter.createCaller(makeCtx("sponsor_relations"));
    const result = await caller.vlogs.moderate({
      id: 1,
      tenantId: 1,
      status: "approved",
    });
    expect(result.success).toBe(true);
  });

  it("creates a safeguarding incident when vlog is flagged as concern", async () => {
    const { createIncident } = await import("./db");
    const caller = appRouter.createCaller(makeCtx("safeguarding_officer"));
    await caller.vlogs.moderate({
      id: 1,
      tenantId: 1,
      status: "flagged",
      isSafeguardingConcern: true,
      notes: "Inappropriate content detected",
    });
    expect(createIncident).toHaveBeenCalledWith(
      expect.objectContaining({ isEmergency: true, priority: "urgent" })
    );
  });

  it("denies vlog moderation to field_worker", async () => {
    const caller = appRouter.createCaller(makeCtx("field_worker"));
    await expect(caller.vlogs.moderate({ id: 1, tenantId: 1, status: "approved" })).rejects.toThrow("Insufficient permissions");
  });
});

// ─── Audit Log Tests ──────────────────────────────────────────────────────────
describe("Audit log — immutability", () => {
  it("allows safeguarding_officer to read audit logs", async () => {
    const caller = appRouter.createCaller(makeCtx("safeguarding_officer"));
    const result = await caller.audit.list({ tenantId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies audit log access to volunteer", async () => {
    const caller = appRouter.createCaller(makeCtx("volunteer"));
    await expect(caller.audit.list({ tenantId: 1 })).rejects.toThrow("Insufficient permissions");
  });
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("Auth — policy acknowledgment", () => {
  it("records policy acknowledgment for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.auth.acknowledgePolicy({ policyVersion: "v1.0" });
    expect(result.success).toBe(true);
  });

  it("returns null user for unauthenticated request", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Survey Tests ─────────────────────────────────────────────────────────────
describe("Surveys — NPS and CSAT", () => {
  it("validates NPS score range 0-10", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(
      caller.surveys.complete({ id: 1, tenantId: 1, npsScore: 11 })
    ).rejects.toThrow();
  });

  it("validates CSAT score range 1-5", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(
      caller.surveys.complete({ id: 1, tenantId: 1, csatScore: 6 })
    ).rejects.toThrow();
  });

  it("accepts valid NPS score", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.surveys.complete({ id: 1, tenantId: 1, npsScore: 9, feedback: "Great platform!" });
    expect(result.success).toBe(true);
  });
});
