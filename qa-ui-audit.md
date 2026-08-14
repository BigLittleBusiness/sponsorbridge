# SponsorBridge UI Audit — Working Findings

## Public and unauthenticated journeys

| Area | Status | Evidence |
|---|---|---|
| Marketing home page | Pass | Desktop and mobile layouts render, and marketing CTAs are visible. |
| Early Access form | Pass | Empty and invalid-email submissions display inline errors while preserving typed input. |
| Pricing toggle | Pass | Selecting annual billing changes Growth from $99/month to $79/month and Scale from $249/month to $199/month. |
| Organisation login | Pass | Required email and password errors display inline when submitted empty. |
| Registration step one | Pass | Required-field and password-strength errors display inline when submitted empty. |
| Public campaign fallback | Pass | An unknown campaign slug resolves from loading skeleton to a clear "Campaign not found" message with a Go Home action. |
| Sponsor portal login branding | Defect | The SponsorBridge logo image is broken on the mobile sponsor portal login screen because it uses an inaccessible absolute asset URL. |

## Authenticated route access states

| Area | Status | Evidence |
|---|---|---|
| Staff Children route | Pass | An unauthenticated visit shows the clear SponsorBridge sign-in gate. |
| System Admin route | Pass | An unauthenticated visit redirects to the organisation login page. |
| Staff Projects route | Defect | An unauthenticated visit renders the full Projects interface and New Project actions, even though queries are disabled. It should show the staff sign-in gate consistently. |
| Sponsor portal shell | Defect | Sponsor dashboard and project views can render without a sponsor session, presenting generic zero-state data rather than directing the visitor to sponsor sign-in. |
| Sponsor portal logo | Defect | The sidebar and mobile header use the same inaccessible absolute image source as the sponsor login screen. |
| Events route | Defect | An unauthenticated visitor can view the staff Events shell and open the New Event action; the logo asset is also broken. |
| Reports route | Defect | An unauthenticated visitor can view reporting controls and CSV actions; its staff sidebar includes stale navigation targets and a broken logo. |
| Project creation route | Defect | An unauthenticated visitor can view the complete New Project form and its Create Project action. |
| Project missing-record view | Pass | A missing project resolves to a clear "Project not found" state with a Back to Projects action. |
| Sponsor payments route | Defect | An unauthenticated visitor can view the sponsor payment history interface and Manage in Stripe control; the sponsor portal logo is broken. |
| Community referral link | Defect | The referral link shown on the Community page uses an obsolete `sponsorbridge.manus.space` domain rather than the current site origin. |
| Browser console | Defect | Sponsor portal navigation produces a nested-anchor React warning, and the missing-project route produces an undefined query-data error. |

## Repairs verified during this audit

| Repair | Verification result |
|---|---|
| Sponsor branding assets | Replaced inaccessible header asset URLs with the verified icon asset and explicit text lockups. Mobile sponsor sign-in now renders the full brand lockup. |
| Sponsor route protection | Unauthenticated requests to sponsor dashboard and payments redirect to `/sponsor/login`. |
| Staff project route protection | Unauthenticated requests to Project list/new/detail screens render the existing staff sign-in gate instead of actionable project interfaces. |
| Events and Reports protection | Unauthenticated visits redirect to `/login`; stale report and sponsor sidebar destinations were corrected. |
| Console robustness | Sponsor navigation was de-nested and missing project queries now return `null` rather than `undefined`. |
