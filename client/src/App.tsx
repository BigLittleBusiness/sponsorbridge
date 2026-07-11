import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import PolicyAck from "./pages/PolicyAck";

// Dashboard shell
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

// Safeguarding
import IncidentsList from "./pages/safeguarding/IncidentsList";
import IncidentDetail from "./pages/safeguarding/IncidentDetail";
import AuditLog from "./pages/safeguarding/AuditLog";
import BackgroundChecks from "./pages/safeguarding/BackgroundChecks";
import ConsentManager from "./pages/safeguarding/ConsentManager";

// Settings
import TenantSettings from "./pages/settings/TenantSettings";
import UserManagement from "./pages/settings/UserManagement";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/policy" component={PolicyAck} />

      {/* Dashboard */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Children */}
      <Route path="/children" component={ChildrenList} />
      <Route path="/children/new" component={ChildNew} />
      <Route path="/children/:id" component={ChildDetail} />

      {/* Sponsors */}
      <Route path="/sponsors" component={SponsorsList} />
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

      {/* Safeguarding */}
      <Route path="/safeguarding/incidents" component={IncidentsList} />
      <Route path="/safeguarding/incidents/:id" component={IncidentDetail} />
      <Route path="/safeguarding/audit" component={AuditLog} />
      <Route path="/safeguarding/background-checks" component={BackgroundChecks} />
      <Route path="/safeguarding/consent" component={ConsentManager} />

      {/* Settings */}
      <Route path="/settings/tenant" component={TenantSettings} />
      <Route path="/settings/users" component={UserManagement} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
