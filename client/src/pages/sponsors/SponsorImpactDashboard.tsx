import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Heart, DollarSign, Users, Video, MessageCircle, TrendingUp, Globe,
  ArrowLeft, Calendar, BookOpen, Stethoscope, Baby, Award,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";

const IMPACT_BREAKDOWN = [
  { category: "Education", value: 38, color: "#D14A2E" },
  { category: "Healthcare", value: 22, color: "#F4A261" },
  { category: "Nutrition", value: 18, color: "#2D6A4F" },
  { category: "Family support", value: 14, color: "#1B4F72" },
  { category: "Infrastructure", value: 8, color: "#FAD7A0" },
];

export default function SponsorImpactDashboard() {
  const { id } = useParams<{ id: string }>();
  const sponsorId = parseInt(id ?? "0", 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const tenantId = (user as any)?.tenantId ?? 1;

  const { data, isLoading } = trpc.analytics.sponsorImpact.useQuery(
    { sponsorId, tenantId },
    { enabled: sponsorId > 0 }
  );

  const { data: sponsor, isLoading: sponsorLoading } = trpc.sponsors.getById.useQuery(
    { id: sponsorId, tenantId },
    { enabled: sponsorId > 0 }
  );

  const loading = isLoading || sponsorLoading;

  if (loading) {
    return (
      <SponsorBridgeLayout>
        <div className="space-y-6 p-2">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </SponsorBridgeLayout>
    );
  }

  const totalDollars = data ? Math.round((data.totalLifetimeCents ?? 0) / 100) : 0;
  const activeSponsorships = data?.sponsorships?.filter(s => s.status === "active").length ?? 0;
  const chartData = data?.monthlyData ?? [];

  // Combine vlogs and messages into a unified updates feed
  const updates = [
    ...(data?.vlogFeed ?? []).map(v => ({
      id: `vlog-${v.id}`,
      type: "vlog" as const,
      title: v.title ?? "Video Update",
      description: v.description ?? "",
      date: v.createdAt,
      direction: v.direction,
    })),
    ...(data?.messageFeed ?? []).map(m => ({
      id: `msg-${m.id}`,
      type: "message" as const,
      title: m.direction === "child_to_sponsor" ? "Message from your sponsored child" : "Your message",
      description: m.translatedText ?? m.originalText,
      date: m.createdAt,
      direction: m.direction,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <SponsorBridgeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate(`/sponsors/${id}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to profile
            </Button>
          </div>
        </div>

        {/* Sponsor identity card */}
        <Card className="border-border shadow-sm bg-gradient-to-r from-[#1a2e1a] to-[#2D4A2D] text-white overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {sponsor?.firstName?.[0] ?? "S"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">
                    {sponsor ? `${sponsor.firstName} ${sponsor.lastName}` : `Sponsor #${id}`}
                  </h1>
                  {activeSponsorships > 0 && (
                    <Badge className="bg-yellow-400/30 text-yellow-300 border-yellow-400/40 text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Active Sponsor
                    </Badge>
                  )}
                </div>
                <p className="text-white/70 text-sm">
                  {activeSponsorships} active {activeSponsorships === 1 ? "sponsorship" : "sponsorships"} · {data?.totalPayments ?? 0} payments made
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-300">${totalDollars.toLocaleString()}</div>
                <div className="text-white/60 text-xs">Total contributed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">${totalDollars.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Lifetime giving</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <Heart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{activeSponsorships}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Active sponsorships</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="pt-5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                <Video className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data?.vlogFeed?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Vlogs received</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                <MessageCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data?.messageFeed?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Messages exchanged</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent h-auto p-0 gap-0">
            {["overview", "donations", "community", "updates"].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D14A2E] data-[state=active]:text-[#D14A2E] pb-3 px-4 capitalize text-sm"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D14A2E]" />
                    Monthly donation history
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.some(d => d.amount > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D14A2E" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#D14A2E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={(v: number) => [`$${v}`, "Donated"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Area type="monotone" dataKey="amount" stroke="#D14A2E" strokeWidth={2} fill="url(#donGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No payment history yet. Payments will appear here once processed.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2D6A4F]" />
                    How contributions are used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={IMPACT_BREAKDOWN} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {IMPACT_BREAKDOWN.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
                      <Legend formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Community stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Your contribution to the broader programme</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Your sponsorship is part of a community making a collective difference.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Children sponsored", value: data?.communityChildrenSponsored ?? 0, icon: Baby },
                    { label: "Fellow sponsors", value: data?.communityTotalSponsors ?? 0, icon: Users },
                    { label: "Vlogs approved", value: data?.vlogFeed?.length ?? 0, icon: Video },
                    { label: "Messages approved", value: data?.messageFeed?.length ?? 0, icon: MessageCircle },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-4 rounded-xl bg-muted/40 border border-border">
                      <stat.icon className="w-6 h-6 text-[#D14A2E] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donations tab */}
          <TabsContent value="donations" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Payment history</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.paymentHistory?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Amount</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.paymentHistory?.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 text-foreground">
                              {new Date(p.paidAt ?? p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 font-medium text-foreground">
                              ${Math.round((p.amount ?? 0) / 100).toFixed(2)} {(p.currency ?? "USD").toUpperCase()}
                            </td>
                            <td className="py-2">
                              <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
                                {p.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community tab */}
          <TabsContent value="community" className="mt-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Your Broader Community Impact</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You are part of a community of <strong>{data?.communityTotalSponsors ?? 0} sponsors</strong> who together
                      support <strong>{data?.communityChildrenSponsored ?? 0} children</strong> through this programme.
                      Your consistent giving contributes to education, healthcare, and long-term family stability — not just
                      for your sponsored child, but for the entire community they live in.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Updates tab */}
          <TabsContent value="updates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-violet-500" />
                  Recent Updates from Your Child
                </CardTitle>
              </CardHeader>
              <CardContent>
                {updates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No updates yet. Updates will appear here once your sponsored child sends vlogs or messages.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {updates.map(update => (
                      <div key={update.id} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          update.type === "vlog" ? "bg-violet-100 dark:bg-violet-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                        }`}>
                          {update.type === "vlog"
                            ? <Video className="h-4 w-4 text-violet-600" />
                            : <MessageCircle className="h-4 w-4 text-emerald-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{update.title}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(update.date).toLocaleDateString()}
                            </span>
                          </div>
                          {update.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{update.description}</p>
                          )}
                          <Badge variant="outline" className="text-xs capitalize mt-1">
                            {update.direction?.replace(/_/g, " ") ?? update.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SponsorBridgeLayout>
  );
}
