import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Heart, TrendingUp, Users, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const DEMO_TENANT_ID = 1;
const COLORS = ["#D14A2E", "#3B82F6", "#57A773", "#F4A261", "#8B5CF6"];

export default function AnalyticsDashboard() {
  const { data: stats } = trpc.analytics.dashboard.useQuery({ tenantId: DEMO_TENANT_ID });
  const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const childStatusData = [
    { name: "Available", value: stats?.availableChildren ?? 0 },
    { name: "Sponsored", value: stats?.activeSponsored ?? 0 },
    { name: "Graduated", value: Math.max(0, (stats?.totalChildren ?? 0) - (stats?.availableChildren ?? 0) - (stats?.activeSponsored ?? 0)) },
  ].filter((d) => d.value > 0);

  const overviewData = [
    { name: "Sponsors", value: stats?.totalSponsors ?? 0 },
    { name: "Children", value: stats?.totalChildren ?? 0 },
    { name: "Sponsorships", value: stats?.activeSponsorships ?? 0 },
    { name: "Pending Vlogs", value: stats?.pendingVlogs ?? 0 },
    { name: "Pending Msgs", value: stats?.pendingMessages ?? 0 },
  ];

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-trust-blue" />Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Programme performance overview</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Sponsors", value: stats?.totalSponsors ?? 0, icon: Users, color: "text-trust-blue", bg: "bg-blue-50" },
            { label: "Children in Programme", value: stats?.totalChildren ?? 0, icon: Heart, color: "text-terracotta", bg: "bg-red-50" },
            { label: "Active Sponsorships", value: stats?.activeSponsorships ?? 0, icon: TrendingUp, color: "text-golden-nectar", bg: "bg-amber-50" },
            { label: "Total Revenue", value: fmt(stats?.totalRevenueCents ?? 0), icon: Wallet, color: "text-sage", bg: "bg-green-50" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Programme Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={overviewData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#D14A2E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Child Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {childStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={childStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {childStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Moderation Queue Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pending Vlogs", value: stats?.pendingVlogs ?? 0, threshold: 5, color: "text-purple-600" },
                { label: "Pending Messages", value: stats?.pendingMessages ?? 0, threshold: 10, color: "text-trust-blue" },
                { label: "Open Incidents", value: stats?.openIncidents ?? 0, threshold: 1, color: "text-destructive" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-4 ${item.value >= item.threshold ? "border-destructive/30 bg-red-50" : "border-border bg-muted/30"}`}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${item.value >= item.threshold ? "text-destructive" : item.color}`}>{item.value}</p>
                  <p className="text-xs mt-1 text-muted-foreground">{item.value >= item.threshold ? "Needs attention" : "Healthy"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SponsorBridgeLayout>
  );
}
