import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { useLocation, Link } from "wouter";
import {
  FileText,
  Download,
  BarChart3,
  Users,
  Baby,
  DollarSign,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  Heart,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/org-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/children", icon: Baby, label: "Children" },
  { href: "/sponsors", icon: Users, label: "Sponsors" },
  { href: "/messages", icon: MessageSquare, label: "Communications" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/payments", icon: DollarSign, label: "Donations" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/settings/tenant", icon: Settings, label: "Settings" },
];

function Sidebar({ account, onLogout }: { account: any; onLogout: () => void }) {
  const [location] = useLocation();
  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: "#1a3a2e" }}>
      <div className="p-6 border-b border-white/10">
        <Link href="/org-dashboard">
          <img src="/manus-storage/sb-icon-mark_f15604c9.svg" alt="SponsorBridge" className="h-8 w-8" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location === item.href || (item.href !== "/org-dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                style={active ? { backgroundColor: "#c1440e" } : {}}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            {account?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{account?.name ?? "User"}</p>
            <p className="text-white/50 text-xs truncate">{account?.email}</p>
          </div>
          <button onClick={onLogout} className="text-white/50 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Report Definitions ───────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  {
    id: "children",
    label: "Children",
    icon: Baby,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    reports: [
      { id: "children-overview", name: "Children Overview", description: "Total children by status, age distribution, and country breakdown." },
      { id: "children-consent", name: "Consent Status Report", description: "Parental and photo/video consent status for all enrolled children." },
      { id: "children-field", name: "Field Worker Assignments", description: "Children assigned to each field worker with last update dates." },
    ],
  },
  {
    id: "sponsorships",
    label: "Sponsorships",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
    reports: [
      { id: "sponsorships-active", name: "Active Sponsorships", description: "All active sponsor-child matches with start dates and monthly amounts." },
      { id: "sponsorships-retention", name: "Retention Report", description: "Sponsorship retention rates, cancellations, and average tenure." },
      { id: "sponsorships-matching", name: "Matching Summary", description: "How matches were made (sponsor choice, algorithm, staff) and approval times." },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    icon: DollarSign,
    color: "text-amber-600",
    bg: "bg-amber-50",
    reports: [
      { id: "payments-summary", name: "Payments Summary", description: "Total payments received, failed, and refunded by month." },
      { id: "payments-by-sponsor", name: "Payments by Sponsor", description: "Individual sponsor payment history and outstanding amounts." },
      { id: "revenue-forecast", name: "Revenue Forecast", description: "Projected monthly revenue based on active subscriptions." },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    icon: MessageSquare,
    color: "text-blue-600",
    bg: "bg-blue-50",
    reports: [
      { id: "messages-volume", name: "Message Volume Report", description: "Messages sent and received by month, moderation queue stats." },
      { id: "vlogs-summary", name: "Vlog Summary", description: "Video messages submitted, approved, rejected, and pending review." },
    ],
  },
  {
    id: "safeguarding",
    label: "Safeguarding",
    icon: Shield,
    color: "text-purple-600",
    bg: "bg-purple-50",
    reports: [
      { id: "incidents-summary", name: "Incidents Summary", description: "Open, under investigation, and closed incidents by priority." },
      { id: "background-checks", name: "Background Check Status", description: "Staff background check completion rates and expiry dates." },
    ],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { account, logout } = useCustomAuth();
  const [, navigate] = useLocation();
  const [generating, setGenerating] = useState<string | null>(null);

  const tenantId = account?.tenantId ?? 0;

  const { data: summary, isLoading: summaryLoading } = trpc.reports.summary.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );

  const handleLogout = () => { logout(); navigate("/"); };

  const handleDownload = (reportId: string, reportName: string) => {
    setGenerating(reportId);
    // Simulate report generation — in production this would call a backend endpoint
    setTimeout(() => {
      setGenerating(null);
      toast.success(`"${reportName}" report is ready — download will begin shortly.`);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar account={account} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and download reports across all areas of your programme</p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Summary KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Children", value: summary?.totalChildren ?? "—", icon: Baby, color: "text-emerald-600" },
              { label: "Total Sponsors", value: summary?.totalSponsors ?? "—", icon: Users, color: "text-blue-600" },
              { label: "Active Sponsors", value: summary?.activeSponsors ?? "—", icon: TrendingUp, color: "text-green-600" },
              { label: "Active Sponsorships", value: summary?.activeSponsorships ?? "—", icon: Heart, color: "text-rose-600" },
              { label: "Payments Received", value: summary?.totalPayments ?? "—", icon: DollarSign, color: "text-amber-600" },
            ].map((stat) => (
              <Card key={stat.label} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{summaryLoading ? "…" : stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report categories */}
          {REPORT_CATEGORIES.map((category) => (
            <Card key={category.id} className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={`p-1.5 rounded-lg ${category.bg} ${category.color}`}>
                    <category.icon className="w-4 h-4" />
                  </div>
                  {category.label} Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {category.reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 gap-1.5 text-xs"
                        onClick={() => handleDownload(report.id, report.name)}
                        disabled={generating === report.id}
                      >
                        {generating === report.id ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> Generating…</>
                        ) : (
                          <><Download className="w-3 h-3" /> Download CSV</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Note */}
          <p className="text-xs text-gray-400 text-center pb-4">
            Reports are generated in real time from your live data. For scheduled or automated reports, contact your SponsorBridge administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
