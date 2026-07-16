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
- [x] System Admin page with tabbed sections (/admin route)
- [x] Email / SES configuration tab (SMTP host, port, from address, API key, test send)
- [x] Stripe configuration tab (publishable key, secret key, webhook secret, test mode toggle)
- [x] Tenant management tab (list all tenants, suspend/activate, view usage)
- [x] Platform billing tab (MRR, ARR, churn rate, revenue by tier, subscription list)
- [x] System health tab (DB status, storage usage, email queue, error rate, uptime)
- [x] Feature flags tab (per-tenant and global feature toggles)
- [x] Audit log viewer tab (immutable log with filters)
- [x] Notification broadcast tab (platform-wide announcements)
- [x] Security tab (active sessions, failed logins, IP allowlist, 2FA enforcement)

## Phase 23: Forgot Password Flow
- [x] Forgot password page (/forgot-password)
- [x] POST /api/auth/forgot-password endpoint (generate reset token, send email)
- [x] Reset password page (/reset-password?token=xxx)
- [x] POST /api/auth/reset-password endpoint (validate token, update password hash)
- [x] Reset token stored in DB with 1-hour expiry (password_reset_tokens table)
- [x] Login page "Forgot password?" link wired to /forgot-password

## Phase 24: Homepage How It Works + Onboarding Progress Bar
- [x] "How it works" three-step section on homepage above comparison table
- [x] Animated step cards: Add children → Match sponsors → Track impact
- [x] Onboarding checklist visual progress bar (% complete, colour-coded, animated fill)
- [x] Progress bar updates dynamically as steps are checked off (per-section mini bars + main bar)

## Phase 25: Logo Suite Generation & Integration
- [x] Generate standalone icon mark (SB arch/bridge monogram, transparent background)
- [x] Generate horizontal header logo — dark background version
- [x] Generate horizontal header logo — light background version
- [x] Generate square favicon/app icon (dark background, bold SB mark)
- [x] Generate footer logo — dark background version
- [x] Generate footer logo — light background version
- [x] Replace placeholder logo in SponsorBridgeLayout.tsx sidebar header
- [x] Replace placeholder logo in Home.tsx navigation header
- [x] Replace placeholder logo in Home.tsx footer
- [x] Replace placeholder logo in PricingPage.tsx navigation header
- [x] Replace placeholder logo in PricingPage.tsx footer
- [x] Replace placeholder logo in LoginPage.tsx (left panel + mobile header)
- [x] Replace placeholder logo in RegisterPage.tsx left panel
- [x] Replace placeholder logo in VerifyOtpPage.tsx header
- [x] Replace placeholder logo in ForgotPasswordPage.tsx header
- [x] Replace placeholder logo in ResetPasswordPage.tsx header
- [x] Add logo img tag to OTP email template in customAuth.ts
- [x] Add logo img tag to password reset email template in customAuth.ts
- [x] Add favicon link tag to client/index.html

## Phase 26: Registration Flow UX Fixes

- [x] Fix ToS checkbox layout on Step 2 — proper flex alignment, error message placement
- [x] Step 1: rename submit button label to "Next →" (currently "Continue →")
- [x] Step 2: ensure "Create Account" button is clearly the primary CTA with full width
- [x] OTP step (Step 3): add "Step 3 of 3" progress context, improve visual hierarchy
- [x] LoginPage: remove unused Heart import, ensure Sign In button is prominent
- [x] VerifyOtpPage: remove unused Heart import, add back-to-login escape route
- [x] ForgotPasswordPage: align visual style with login/register (currently uses different card layout)
- [x] ResetPasswordPage: align visual style with login/register
- [x] All auth pages: consistent logo size (h-8) and placement

## Phase 27: System Admin Dashboard

- [x] Fix Dockerfile — copy patches/ directory so pnpm install succeeds in Docker build
- [x] Add `is_system_admin` flag to custom_accounts or use a separate admin check in auth
- [x] Add tRPC admin router with procedures: platform stats, user list, user detail, suspend/activate user
- [x] Build AdminLayout component (sidebar with: Overview, Client Accounts, Sponsor Users, Platform Stats, System)
- [x] Build Admin Overview page — KPI cards (total orgs, active sponsors, children enrolled, MRR, new signups 30d)
- [x] Build Client Accounts page — searchable/filterable table of all custom_accounts with plan, status, last login, actions
- [x] Build Sponsor Users page — searchable table of all sponsor users across all tenants
- [x] Build Platform Statistics page — charts: signups over time, plan distribution, sponsor activity, geographic spread
- [x] Add admin route guard — redirect non-admins away from /admin/* routes
- [x] Wire admin account (tizzbizz+sb-sysadmin@gmail.com) to admin role in DB

## Phase 28: Complete Client Dashboard (reference design)

- [x] Build OrgDashboardLayout — dark forest green sidebar (#1a3a2e), terracotta active state (#c1440e), SponsorBridge logo at top
- [x] Sidebar nav: Dashboard, Children, Sponsors, Communications, Reports, Donations, Events, Settings
- [x] Dashboard home page — greeting header, 3 KPI cards (Sponsors, Children, Retention %), child spotlight card, recent activity feed, sponsorship overview charts
- [x] Children page — searchable/filterable table with status badges, add child button
- [x] Sponsors page — searchable table with active sponsorship count, contact info
- [x] Communications page — message thread list + compose
- [x] Reports page — downloadable report cards
- [x] Donations page — payment history table
- [x] Events page — upcoming events list
- [x] Settings page — org profile, team members, notification preferences
- [x] Wire all pages to real tRPC data

## Phase 29: Complete System Admin Dashboard

- [x] Add Overview tab — KPI grid, children/sponsorship status breakdown, 30-day signup trend chart
- [x] Add Client Accounts tab — searchable/filterable table with plan badge, child/sponsor counts, inline plan change and verify toggle
- [x] Add Sponsor Users tab — cross-tenant searchable table with active sponsorship count, activate/deactivate action
- [x] Add Platform Statistics tab — recharts bar/line charts for signups, sponsors, plan distribution

## Phase 30: Sponsor Self-Service Portal

- [x] DB migration: sponsor_portal_accounts table (email, password hash, OTP, isActive, isVerified)
- [x] DB migration: child_updates table (title, content, updateType, mediaUrl, publishedAt, isPublished)
- [x] Backend router: POST /api/sponsor/login (email/password + OTP magic link)
- [x] Backend router: POST /api/sponsor/verify-otp
- [x] Backend router: POST /api/sponsor/logout
- [x] Backend router: GET /api/sponsor/me (sponsor profile + active sponsorships)
- [x] Backend router: GET /api/sponsor/dashboard (KPI cards + recent updates)
- [x] Backend router: GET /api/sponsor/child/:childId (full profile + updates history)
- [x] Backend router: GET /api/sponsor/payments (payment history + total donated)
- [x] Backend router: GET /api/sponsor/messages (message thread)
- [x] Backend router: POST /api/sponsor/messages (send message, goes to moderation queue)
- [x] Backend router: PUT /api/sponsor/profile (notification preferences)
- [x] SponsorAuthContext.tsx — auth state, login/OTP/logout/refresh
- [x] SponsorPortalLayout.tsx — warm cream/terracotta sidebar layout
- [x] SponsorLoginPage.tsx — split-screen login with password + OTP magic code modes
- [x] SponsorDashboard.tsx — KPI cards, child card, recent updates feed
- [x] SponsorChildPage.tsx — full child profile with filterable updates history
- [x] SponsorMessagesPage.tsx — message thread + compose with moderation notice
- [x] SponsorPaymentsPage.tsx — payment history table + manage subscription + CSV export
- [x] SponsorProfilePage.tsx — account details + notification preferences + privacy
- [x] App.tsx — sponsor portal routes (/sponsor/*) + SponsorAuthProvider wrapper
- [x] All TypeScript errors resolved, 27 tests passing

## Phase 31: Staff-Side Post Update Form

- [x] Backend: createChildUpdate, getChildUpdates, deleteChildUpdate helpers in db.ts
- [x] Backend: children.listUpdates, children.postUpdate, children.deleteUpdate tRPC procedures
- [x] Frontend: Post Update form inline on ChildDetail.tsx (title, category, content, media URL, publish toggle)
- [x] Frontend: Existing updates list with type icons, date, delete action
- [x] TypeScript clean, all 27 tests passing

## Phase 32: Project Sponsorship Feature

- [x] DB schema: projects, project_contributions, project_updates tables migrated
- [x] Backend: DB helpers (createProject, updateProject, getProjectsByTenant, getProjectBySlug, createContribution, updateContribution, getContributionsByProject, createProjectUpdate, getProjectUpdates, deleteProjectUpdate)
- [x] tRPC procedures: projects.list, projects.getById, projects.getBySlug, projects.create, projects.update, projects.postUpdate, projects.getUpdates, projects.deleteUpdate, projects.getContributions, projects.getDonorWall, projects.createCheckout, projects.myContributions
- [x] Stripe checkout session creation for one-off and recurring contributions
- [x] Stripe webhook handler for checkout.session.completed and invoice.paid (recurring)
- [x] SES email triggers: contribution receipt, project update notification to contributors
- [x] Staff UI: ProjectsList page with summary cards, search/filter, project cards with progress bars
- [x] Staff UI: ProjectForm (New/Edit) with full campaign details and settings
- [x] Staff UI: ProjectDetail with contributions table, Post Update form, updates feed
- [x] Public fundraising page: /fund/:slug with progress bar, donor wall, updates, Give Once/Monthly widget
- [x] Thank-you page: /fund/:slug/thank-you
- [x] Sponsor portal: SponsorProjectsPage (My Projects tab) with contribution history
- [x] SponsorPortalLayout: added "My Projects" nav item with FolderHeart icon
- [x] SponsorBridgeLayout: added "Projects" nav item for staff
- [x] All routes registered in App.tsx
- [x] TypeScript clean, all 27 tests passing
