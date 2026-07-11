import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock,
  Heart, MessageSquare, TrendingUp, Users, Video, Wallet,
} from "lucide-react";
import { Link } from "wouter";

const DEMO_TENANT_ID = 1;

function StatCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, href, urgent }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string; iconBg: string; href?: string; urgent?: boolean;
}) {
  const inner = (
    <Card className={`card-hover cursor-pointer ${urgent ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${urgent ? "text-destructive" : "text-foreground"}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
        {href && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-primary font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.analytics.dashboard.useQuery({ tenantId: DEMO_TENANT_ID }, { refetchInterval: 30000 });
  const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <SponsorBridgeLayout>
      <div className="p-6 space-y-6 animate-in-up">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening across your sponsorship programme today.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-5 pb-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Active Sponsors" value={stats?.totalSponsors ?? 0} subtitle="Currently active" icon={Users} iconColor="text-trust-blue" iconBg="bg-blue-50" href="/sponsors" />
            <StatCard title="Children in Programme" value={stats?.totalChildren ?? 0} subtitle={`${stats?.activeSponsored ?? 0} sponsored`} icon={Heart} iconColor="text-terracotta" iconBg="bg-red-50" href="/children" />
            <StatCard title="Available Children" value={stats?.availableChildren ?? 0} subtitle="Awaiting a sponsor" icon={Heart} iconColor="text-sage" iconBg="bg-green-50" href="/children" />
            <StatCard title="Active Sponsorships" value={stats?.activeSponsorships ?? 0} subtitle="Ongoing relationships" icon={TrendingUp} iconColor="text-golden-nectar" iconBg="bg-amber-50" href="/matching" />
            <StatCard title="Vlogs Pending Review" value={stats?.pendingVlogs ?? 0} subtitle="Awaiting moderation" icon={Video} iconColor="text-purple-600" iconBg="bg-purple-50" href="/vlogs" urgent={(stats?.pendingVlogs ?? 0) > 5} />
            <StatCard title="Messages Pending" value={stats?.pendingMessages ?? 0} subtitle="Awaiting approval" icon={MessageSquare} iconColor="text-trust-blue" iconBg="bg-blue-50" href="/messages" urgent={(stats?.pendingMessages ?? 0) > 10} />
            <StatCard title="Open Incidents" value={stats?.openIncidents ?? 0} subtitle="Safeguarding cases" icon={AlertTriangle} iconColor="text-destructive" iconBg="bg-red-50" href="/safeguarding/incidents" urgent={(stats?.openIncidents ?? 0) > 0} />
            <StatCard title="Total Revenue" value={fmt(stats?.totalRevenueCents ?? 0)} subtitle="All time" icon={Wallet} iconColor="text-sage" iconBg="bg-green-50" href="/payments" />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-golden-nectar" />
                90-Day Onboarding Sequence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { day: 1, label: "Welcome email + thank you", auto: true },
                { day: 3, label: "Child's story in detail", auto: true },
                { day: 7, label: "How sponsorship works guide", auto: true },
                { day: 14, label: "Community impact update", auto: true },
                { day: 30, label: "First vlog from child", auto: false },
                { day: 90, label: "Milestone celebration + NPS survey", auto: true },
              ].map((step) => (
                <div key={step.day} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center shrink-0">
                    {step.day}
                  </div>
                  <span className="text-sm flex-1">{step.label}</span>
                  <Badge variant="outline" className={step.auto ? "text-sage border-sage/30 bg-green-50 text-xs" : "text-amber-700 border-amber-300 bg-amber-50 text-xs"}>
                    {step.auto ? "Automated" : "Needs Upload"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-trust-blue" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Child protection policies", status: "Active", ok: true },
                { label: "Vlog moderation queue", status: (stats?.pendingVlogs ?? 0) === 0 ? "Clear" : `${stats?.pendingVlogs} pending`, ok: (stats?.pendingVlogs ?? 0) === 0 },
                { label: "Message moderation queue", status: (stats?.pendingMessages ?? 0) === 0 ? "Clear" : `${stats?.pendingMessages} pending`, ok: (stats?.pendingMessages ?? 0) === 0 },
                { label: "Open safeguarding incidents", status: (stats?.openIncidents ?? 0) === 0 ? "None" : `${stats?.openIncidents} open`, ok: (stats?.openIncidents ?? 0) === 0 },
                { label: "Audit trail", status: "Immutable & active", ok: true },
                { label: "Data compliance", status: "GDPR & COPPA", ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.ok ? "text-sage" : "text-destructive"}`} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className={`text-xs font-medium ${item.ok ? "text-sage" : "text-destructive"}`}>{item.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Child", href: "/children/new", icon: Heart, color: "text-terracotta" },
            { label: "Review Vlogs", href: "/vlogs", icon: Video, color: "text-purple-600" },
            { label: "Approve Messages", href: "/messages", icon: MessageSquare, color: "text-trust-blue" },
            { label: "View Analytics", href: "/analytics", icon: BarChart3, color: "text-sage" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 bg-white hover:bg-accent">
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
