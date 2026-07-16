import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, BookOpen, Monitor, Calendar, Zap, Heart, Package, ExternalLink } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  infrastructure: <Building2 className="h-4 w-4" />,
  education: <BookOpen className="h-4 w-4" />,
  equipment: <Monitor className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  emergency: <Zap className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-700",
  funded: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatCurrency(cents: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

export default function ProjectsList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const tenantId = (user as any)?.tenantId ?? 1;

  const { data: projectsData, isLoading } = trpc.projects.list.useQuery({
    tenantId,
    status: status !== "all" ? status : undefined,
    category: category !== "all" ? category : undefined,
    search: search || undefined,
  }, { enabled: !!user });

  const projects = projectsData ?? [];
  const totalGoal = projects.reduce((s, p) => s + p.goalAmountCents, 0);
  const totalRaised = projects.reduce((s, p) => s + p.raisedAmountCents, 0);
  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Fundraising campaigns for items, infrastructure &amp; events</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
            <p className="text-3xl font-bold mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Goal</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalGoal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Raised</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">{formatCurrency(totalRaised)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="funded">Funded</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No projects found. Create your first campaign.</p>
            <Link href="/projects/new">
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const pct = project.goalAmountCents > 0
              ? Math.min(100, Math.round((project.raisedAmountCents / project.goalAmountCents) * 100))
              : 0;
            return (
              <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {project.coverImageUrl && (
                  <div className="h-36 overflow-hidden">
                    <img src={project.coverImageUrl} alt={project.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug line-clamp-2">{project.title}</CardTitle>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    {CATEGORY_ICONS[project.category]}
                    <span className="capitalize">{project.category}</span>
                    {project.isPublic && (
                      <Badge variant="outline" className="text-xs ml-1">Public</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCurrency(project.raisedAmountCents, project.currency)} raised</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Goal: {formatCurrency(project.goalAmountCents, project.currency)}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Manage</Button>
                    </Link>
                    {project.isPublic && (
                      <Link href={`/fund/${project.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
