import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import {
  LayoutDashboard, Baby, Users, MessageSquare, BarChart3,
  DollarSign, Calendar, Settings, LogOut, Bell, ChevronDown,
  TrendingUp, TrendingDown, UserPlus, Heart, AlertTriangle,
  CheckCircle2, Clock, Eye, ArrowRight, Building2, Globe,
  Shield, Video, FileText, Download,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgStats {
  totalSponsors: number;
  totalChildren: number;
  activeSponsorships: number;
  availableChildren: number;
  sponsoredChildren: number;
  pendingVlogs: number;
  pendingMessages: number;
  totalRevenueCents: number;
  newSponsors30d: number;
  newChildren30d: number;
  retentionPct: number;
}

interface Activity {
  type: string;
  label: string;
  at: string | null;
}

interface SpotlightChild {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  country: string | null;
  programType: string | null;
  status: string;
  photoUrl: string | null;
  sponsorName?: string | null;
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/org-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/children", icon: Baby, label: "Children" },
  { href: "/sponsors", icon: Users, label: "Sponsors" },
  { href: "/messages", icon: MessageSquare, label: "Communications" },
  { href: "/analytics", icon: BarChart3, label: "Reports" },
  { href: "/payments", icon: DollarSign, label: "Donations" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/settings/tenant", icon: Settings, label: "Settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function activityIcon(type: string) {
  switch (type) {
    case "sponsor_registered": return <UserPlus className="w-3.5 h-3.5 text-trust-blue" />;
    case "child_added": return <Baby className="w-3.5 h-3.5 text-sage" />;
    case "payment_received": return <DollarSign className="w-3.5 h-3.5 text-green-600" />;
    case "message": return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
    default: return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function activityBg(type: string) {
  switch (type) {
    case "sponsor_registered": return "bg-blue-50";
    case "child_added": return "bg-green-50";
    case "payment_received": return "bg-emerald-50";
    case "message": return "bg-purple-50";
    default: return "bg-gray-50";
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ currentPath, account, onLogout }: {
  currentPath: string;
  account: any;
  onLogout: () => void;
}) {
  return (
    <aside className="w-56 shrink-0 bg-[#1a3a2e] flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/org-dashboard">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img
              src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-icon-mark_2e7e3e8d.svg"
              alt="SponsorBridge"
              className="h-8 w-8"
            />
            <span className="text-white font-bold text-sm tracking-tight">SponsorBridge</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.href || (item.href !== "/org-dashboard" && currentPath.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium ${
                  active
                    ? "bg-[#c1440e] text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-[#c1440e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {account?.firstName?.[0]}{account?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{account?.firstName} {account?.lastName}</p>
                <p className="text-white/50 text-xs truncate capitalize">{account?.planTier} plan</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings/tenant">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, trend, trendUp, loading }: {
  label: string; value: number | string; icon: any;
  trend?: string; trendUp?: boolean; loading?: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3a2e]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#1a3a2e]" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-3xl font-bold text-[#1a3a2e] tracking-tight">{value}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendUp !== undefined ? (
              trendUp
                ? <TrendingUp className="w-3 h-3 text-green-600" />
                : <TrendingDown className="w-3 h-3 text-red-500" />
            ) : null}
            <span className={`text-xs font-medium ${trendUp ? "text-green-600" : trendUp === false ? "text-red-500" : "text-muted-foreground"}`}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Child Spotlight ──────────────────────────────────────────────────────────

function ChildSpotlight({ child, loading }: { child: SpotlightChild | null; loading: boolean }) {
  const age = child ? calcAge(child.dateOfBirth) : null;
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Child Profile</CardTitle>
        {child && (
          <Link href={`/children/${child.id}`}>
            <Button size="sm" variant="ghost" className="text-xs text-[#c1440e] hover:text-[#c1440e] hover:bg-[#c1440e]/10 h-7 px-2">
              <Eye className="w-3.5 h-3.5 mr-1" /> View All
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-4">
            <Skeleton className="w-24 h-32 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : !child ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Baby className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No children added yet.</p>
            <Link href="/children/new">
              <Button size="sm" className="mt-3 bg-[#c1440e] hover:bg-[#a83a0c] text-white">
                Add first child
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Photo placeholder */}
            <div className="w-24 h-32 rounded-xl bg-[#f0ebe3] flex items-center justify-center shrink-0 overflow-hidden">
              {child.photoUrl ? (
                <img src={child.photoUrl} alt={child.firstName} className="w-full h-full object-cover" />
              ) : (
                <Baby className="w-10 h-10 text-[#c1440e]/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-[#1a3a2e] text-base">{child.firstName} {child.lastName[0]}.</h3>
                <Badge
                  className={`text-xs ${child.status === "SPONSORED" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
                  variant="outline"
                >
                  {child.status === "SPONSORED" ? "Sponsored" : child.status.charAt(0) + child.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                {age !== null && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Age</span>
                    <span className="font-medium text-[#1a3a2e]">{age} years</span>
                  </div>
                )}
                {child.gender && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Gender</span>
                    <span className="font-medium text-[#1a3a2e] capitalize">{child.gender}</span>
                  </div>
                )}
                {child.country && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Country</span>
                    <span className="font-medium text-[#1a3a2e]">{child.country}</span>
                  </div>
                )}
                {child.programType && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Program</span>
                    <span className="font-medium text-[#1a3a2e]">{child.programType}</span>
                  </div>
                )}
                {child.sponsorName && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">Sponsor</span>
                    <span className="font-medium text-[#1a3a2e]">{child.sponsorName}</span>
                  </div>
                )}
              </div>
              <Link href={`/children/${child.id}`}>
                <Button size="sm" className="mt-3 bg-[#c1440e] hover:bg-[#a83a0c] text-white text-xs h-7">
                  View Full Profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivity({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full ${activityBg(a.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                {activityIcon(a.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1a3a2e] leading-snug">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.at)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sponsorship Overview Chart ───────────────────────────────────────────────

const STATUS_COLORS = {
  SPONSORED: "#1a3a2e",
  AVAILABLE: "#c1440e",
  WAITLISTED: "#f4a261",
  GRADUATED: "#94a3b8",
};

function SponsorshipOverview({ stats, loading }: { stats: OrgStats | null; loading: boolean }) {
  if (loading) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Sponsorship Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pieData = stats ? [
    { name: "Sponsored", value: stats.sponsoredChildren, color: STATUS_COLORS.SPONSORED },
    { name: "Available", value: stats.availableChildren, color: STATUS_COLORS.AVAILABLE },
  ].filter(d => d.value > 0) : [];

  const barData = stats ? [
    { name: "Sponsors", value: stats.totalSponsors, fill: "#1a3a2e" },
    { name: "Children", value: stats.totalChildren, fill: "#c1440e" },
    { name: "Active", value: stats.activeSponsorships, fill: "#f4a261" },
  ] : [];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Sponsorship Overview</CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Download className="w-3 h-3" /> Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Children Status</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip formatter={(v: any) => [v, ""]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Platform Totals</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pending Alerts ───────────────────────────────────────────────────────────

function PendingAlerts({ stats, loading }: { stats: OrgStats | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-20 w-full rounded-xl" />;
  const alerts = [];
  if (stats?.pendingVlogs) alerts.push({ href: "/vlogs", icon: Video, label: `${stats.pendingVlogs} vlog${stats.pendingVlogs > 1 ? "s" : ""} awaiting moderation`, color: "amber" });
  if (stats?.pendingMessages) alerts.push({ href: "/messages", icon: MessageSquare, label: `${stats.pendingMessages} message${stats.pendingMessages > 1 ? "s" : ""} in moderation queue`, color: "purple" });
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-medium">All queues are clear — great work!</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <Link key={a.href} href={a.href}>
          <div className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            a.color === "amber" ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-purple-200 bg-purple-50 hover:bg-purple-100"
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 ${a.color === "amber" ? "text-amber-600" : "text-purple-600"}`} />
            <p className={`text-sm font-medium flex-1 ${a.color === "amber" ? "text-amber-800" : "text-purple-800"}`}>{a.label}</p>
            <ArrowRight className={`w-4 h-4 shrink-0 ${a.color === "amber" ? "text-amber-600" : "text-purple-600"}`} />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function OrgDashboard() {
  const { account, loading: authLoading, logout } = useCustomAuth();
  const [location, navigate] = useLocation();

  const [stats, setStats] = useState<OrgStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [spotlight, setSpotlight] = useState<SpotlightChild | null>(null);
  const [spotlightLoading, setSpotlightLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !account) navigate("/login");
    else if (!authLoading && account && !account.onboardingCompletedAt) navigate("/onboarding");
  }, [account, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const [statsRes, actRes, spotRes] = await Promise.all([
        fetch("/api/auth/org-dashboard-stats", { credentials: "include" }),
        fetch("/api/auth/org-recent-activity", { credentials: "include" }),
        fetch("/api/auth/org-spotlight-child", { credentials: "include" }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (actRes.ok) { const d = await actRes.json(); setActivities(d.activities ?? []); }
      if (spotRes.ok) { const d = await spotRes.json(); setSpotlight(d.child ?? null); }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setStatsLoading(false);
      setActivitiesLoading(false);
      setSpotlightLoading(false);
    }
  }, [account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#c1440e] border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex min-h-screen bg-[#f7f5f2]">
      <Sidebar currentPath={location} account={account} onLogout={() => { logout(); navigate("/"); }} />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-[#1a3a2e]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-[#1a3a2e]">
              <Bell className="w-4 h-4" />
              {((stats?.pendingVlogs ?? 0) + (stats?.pendingMessages ?? 0)) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#c1440e] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {(stats?.pendingVlogs ?? 0) + (stats?.pendingMessages ?? 0)}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-[#1a3a2e]">{greeting}, {account.firstName}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-6 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              label="Sponsors"
              value={stats?.totalSponsors ?? 0}
              icon={Users}
              trend={stats?.newSponsors30d ? `+${stats.newSponsors30d}% vs last month` : undefined}
              trendUp={true}
              loading={statsLoading}
            />
            <KpiCard
              label="Children"
              value={stats?.totalChildren ?? 0}
              icon={Baby}
              trend={stats?.newChildren30d ? `+${stats.newChildren30d} vs last month` : undefined}
              trendUp={true}
              loading={statsLoading}
            />
            <KpiCard
              label="Retention"
              value={statsLoading ? 0 : `${stats?.retentionPct ?? 0}%`}
              icon={Heart}
              trend={stats ? `+${Math.max(0, (stats.retentionPct ?? 0) - 93)}% vs last month` : undefined}
              trendUp={true}
              loading={statsLoading}
            />
          </div>

          {/* Pending alerts */}
          <PendingAlerts stats={stats} loading={statsLoading} />

          {/* Child spotlight + Recent activity */}
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ChildSpotlight child={spotlight} loading={spotlightLoading} />
            </div>
            <div className="lg:col-span-2">
              <RecentActivity activities={activities} loading={activitiesLoading} />
            </div>
          </div>

          {/* Sponsorship overview */}
          <SponsorshipOverview stats={stats} loading={statsLoading} />

          {/* Quick links grid */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: "/children/new", icon: Baby, label: "Add a child", bg: "bg-red-50", color: "text-[#c1440e]" },
                  { href: "/matching", icon: Heart, label: "Match sponsors", bg: "bg-pink-50", color: "text-pink-600" },
                  { href: "/vlogs", icon: Video, label: "Review vlogs", bg: "bg-green-50", color: "text-[#1a3a2e]" },
                  { href: "/messages", icon: MessageSquare, label: "Message queue", bg: "bg-purple-50", color: "text-purple-600" },
                  { href: "/analytics", icon: BarChart3, label: "Analytics", bg: "bg-blue-50", color: "text-trust-blue" },
                  { href: "/safeguarding/incidents", icon: Shield, label: "Safeguarding", bg: "bg-amber-50", color: "text-amber-600" },
                  { href: "/reports", icon: FileText, label: "Reports", bg: "bg-teal-50", color: "text-teal-600" },
                  { href: "/settings/tenant", icon: Settings, label: "Settings", bg: "bg-gray-100", color: "text-gray-600" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#c1440e]/30 hover:bg-[#c1440e]/5 cursor-pointer transition-all group">
                      <div className={`w-10 h-10 rounded-lg ${link.bg} flex items-center justify-center`}>
                        <link.icon className={`w-5 h-5 ${link.color}`} />
                      </div>
                      <span className="text-xs font-medium text-foreground text-center leading-tight">{link.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan usage */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a3a2e]">Plan Usage</CardTitle>
              <Badge variant="outline" className="capitalize text-xs">{account.planTier}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Sponsors", used: stats?.totalSponsors ?? 0, limit: account.planTier === "starter" ? 50 : account.planTier === "growth" ? 500 : null },
                  { label: "Children", used: stats?.totalChildren ?? 0, limit: account.planTier === "starter" ? 100 : account.planTier === "growth" ? 1000 : null },
                ].map((item) => {
                  const pct = item.limit ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                        <span className="font-semibold text-[#1a3a2e]">
                          {item.used}{item.limit ? ` / ${item.limit}` : " (unlimited)"}
                        </span>
                      </div>
                      {item.limit && (
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct > 80 ? "bg-amber-500" : "bg-[#c1440e]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="mt-4 text-[#c1440e] border-[#c1440e]/30 hover:bg-[#c1440e]/5">
                  Upgrade plan <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
