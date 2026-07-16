import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface ProjectFormProps {
  projectId?: number;
}

export default function ProjectForm({ projectId }: ProjectFormProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const tenantId = (user as any)?.tenantId ?? 1;
  const isEdit = !!projectId;

  const { data: existing } = trpc.projects.getById.useQuery(
    { id: projectId!, tenantId },
    { enabled: isEdit }
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    category: "other" as const,
    goalAmount: "",
    currency: "AUD",
    coverImageUrl: "",
    isPublic: false,
    allowRecurring: true,
    showDonorWall: true,
    status: "draft" as const,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        shortDescription: existing.shortDescription ?? "",
        category: existing.category as any,
        goalAmount: String(existing.goalAmountCents / 100),
        currency: existing.currency,
        coverImageUrl: existing.coverImageUrl ?? "",
        isPublic: existing.isPublic ?? false,
        allowRecurring: existing.allowRecurring ?? true,
        showDonorWall: existing.showDonorWall ?? true,
        status: existing.status as any,
      });
    }
  }, [existing]);

  const utils = trpc.useUtils();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      utils.projects.list.invalidate();
      navigate("/projects");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!");
      utils.projects.list.invalidate();
      utils.projects.getById.invalidate({ id: projectId!, tenantId });
      navigate(`/projects/${projectId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const goalAmountCents = Math.round(parseFloat(form.goalAmount) * 100);
    if (isNaN(goalAmountCents) || goalAmountCents < 50) {
      toast.error("Goal amount must be at least $0.50");
      return;
    }

    const payload = {
      tenantId,
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription || undefined,
      category: form.category,
      goalAmountCents,
      currency: form.currency,
      coverImageUrl: form.coverImageUrl || undefined,
      isPublic: form.isPublic,
      allowRecurring: form.allowRecurring,
      showDonorWall: form.showDonorWall,
    };

    if (isEdit) {
      updateMutation.mutate({ id: projectId!, ...payload, status: form.status as any });
    } else {
      createMutation.mutate(payload);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/projects/${projectId}` : "/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Project" : "New Project"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update campaign details" : "Create a new fundraising campaign"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>The core information sponsors will see on the fundraising page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Build a Clean Water Well for Mwangi Village"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                placeholder="One sentence summary shown in cards and emails (max 500 chars)"
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell the story of this project — why it matters, who it helps, and how funds will be used."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="NZD">NZD — New Zealand Dollar</SelectItem>
                    <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalAmount">Funding Goal ({form.currency}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="goalAmount"
                  type="number"
                  min="0.50"
                  step="0.01"
                  placeholder="5000.00"
                  value={form.goalAmount}
                  onChange={(e) => set("goalAmount", e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                type="url"
                placeholder="https://..."
                value={form.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
              />
              {form.coverImageUrl && (
                <img src={form.coverImageUrl} alt="Cover preview" className="h-32 w-full object-cover rounded-lg mt-2" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Public Fundraising Page</p>
                <p className="text-xs text-muted-foreground">Allow anyone with the link to view and donate to this campaign</p>
              </div>
              <Switch checked={form.isPublic} onCheckedChange={(v) => set("isPublic", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Allow Monthly Recurring Donations</p>
                <p className="text-xs text-muted-foreground">Supporters can choose to give monthly via Stripe Subscriptions</p>
              </div>
              <Switch checked={form.allowRecurring} onCheckedChange={(v) => set("allowRecurring", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Show Donor Wall</p>
                <p className="text-xs text-muted-foreground">Display a public list of supporters on the fundraising page</p>
              </div>
              <Switch checked={form.showDonorWall} onCheckedChange={(v) => set("showDonorWall", v)} />
            </div>

            {isEdit && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Campaign Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft — not visible to public</SelectItem>
                      <SelectItem value="active">Active — accepting contributions</SelectItem>
                      <SelectItem value="funded">Funded — goal reached</SelectItem>
                      <SelectItem value="completed">Completed — project delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/projects/${projectId}` : "/projects")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
