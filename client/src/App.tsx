import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CustomAuthProvider } from "./contexts/CustomAuthContext";
import { SponsorAuthProvider } from "./contexts/SponsorAuthContext";
import SponsorBridgeLayout from "./components/SponsorBridgeLayout";
import { OrgAuthGate } from "./components/OrgAuthGate";

// Public pages
import Home from "./pages/Home";
import PolicyAck from "./pages/PolicyAck";
import PricingPage from "./pages/PricingPage";
import CampaignPreviewPage from "./pages/projects/CampaignPreviewPage";

// Custom auth pages
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Org dashboard & onboarding
import OrgDashboard from "./pages/OrgDashboard";
import OnboardingChecklist from "./pages/OnboardingChecklist";

// Dashboard shell (internal staff)
import Dashboard from "./pages/Dashboard";

// Children
import ChildrenList from "./pages/children/ChildrenList";
import ChildDetail from "./pages/children/ChildDetail";
import ChildNew from "./pages/children/ChildNew";

// Sponsors
import SponsorsList from "./pages/sponsors/SponsorsList";
import SponsorDetail from "./pages/sponsors/SponsorDetail";

// Sponsorships / Matching
import MatchingBoard from "./pages/matching/MatchingBoard";
import SponsorshipDetail from "./pages/matching/SponsorshipDetail";

// Vlogs
import VlogQueue from "./pages/vlogs/VlogQueue";

// Messages
import MessageQueue from "./pages/messages/MessageQueue";

// Payments
import PaymentsPage from "./pages/payments/PaymentsPage";

// Analytics
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";

// Events
import EventsPage from "./pages/events/EventsPage";

// Reports
import ReportsPage from "./pages/reports/ReportsPage";

// Sponsor impact dashboard
import SponsorImpactDashboard from "./pages/sponsors/SponsorImpactDashboard";

// Safeguarding
import IncidentsList from "./pages/safeguarding/IncidentsList";
import IncidentDetail from "./pages/safeguarding/IncidentDetail";
import AuditLog from "./pages/safeguarding/AuditLog";
import BackgroundChecks from "./pages/safeguarding/BackgroundChecks";
import ConsentManager from "./pages/safeguarding/ConsentManager";

// Community
import CommunityPage from "./pages/community/CommunityPage";

// Sponsor portal
import SponsorLoginPage from "./pages/sponsor/SponsorLoginPage";
import SponsorDashboard from "./pages/sponsor/SponsorDashboard";
import SponsorChildPage from "./pages/sponsor/SponsorChildPage";
import SponsorMessagesPage from "./pages/sponsor/SponsorMessagesPage";
import SponsorPaymentsPage from "./pages/sponsor/SponsorPaymentsPage";
import SponsorProfilePage from "./pages/sponsor/SponsorProfilePage";

// Projects
import ProjectsList from "./pages/projects/ProjectsList";
import ProjectForm from "./pages/projects/ProjectForm";
import ProjectDetail from "./pages/projects/ProjectDetail";
import FundraisingPage from "./pages/projects/FundraisingPage";

// Sponsor portal - Projects
import SponsorProjectsPage from "./pages/sponsor/SponsorProjectsPage";

// System Admin
import SystemAdminDashboard from "./pages/admin/SystemAdminDashboard";

// Settings
import TenantSettings from "./pages/settings/TenantSettings";
import UserManagement from "./pages/settings/UserManagement";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      {/* Public marketing */}
      <Route path="/" component={Home} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/campaign-preview" component={CampaignPreviewPage} />
      <Route path="/policy" component={PolicyAck} />

      {/* Custom auth */}
      <Route path="/register" component={RegisterPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/verify-otp" component={VerifyOtpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Post-auth flows */}
      <Route path="/onboarding" component={OnboardingChecklist} />
      <Route path="/org-dashboard" component={OrgDashboard} />

      {/* Internal staff dashboard */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Children */}
      <Route path="/children" component={ChildrenList} />
      <Route path="/children/new" component={ChildNew} />
      <Route path="/children/:id" component={ChildDetail} />

      {/* Sponsors */}
      <Route path="/sponsors" component={SponsorsList} />
      <Route path="/sponsors/:id/impact" component={SponsorImpactDashboard} />
      <Route path="/sponsors/:id" component={SponsorDetail} />

      {/* Matching */}
      <Route path="/matching" component={MatchingBoard} />
      <Route path="/sponsorships/:id" component={SponsorshipDetail} />

      {/* Vlogs */}
      <Route path="/vlogs" component={VlogQueue} />

      {/* Messages */}
      <Route path="/messages" component={MessageQueue} />

      {/* Payments */}
      <Route path="/payments" component={PaymentsPage} />

      {/* Analytics */}
      <Route path="/analytics" component={AnalyticsDashboard} />

      {/* Events */}
      <Route path="/events" component={() => <OrgAuthGate><EventsPage /></OrgAuthGate>} />

      {/* Reports */}
      <Route path="/reports" component={() => <OrgAuthGate><ReportsPage /></OrgAuthGate>} />

      {/* Safeguarding */}
      <Route path="/safeguarding/incidents" component={IncidentsList} />
      <Route path="/safeguarding/incidents/:id" component={IncidentDetail} />
      <Route path="/safeguarding/audit" component={AuditLog} />
      <Route path="/safeguarding/background-checks" component={BackgroundChecks} />
      <Route path="/safeguarding/consent" component={ConsentManager} />

      {/* Community & Ambassador */}
      <Route path="/community" component={CommunityPage} />

      {/* Projects (staff) */}
      <Route path="/projects" component={() => <SponsorBridgeLayout><ProjectsList /></SponsorBridgeLayout>} />
      <Route path="/projects/new" component={() => <SponsorBridgeLayout><ProjectForm /></SponsorBridgeLayout>} />
      <Route path="/projects/:id/edit" component={({ params }: { params: { id: string } }) => <SponsorBridgeLayout><ProjectForm projectId={parseInt(params.id)} /></SponsorBridgeLayout>} />
      <Route path="/projects/:id" component={({ params }: { params: { id: string } }) => <SponsorBridgeLayout><ProjectDetail projectId={parseInt(params.id)} /></SponsorBridgeLayout>} />

      {/* Public fundraising pages */}
      <Route path="/fund/:slug" component={({ params }: { params: { slug: string } }) => <FundraisingPage slug={params.slug} />} />
      <Route path="/fund/:slug/thank-you" component={({ params }: { params: { slug: string } }) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50/50 to-background">
          <div className="text-center space-y-4 p-8">
            <div className="text-5xl">🎉</div>
            <h1 className="text-3xl font-bold">Thank you for your generosity!</h1>
            <p className="text-muted-foreground">Your contribution is being processed. A receipt will be emailed to you shortly.</p>
            <a href={`/fund/${params.slug}`} className="inline-block mt-4 text-primary underline">Return to campaign</a>
          </div>
        </div>
      )} />

      {/* Sponsor portal */}
      <Route path="/sponsor/login" component={SponsorLoginPage} />
      <Route path="/sponsor/dashboard" component={SponsorDashboard} />
      <Route path="/sponsor/child" component={SponsorChildPage} />
      <Route path="/sponsor/messages" component={SponsorMessagesPage} />
      <Route path="/sponsor/payments" component={SponsorPaymentsPage} />
      <Route path="/sponsor/profile" component={SponsorProfilePage} />
      <Route path="/sponsor/projects" component={SponsorProjectsPage} />

      {/* System Admin */}
      <Route path="/admin" component={SystemAdminDashboard} />

      {/* Settings */}
      <Route path="/settings/tenant" component={TenantSettings} />
      <Route path="/settings/users" component={UserManagement} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CustomAuthProvider>
          <SponsorAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          </SponsorAuthProvider>
        </CustomAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
