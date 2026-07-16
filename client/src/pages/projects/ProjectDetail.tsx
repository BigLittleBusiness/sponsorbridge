import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, Edit, ExternalLink, Users, DollarSign, TrendingUp,
  Plus, Trash2, Loader2, Send, Bell, FileText, Calendar
} from "lucide-react";

interface ProjectDetailProps {
  projectId: number;
}

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

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const tenantId = (user as any)?.tenantId ?? 1;

  const [updateForm, setUpdateForm] = useState({
    title: "",
    content: "",
    mediaUrl: "",
    isPublished: true,
    notifyContributors: true,
  });
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { id: projectId, tenantId },
    { enabled: !!user }
  );
  const { data: contributions } = trpc.projects.getContributions.useQuery(
    { projectId, tenantId },
    { enabled: !!user }
  );
  const { data: updates, refetch: refetchUpdates } = trpc.projects.getUpdates.useQuery(
    { projectId, tenantId },
    { enabled: !!user }
  );

  const utils = trpc.useUtils();

  const postUpdateMutation = trpc.projects.postUpdate.useMutation({
    onSuccess: () => {
      toast.success("Update posted successfully!");
      setUpdateForm({ title: "", content: "", mediaUrl: "", isPublished: true, notifyContributors: true });
      setShowUpdateForm(false);
      refetchUpdates();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUpdateMutation = trpc.projects.deleteUpdate.useMutation({
    onSuccess: () => { toast.success("Update deleted."); refetchUpdates(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="link" onClick={() => navigate("/projects")}>Back to Projects</Button>
      </div>
    );
  }

  const pct = project.goalAmountCents > 0
    ? Math.min(100, Math.round((project.raisedAmountCents / project.goalAmountCents) * 100))
    : 0;

  const succeededContribs = (contributions ?? []).filter((c) => c.status === "succeeded");
  const uniqueDonors = new Set(succeededContribs.map((c) => c.guestEmail ?? c.sponsorId)).size;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">{project.category} campaign</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {project.isPublic && (
            <Link href={`/fund/${project.slug}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Public Page
              </Button>
            </Link>
          )}
          <Link href={`/projects/${project.id}/edit`}>
            <Button size="sm" className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Cover image */}
      {project.coverImageUrl && (
        <div className="h-48 rounded-xl overflow-hidden">
          <img src={project.coverImageUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Raised</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(project.raisedAmountCents, project.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Goal</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(project.goalAmountCents, project.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Donors</span>
            </div>
            <p className="text-xl font-bold">{uniqueDonors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Updates</span>
            </div>
            <p className="text-xl font-bold">{(updates ?? []).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{pct}% funded</span>
            <span className="text-muted-foreground">{formatCurrency(project.raisedAmountCents, project.currency)} of {formatCurrency(project.goalAmountCents, project.currency)}</span>
          </div>
          <Progress value={pct} className="h-3" />
          {project.deadlineAt && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Deadline: {formatDate(project.deadlineAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About This Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        </CardContent>
      </Card>

      {/* Contributions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contributions ({succeededContribs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {succeededContribs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No contributions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Donor</th>
                    <th className="text-left py-2 pr-4 font-medium">Amount</th>
                    <th className="text-left py-2 pr-4 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {succeededContribs.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {c.isAnonymous ? (
                          <span className="text-muted-foreground italic">Anonymous</span>
                        ) : (
                          <div>
                            <p className="font-medium">{c.guestName ?? "Sponsor"}</p>
                            {c.guestEmail && <p className="text-xs text-muted-foreground">{c.guestEmail}</p>}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium">{formatCurrency(c.amountCents, c.currency)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={c.isRecurring ? "default" : "outline"} className="text-xs">
                          {c.isRecurring ? "Monthly" : "One-off"}
                        </Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">{formatDate(c.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Update section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Project Updates ({(updates ?? []).length})</CardTitle>
            <Button
              size="sm"
              variant={showUpdateForm ? "outline" : "default"}
              className="gap-1.5"
              onClick={() => setShowUpdateForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              Post Update
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Update form */}
          {showUpdateForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="space-y-2">
                <Label>Update Title *</Label>
                <Input
                  placeholder="e.g. Construction has begun!"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  placeholder="Share progress, photos, or news with your contributors..."
                  rows={4}
                  value={updateForm.content}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Media URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={updateForm.mediaUrl}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={updateForm.notifyContributors}
                    onCheckedChange={(v) => setUpdateForm((f) => ({ ...f, notifyContributors: v }))}
                  />
                  <div className="flex items-center gap-1.5 text-sm">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Email contributors (via SES)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUpdateForm(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={postUpdateMutation.isPending || !updateForm.title || !updateForm.content}
                    onClick={() => postUpdateMutation.mutate({
                      tenantId,
                      projectId,
                      title: updateForm.title,
                      content: updateForm.content,
                      mediaUrl: updateForm.mediaUrl || undefined,
                      isPublished: updateForm.isPublished,
                      notifyContributors: updateForm.notifyContributors,
                    })}
                  >
                    {postUpdateMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}
                    Publish
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Updates list */}
          {(updates ?? []).length === 0 && !showUpdateForm ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No updates posted yet.</p>
          ) : (
            <div className="space-y-3">
              {(updates ?? []).map((u) => (
                <div key={u.id} className="border rounded-lg p-4 space-y-1 group relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{u.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(u.publishedAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => {
                        if (confirm("Delete this update?")) {
                          deleteUpdateMutation.mutate({ id: u.id, tenantId });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{u.content}</p>
                  {u.mediaUrl && (
                    <a href={u.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                      View media
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
