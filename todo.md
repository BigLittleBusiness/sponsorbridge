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
- [ ] Heartbeat/cron job for sequence firing (requires Stripe + heartbeat setup)

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
- [ ] Stripe integration (recurring subscriptions) — requires Stripe secret key
- [ ] Xero / QuickBooks integration — requires API keys

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
- [ ] Shareable sponsor cards (anonymised) — future phase
- [ ] Ambassador program — future phase

## Phase 15: Tests & Polish
- [x] Vitest unit tests for all routers (sponsorbridge.test.ts — 26 tests)
- [x] Role permission enforcement tests (RBAC test suite)
- [x] Audit log immutability test
- [x] NPS/CSAT score validation tests
- [x] Safeguarding escalation tests
- [x] All 27 tests passing
- [ ] Final checkpoint and deliver
