import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Users, Baby, Heart, Video, MessageSquare, BarChart3,
  Shield, Settings, ArrowRight, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, LogOut, Building2
} from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgDashboard() {
  const { account, loading: authLoading, logout } = useCustomAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !account) {
      navigate("/login");
    } else if (!authLoading && account && !account.onboardingCompletedAt) {
      navigate("/onboarding");
    }
  }, [account, authLoading, navigate]);

  // Use a simple fetch for org-level stats since custom auth is separate from Manus OAuth
  // We'll derive stats from the analytics router once the user has a tenant
  const statsLoading = false;
  const stats = { activeSponsors: 0, totalChildren: 0, pendingVlogs: 0, pendingMessages: 0 };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-brand-red border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const QUICK_LINKS = [
    { href: "/children/new", icon: Baby, label: "Add a child", color: "bg-red-50 text-terracotta" },
    { href: "/matching", icon: Heart, label: "Match sponsors", color: "bg-pink-50 text-pink-600" },
    { href: "/vlogs", icon: Video, label: "Review vlogs", color: "bg-green-50 text-sage" },
    { href: "/messages", icon: MessageSquare, label: "Message queue", color: "bg-purple-50 text-purple-600" },
    { href: "/analytics", icon: BarChart3, label: "Analytics", color: "bg-blue-50 text-trust-blue" },
    { href: "/safeguarding/incidents", icon: Shield, label: "Safeguarding", color: "bg-amber-50 text-amber-600" },
    { href: "/settings/tenant", icon: Settings, label: "Settings", color: "bg-gray-100 text-gray-600" },
    { href: "/community", icon: Users, label: "Community", color: "bg-teal-50 text-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Top nav */}
      <nav className="bg-[#1a2e1a] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">{account.orgName}</span>
              <Badge variant="outline" className="ml-2 text-white/60 border-white/20 text-xs py-0">
                {account.planTier}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Staff Portal
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => { logout(); navigate("/"); }}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a2e1a]">
            Welcome back, {account.firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of <strong>{account.orgName}</strong>'s sponsorship programme.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Active Sponsors",
              value: statsLoading ? null : (stats?.activeSponsors ?? 0),
              icon: Users,
              trend: "+12% this month",
              color: "text-trust-blue",
              bg: "bg-blue-50",
            },
            {
              label: "Children in Programme",
              value: statsLoading ? null : (stats?.totalChildren ?? 0),
              icon: Baby,
              trend: null,
              color: "text-terracotta",
              bg: "bg-red-50",
            },
            {
              label: "Active Sponsorships",
              value: statsLoading ? null : (stats?.activeSponsors ?? 0),
              icon: Heart,
              trend: null,
              color: "text-pink-600",
              bg: "bg-pink-50",
            },
            {
              label: "Pending Actions",
              value: statsLoading ? null : ((stats?.pendingVlogs ?? 0) + (stats?.pendingMessages ?? 0)),
              icon: Clock,
              trend: "Requires attention",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-[#1a2e1a]">{kpi.value}</div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                {kpi.trend && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">{kpi.trend}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1a2e1a]">Quick actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {QUICK_LINKS.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-brand-red/30 hover:bg-brand-red/5 cursor-pointer transition-all group">
                        <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center`}>
                          <link.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground text-center leading-tight">
                          {link.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending items */}
            <Card className="border-border shadow-sm mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1a2e1a]">Items requiring attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))
                ) : (
                  <>
                    {(stats?.pendingVlogs ?? 0) > 0 && (
                      <Link href="/vlogs">
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-800">
                              {stats?.pendingVlogs} vlog{(stats?.pendingVlogs ?? 0) > 1 ? "s" : ""} awaiting moderation
                            </p>
                            <p className="text-xs text-amber-600">Review before they reach sponsors</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                        </div>
                      </Link>
                    )}
                    {(stats?.pendingMessages ?? 0) > 0 && (
                      <Link href="/messages">
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors">
                          <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-800">
                              {stats?.pendingMessages} message{(stats?.pendingMessages ?? 0) > 1 ? "s" : ""} in moderation queue
                            </p>
                            <p className="text-xs text-purple-600">Review and approve or reject</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />
                        </div>
                      </Link>
                    )}
                    {(stats?.pendingVlogs ?? 0) === 0 && (stats?.pendingMessages ?? 0) === 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800">All queues are clear — great work!</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Organisation info */}
          <div className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1a2e1a]">Your organisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1a2e1a]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#1a2e1a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#1a2e1a]">{account.orgName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.planTier} plan</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account holder</span>
                    <span className="font-medium">{account.firstName} {account.lastName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-xs truncate max-w-[140px]">{account.email}</span>
                  </div>
                </div>
                <Link href="/settings/tenant">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Organisation settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1a2e1a]">Plan usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "Sponsors",
                    used: stats?.activeSponsors ?? 0,
                    limit: account.planTier === "starter" ? 50 : account.planTier === "growth" ? 500 : account.planTier === "scale" ? 2000 : null,
                  },
                  {
                    label: "Children",
                    used: stats?.totalChildren ?? 0,
                    limit: account.planTier === "starter" ? 100 : account.planTier === "growth" ? 1000 : account.planTier === "scale" ? 5000 : null,
                  },
                ].map((item) => {
                  const pct = item.limit ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">
                          {item.used}{item.limit ? ` / ${item.limit}` : " (unlimited)"}
                        </span>
                      </div>
                      {item.limit && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct > 80 ? "bg-amber-500" : "bg-brand-red"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="w-full mt-1 text-brand-red border-brand-red/30 hover:bg-brand-red/5">
                    Upgrade plan
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
