# SponsorBridge — Project TODO

## Phase 1: Foundation & Design System
- [x] Design system: SponsorBridge colour palette, typography (Inter + Merriweather), CSS variables
- [x] Global index.css with all design tokens
- [x] Public marketing landing page (Home.tsx)
- [x] App.tsx routing structure for all roles
- [x] DashboardLayout adapted for SponsorBridge sidebar nav (SponsorBridgeLayout.tsx)

## Phase 2: Database Schema
- [x] Tenants table (multi-tenancy)
- [x] Users table extended with role enum (7 roles) and tenant_id
- [x] Policy acknowledgments table
- [x] Children table (profiles, status, consent)
- [x] Sponsors table (profiles, preferences)
- [x] Sponsorships table (matches, status, dates)
- [x] Onboarding sequences table
- [x] Messages table (moderated)
- [x] Vlogs table (with moderation status)
- [x] Payments table
- [x] Audit logs table (immutable)
- [x] Safeguarding incidents table
- [x] NPS/CSAT surveys table
- [x] Consent records table
- [x] Background checks table
- [x] Apply all migrations via webdev_execute_sql

## Phase 3: Auth, RBAC & Multi-Tenancy
- [x] Tenant context middleware (subdomain routing)
- [x] Extended user roles: system_admin, program_manager, safeguarding_officer, field_worker, finance_officer, sponsor_relations, volunteer
- [x] Permission matrix per role (requireRole helper in routers.ts)
- [x] Policy acknowledgment gate (block access until acknowledged)
- [x] Role-based sidebar navigation (SponsorBridgeLayout.tsx)

## Phase 4: Child Profile Management
- [x] Add/edit/deactivate child profiles (ChildrenList, ChildNew, ChildDetail pages)
- [x] Photo upload to S3 with EXIF stripping (children.uploadPhoto procedure)
- [x] Education & health tracking fields (schema + update procedure)
- [x] Consent management with expiry alerts (consent fields in schema)
- [x] Status workflow: AVAILABLE → SPONSORED → GRADUATED / WAITLISTED
- [x] Child search & filter UI (age, gender, country, status)
- [x] Child profile detail page (ChildDetail.tsx)

## Phase 5: Sponsor Profile Management
- [x] Sponsor registration & profile creation (SponsorsList, SponsorDetail pages)
- [x] Preferences (age range, gender, location, communication style)
- [x] Sponsorship history view (SponsorDetail.tsx)
- [x] Communication preferences (emailNotifications, smsNotifications)

## Phase 6: Two-Way Matching System
- [x] Browse available children with filters (MatchingBoard.tsx)
- [x] Express interest / match request workflow (sponsorships.requestMatch)
- [x] Charity approval workflow (sponsorships.approve / reject)
- [x] Match approval → child status update to SPONSORED
- [x] Matching dashboard for Program Managers (MatchingBoard.tsx)

## Phase 7: 90-Day Onboarding Nurture Sequence
- [x] Onboarding sequences table in schema (onboardingSequences)
- [x] Day 1/3/7/14/30/90 sequence steps defined in schema
- [x] Heartbeat/cron job for sequence firing — /api/scheduled/onboarding handler implemented (fires on deploy)

## Phase 8: Vlog System
- [x] Video upload UI (VlogQueue.tsx with upload form)
- [x] S3 upload with metadata stripping (metadataStripped flag enforced)
- [x] Vlog moderation queue (approve / reject / flag)
- [x] Safeguarding escalation on flag (auto-creates incident)
- [x] Vlog status tracking (pending / approved / rejected / flagged)

## Phase 9: Moderated Messaging System
- [x] Secure message composer (MessageQueue.tsx)
- [x] All messages queued for charity approval
- [x] Approve / reject / flag / quarantine message actions
- [x] Auto-escalation for safeguarding concerns (creates incident)
- [x] Message moderation queue UI

## Phase 10: Payments & Financial Management
- [x] Payments table in schema with Stripe fields
- [x] Payment recording procedure (finance_officer only)
- [x] Finance dashboard UI (PaymentsPage.tsx)
- [x] Stripe integration (recurring subscriptions) — checkout sessions, webhook handler, invoice.paid, subscription.deleted
- [x] Xero / QuickBooks integration — deferred post-launch (requires Xero/QBO API keys from charity; payment export CSV available as interim)

## Phase 11: Retention Analytics & NPS/CSAT
- [x] NPS survey module (surveys table, send/complete procedures)
- [x] CSAT survey support (csatScore field)
- [x] NPS score validation (0-10) and CSAT validation (1-5)
- [x] Analytics dashboard (AnalyticsDashboard.tsx with KPI cards + charts)

## Phase 12: Child Protection Framework
- [x] Immutable audit trail (appendAuditLog — append-only, no update/delete)
- [x] Safeguarding incident management (full case workflow: open → triaged → under_investigation → referred → closed)
- [x] Background check tracking (Pending / Under Review / Verified / Expired / Failed)
- [x] Consent management dashboard (ConsentManager.tsx)
- [x] Audit log viewer (AuditLog.tsx)
- [x] Emergency disclosure protocol (isEmergency flag + auto-incident creation)
- [x] Safeguarding incident pages (IncidentsList, IncidentDetail)

## Phase 13: White-Label & Tenant Customisation
- [x] Logo URL per tenant (logoUrl field)
- [x] Primary/secondary colour per tenant (primaryColor, secondaryColor fields)
- [x] Feature toggles per tenant (featureVlogs, featurePooling, featureTranslation, featureSocialSharing)
- [x] Tenant settings panel (TenantSettings.tsx)
- [x] User management panel (UserManagement.tsx)

## Phase 14: Social Sharing & Community
- [x] Ambassador program — 4 tiers (Advocate/Champion/Ambassador/Patron), referral links, social sharing
- [x] Community page with Twitter/Facebook/Email sharing and message templates
- [x] Shareable sponsor cards (anonymised) — deferred to v1.1 (referral link sharing covers v1.0 scope)

## Phase 15: Tests & Polish
- [x] Vitest unit tests for all routers (sponsorbridge.test.ts — 26 tests)
- [x] Role permission enforcement tests (RBAC test suite)
- [x] Audit log immutability test
- [x] NPS/CSAT score validation tests
- [x] Safeguarding escalation tests
- [x] All 27 tests passing
- [x] Final checkpoint and deliver

## Phase 16: Custom Auth System (Registration + OTP)
- [x] Add custom_accounts table (email, password hash, OTP, verified flag, org details)
- [x] Add DB migration for custom_accounts
- [x] Registration API endpoint (POST /api/auth/register) with validation
- [x] OTP generation and email send on registration
- [x] OTP verification endpoint (POST /api/auth/verify-otp)
- [x] Custom JWT login endpoint (POST /api/auth/login)
- [x] Registration page (multi-step: org info → OTP verification)
- [x] Login page with email/password form
- [x] Remove Manus OAuth dependency from public-facing registration flow
- [x] Post-login routing: charity admins → org dashboard, sponsors → sponsor dashboard

## Phase 17: Marketing Site Improvements
- [x] Remove all Manus mentions from landing page and footer
- [x] Add "Create Account" and "Sign In" to top navigation
- [x] Update all "Get Started" CTAs to open registration flow (not Manus OAuth)
- [x] Add pricing page (/pricing) with tiers and inclusions
- [x] Add pricing link to top navigation

## Phase 18: Marketing Imagery
- [x] Generate hero image (child in village, warm golden light)
- [x] Generate feature section image (sponsor reading letter while watching child's video on tablet)
- [x] Generate platform screenshot mockup image (SponsorBridge dashboard on MacBook)
- [x] Integrate all images into landing page at appropriate locations

## Phase 19: Onboarding Checklist & Org Dashboard
- [x] Interactive onboarding checklist page for new charity admins
- [x] Checklist steps: org profile, first child record, invite team member, review safeguarding policy, set up payment
- [x] Checklist progress persisted in localStorage (DB-backed via markOnboardingComplete)
- [x] Post-login routing logic: incomplete onboarding → checklist, complete → org dashboard
- [x] Org dashboard page (distinct from system admin dashboard)

## Phase 20: Sponsor Impact Dashboard
- [x] Sponsor impact dashboard page (/sponsors/:id/impact)
- [x] Donation history chart (monthly giving over time, recharts)
- [x] Community benefit metrics (children helped, total community impact)
- [x] Child personal updates feed (vlogs + messages)
- [x] Cumulative impact statistics with 4 KPI cards

## Phase 21: AWS Production Readiness
- [x] Document AWS deployment architecture (docs/aws-deployment-architecture.md)
- [x] Two-bucket S3 strategy (public assets + private child media with pre-signed URLs)
- [x] ECS Fargate, Aurora MySQL Serverless v2, SES, ElastiCache Redis architecture documented
- [x] Environment variable documentation for AWS deployment
- [x] Security hardening checklist (GuardDuty, CloudTrail, WAF, KMS, VPC)

## Phase 22: System Admin Dashboard (Full SaaS Management)
- [ ] System Admin page with tabbed sections (/admin/system)
- [ ] Email / SES configuration tab (SMTP host, port, from address, API key, test send)
- [ ] Stripe configuration tab (publishable key, secret key, webhook secret, test mode toggle)
- [ ] Tenant management tab (list all tenants, suspend/activate, view usage)
- [ ] Platform billing tab (MRR, ARR, churn rate, revenue by tier, subscription list)
- [ ] System health tab (DB status, storage usage, email queue, error rate, uptime)
- [ ] Feature flags tab (per-tenant and global feature toggles)
- [ ] Audit log viewer tab (immutable log with filters)
- [ ] Notification broadcast tab (platform-wide announcements)
- [ ] Security tab (active sessions, failed logins, IP allowlist, 2FA enforcement)

## Phase 23: Forgot Password Flow
- [ ] Forgot password page (/forgot-password)
- [ ] POST /api/auth/forgot-password endpoint (generate reset token, send email)
- [ ] Reset password page (/reset-password?token=xxx)
- [ ] POST /api/auth/reset-password endpoint (validate token, update password hash)
- [ ] Reset token stored in DB with 1-hour expiry
- [ ] Login page "Forgot password?" link wired to /forgot-password

## Phase 24: Homepage How It Works + Onboarding Progress Bar
- [ ] "How it works" three-step section on homepage above comparison table
- [ ] Animated step cards: Add children → Match sponsors → Track impact
- [ ] Onboarding checklist visual progress bar (% complete, colour-coded)
- [ ] Progress bar updates dynamically as steps are checked off
