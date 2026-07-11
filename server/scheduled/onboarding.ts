/**
 * SponsorBridge — 90-Day Onboarding Nurture Sequence Handler
 *
 * This handler fires on a daily heartbeat cron (every 24h).
 * It scans all active sponsorships and fires the appropriate onboarding
 * touchpoint based on how many days have elapsed since the sponsorship start date.
 *
 * Touchpoints (stored directly on the sponsorships table):
 *   Day 1  — Welcome + thank you              → onboardingDay1SentAt
 *   Day 3  — Child's story in detail          → onboardingDay3SentAt
 *   Day 7  — How sponsorship works guide      → onboardingDay7SentAt
 *   Day 14 — Community impact update          → onboardingDay14SentAt
 *   Day 30 — First vlog prompt                → onboardingDay30SentAt
 *   Day 90 — Milestone celebration + NPS      → onboardingDay90SentAt
 */

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sponsorships, surveys } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";

const ONBOARDING_STEPS = [
  { day: 1, type: "welcome", subject: "Welcome to SponsorBridge — your journey starts today", field: "onboardingDay1SentAt" as const },
  { day: 3, type: "child_story", subject: "Meet your sponsored child — their story", field: "onboardingDay3SentAt" as const },
  { day: 7, type: "how_it_works", subject: "How your sponsorship makes a difference", field: "onboardingDay7SentAt" as const },
  { day: 14, type: "impact_update", subject: "14 days in — the impact you're already making", field: "onboardingDay14SentAt" as const },
  { day: 30, type: "first_vlog", subject: "A special message from your sponsored child", field: "onboardingDay30SentAt" as const },
  { day: 90, type: "milestone_nps", subject: "3 months together — a milestone to celebrate", field: "onboardingDay90SentAt" as const },
] as const;

export async function onboardingHeartbeatHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database unavailable" });
    }

    const now = new Date();
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch all active sponsorships
    const activeSponshorships = await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.status, "active"));

    for (const sponsorship of activeSponshorships) {
      if (!sponsorship.startDate) {
        skipped++;
        continue;
      }

      const startDate = new Date(sponsorship.startDate);
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      for (const step of ONBOARDING_STEPS) {
        // Only fire if we've reached or passed the target day
        if (daysSinceStart < step.day) continue;

        // Check if this step has already been sent
        const alreadySent = sponsorship[step.field];
        if (alreadySent) continue;

        try {
          // Mark the step as sent by updating the appropriate timestamp
          const updateData: Partial<typeof sponsorships.$inferInsert> = {
            updatedAt: now,
          };
          updateData[step.field] = now;

          await db.update(sponsorships)
            .set(updateData)
            .where(eq(sponsorships.id, sponsorship.id));

          // For Day 90 milestone, auto-create an NPS survey
          if (step.type === "milestone_nps") {
            await db.insert(surveys).values({
              tenantId: sponsorship.tenantId,
              sponsorshipId: sponsorship.id,
              sponsorId: sponsorship.sponsorId,
              type: "nps",
              trigger: "day_90",
              status: "sent",
            });
          }

          // TODO (post-deploy): Send actual email via notification service.
          // The timestamp update serves as the authoritative "sent" record.
          // Email delivery will be wired to the notification system after deployment.
          console.log(`[Onboarding] Fired ${step.type} for sponsorship #${sponsorship.id} (day ${daysSinceStart})`);
          processed++;
        } catch (stepError) {
          console.error(`[Onboarding] Error processing step ${step.type} for sponsorship #${sponsorship.id}:`, stepError);
          errors++;
        }
      }
    }

    return res.json({
      ok: true,
      summary: {
        totalSponshorships: activeSponshorships.length,
        stepsProcessed: processed,
        stepsSkipped: skipped,
        errors,
        timestamp: now.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[Onboarding Heartbeat] Fatal error:", error);
    return res.status(500).json({
      error: message,
      stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
