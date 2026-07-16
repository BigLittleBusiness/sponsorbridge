import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Heart, RefreshCw, ExternalLink, Building2, BookOpen,
  Monitor, Calendar, Zap, Package, DollarSign, TrendingUp
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  infrastructure: <Building2 className="h-4 w-4" />,
  education: <BookOpen className="h-4 w-4" />,
  equipment: <Monitor className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  emergency: <Zap className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

function formatCurrency(cents: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function SponsorProjectsPage() {
  const { sponsor } = useSponsorAuth();
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const { data: contributions, isLoading } = trpc.projects.myContributions.useQuery(undefined, {
    enabled: !!sponsor,
  });

  // Group contributions by project
  const projectMap = new Map<number, {
    projectId: number;
    projectTitle: string;
    projectSlug: string;
    projectCategory: string;
    projectStatus: string;
    totalCents: number;
    currency: string;
    isRecurring: boolean;
    contributions: typeof contributions;
  }>();

  (contributions ?? []).forEach((c) => {
    const key = c.projectId;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        projectId: c.projectId,
        projectTitle: c.projectTitle,
        projectSlug: c.projectSlug,
        projectCategory: c.projectCategory,
        projectStatus: c.projectStatus,
        totalCents: 0,
        currency: c.currency,
        isRecurring: false,
        contributions: [],
      });
    }
    const entry = projectMap.get(key)!;
    entry.totalCents += c.amountCents;
    if (c.isRecurring) entry.isRecurring = true;
    entry.contributions!.push(c);
  });

  const projectGroups = Array.from(projectMap.values());
  const totalDonated = (contributions ?? []).reduce((s, c) => s + c.amountCents, 0);
  const activeRecurring = projectGroups.filter((p) => p.isRecurring && p.projectStatus === "active").length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">Campaigns you've contributed to</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Total Given</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDonated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">Projects Supported</span>
            </div>
            <p className="text-xl font-bold">{projectGroups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs">Active Monthly</span>
            </div>
            <p className="text-xl font-bold">{activeRecurring}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : projectGroups.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You haven't contributed to any projects yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Ask your charity for a link to their active campaigns.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectGroups.map((pg) => (
            <Card key={pg.projectId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {CATEGORY_ICONS[pg.projectCategory]}
                      <span className="capitalize">{pg.projectCategory}</span>
                    </div>
                    <CardTitle className="text-base">{pg.projectTitle}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={pg.projectStatus === "active" ? "default" : "outline"}
                      className="text-xs capitalize"
                    >
                      {pg.projectStatus}
                    </Badge>
                    <Link href={`/fund/${pg.projectSlug}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your total contribution</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(pg.totalCents, pg.currency)}</span>
                </div>
                {pg.isRecurring && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <RefreshCw className="h-3 w-3" />
                    <span>Monthly recurring contribution active</span>
                  </div>
                )}

                {/* Expand/collapse contribution history */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setExpandedProject(expandedProject === pg.projectId ? null : pg.projectId)}
                >
                  {expandedProject === pg.projectId ? "Hide" : "Show"} contribution history ({pg.contributions!.length})
                </Button>

                {expandedProject === pg.projectId && (
                  <div className="space-y-2 pt-1">
                    <Separator />
                    {pg.contributions!.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={c.isRecurring ? "default" : "outline"} className="text-xs">
                            {c.isRecurring ? "Monthly" : "One-off"}
                          </Badge>
                          <span className="text-muted-foreground">{formatDate(c.paidAt)}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(c.amountCents, c.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
