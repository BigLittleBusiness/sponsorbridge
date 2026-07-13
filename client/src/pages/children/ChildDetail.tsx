import { useState } from "react";
import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  Heart,
  MapPin,
  School,
  User,
  PlusCircle,
  Send,
  Trash2,
  BookOpen,
  Stethoscope,
  Star,
  Camera,
  Mail,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "status-available",
  SPONSORED: "status-sponsored",
  GRADUATED: "status-graduated",
  WAITLISTED: "status-waitlisted",
};

const UPDATE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  general: { label: "General", icon: FileText, color: "bg-gray-100 text-gray-700" },
  education: { label: "Education", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  health: { label: "Health", icon: Stethoscope, color: "bg-green-100 text-green-700" },
  milestone: { label: "Milestone", icon: Star, color: "bg-yellow-100 text-yellow-700" },
  photo: { label: "Photo", icon: Camera, color: "bg-purple-100 text-purple-700" },
  letter: { label: "Letter", icon: Mail, color: "bg-pink-100 text-pink-700" },
  video: { label: "Video", icon: Video, color: "bg-red-100 text-red-700" },
};

const EMPTY_FORM: {
  title: string;
  content: string;
  updateType: UpdateType;
  mediaUrl: string;
  isPublished: boolean;
} = {
  title: "",
  content: "",
  updateType: "general",
  mediaUrl: "",
  isPublished: true,
};

type UpdateType = "general" | "education" | "health" | "milestone" | "photo" | "letter" | "video";

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const childId = parseInt(id ?? "0");
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: child, isLoading } = trpc.children.getById.useQuery({
    id: childId,
    tenantId: DEMO_TENANT_ID,
  });

  const { data: updates, isLoading: updatesLoading } = trpc.children.listUpdates.useQuery({
    childId,
    tenantId: DEMO_TENANT_ID,
  });

  const updateChild = trpc.children.update.useMutation({
    onSuccess: () => {
      utils.children.getById.invalidate();
      toast.success("Child updated.");
    },
  });

  const postUpdate = trpc.children.postUpdate.useMutation({
    onSuccess: () => {
      utils.children.listUpdates.invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Update published — sponsors can now see it.");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUpdate = trpc.children.deleteUpdate.useMutation({
    onSuccess: () => {
      utils.children.listUpdates.invalidate();
      toast.success("Update deleted.");
    },
    onError: (err) => toast.error(err.message),
  });

  const age = child?.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(child.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.content.trim()) { toast.error("Content is required."); return; }
    postUpdate.mutate({
      tenantId: DEMO_TENANT_ID,
      childId,
      title: form.title.trim(),
      content: form.content.trim(),
      updateType: form.updateType as UpdateType,
      mediaUrl: form.mediaUrl.trim() || undefined,
      isPublished: form.isPublished,
    });
  }

  if (isLoading)
    return (
      <SponsorBridgeLayout>
        <div className="p-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        </div>
      </SponsorBridgeLayout>
    );

  if (!child)
    return (
      <SponsorBridgeLayout>
        <div className="p-6 text-center py-16">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Child not found.</p>
          <Link href="/children">
            <Button variant="outline" className="mt-4">
              Back to Children
            </Button>
          </Link>
        </div>
      </SponsorBridgeLayout>
    );

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/children">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex-1">
            {child.firstName} {child.lastName}
          </h1>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[child.status] ?? ""}`}
          >
            {child.status}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column — profile card + status actions */}
          <div className="md:col-span-1">
            <Card>
              <div className="aspect-square bg-gradient-to-br from-terracotta/10 to-golden-nectar/10 flex items-center justify-center rounded-t-lg overflow-hidden">
                {child.photoUrl ? (
                  <img
                    src={child.photoUrl}
                    alt={child.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-20 h-20 text-terracotta/30" />
                )}
              </div>
              <CardContent className="pt-4 space-y-3">
                {age !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Age {age}</span>
                    {child.gender && (
                      <span className="capitalize text-muted-foreground">
                        · {child.gender}
                      </span>
                    )}
                  </div>
                )}
                {child.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {child.region ? `${child.region}, ` : ""}
                      {child.country}
                    </span>
                  </div>
                )}
                {child.schoolName && (
                  <div className="flex items-center gap-2 text-sm">
                    <School className="w-4 h-4 text-muted-foreground" />
                    <span>{child.schoolName}</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Parental Consent</span>
                    <Badge
                      variant="outline"
                      className={
                        child.parentalConsentGranted
                          ? "text-sage border-sage/30"
                          : "text-amber-700 border-amber-300"
                      }
                    >
                      {child.parentalConsentGranted ? "Granted" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Photo Consent</span>
                    <Badge
                      variant="outline"
                      className={
                        child.photoConsentGranted
                          ? "text-sage border-sage/30"
                          : "text-amber-700 border-amber-300"
                      }
                    >
                      {child.photoConsentGranted ? "Granted" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Video Consent</span>
                    <Badge
                      variant="outline"
                      className={
                        child.videoConsentGranted
                          ? "text-sage border-sage/30"
                          : "text-amber-700 border-amber-300"
                      }
                    >
                      {child.videoConsentGranted ? "Granted" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-2">
              {(["AVAILABLE", "SPONSORED", "GRADUATED", "WAITLISTED"] as const).map(
                (s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    disabled={child.status === s}
                    onClick={() =>
                      updateChild.mutate({
                        id: childId,
                        tenantId: DEMO_TENANT_ID,
                        status: s,
                      })
                    }
                  >
                    Set to {s}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Right column — bio, education/health, updates */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">About {child.firstName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {child.bio ?? "No bio added yet."}
                </p>
                {child.interests && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Interests
                    </p>
                    <p className="text-sm">{child.interests}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Education &amp; Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Education Level
                    </span>
                    {child.educationLevel ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Programme Type
                    </span>
                    {child.programType ?? "—"}
                  </div>
                </div>
                {child.healthStatus && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">
                      Health Notes
                    </span>
                    <p className="text-sm">{child.healthStatus}</p>
                  </div>
                )}
                {child.hasSpecialNeeds && (
                  <div className="safeguarding-alert rounded">
                    <p className="text-xs font-semibold text-trust-blue mb-1">
                      Special Needs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {child.specialNeedsDetails ?? "Details not provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Sponsor Updates ─────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Sponsor Updates</CardTitle>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-terracotta hover:bg-terracotta/90 text-white"
                    onClick={() => setShowForm((v) => !v)}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Update
                    {showForm ? (
                      <ChevronUp className="w-3 h-3 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Updates posted here are instantly visible to the child's sponsor in their portal.
                </p>
              </CardHeader>

              {/* ── Post Update form ── */}
              {showForm && (
                <div className="mx-4 mb-4 rounded-lg border border-terracotta/20 bg-terracotta/5 p-4">
                  <h3 className="text-sm font-semibold text-terracotta mb-3">
                    New Sponsor Update
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Title */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Passed end-of-year exams!"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        maxLength={255}
                        className="text-sm"
                      />
                    </div>

                    {/* Update type */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Category
                      </label>
                      <Select
                        value={form.updateType}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, updateType: v as UpdateType }))
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(UPDATE_TYPE_CONFIG).map(([value, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <SelectItem key={value} value={value}>
                                <span className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5" />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Content */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Share news, progress, or a personal note for the sponsor…"
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        rows={4}
                        className="text-sm resize-none"
                      />
                    </div>

                    {/* Optional media URL */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Media URL{" "}
                        <span className="text-muted-foreground/60 font-normal">(optional)</span>
                      </label>
                      <Input
                        placeholder="https://… (photo, video, or document link)"
                        value={form.mediaUrl}
                        onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                        type="url"
                        className="text-sm"
                      />
                    </div>

                    {/* Publish toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        id="isPublished"
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isPublished: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-terracotta focus:ring-terracotta"
                      />
                      <label
                        htmlFor="isPublished"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Publish immediately (visible to sponsor right away)
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1.5 bg-terracotta hover:bg-terracotta/90 text-white"
                        disabled={postUpdate.isPending}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {postUpdate.isPending ? "Publishing…" : "Publish Update"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm(EMPTY_FORM);
                          setShowForm(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Existing updates list ── */}
              <CardContent className="pt-0">
                {updatesLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : !updates?.length ? (
                  <div className="py-8 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No updates posted yet.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Click "Post Update" above to share news with the sponsor.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {updates.map((update) => {
                      const cfg =
                        UPDATE_TYPE_CONFIG[update.updateType ?? "general"] ??
                        UPDATE_TYPE_CONFIG.general;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={update.id}
                          className="flex gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug">
                                {update.title}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {update.publishedAt
                                    ? new Date(update.publishedAt).toLocaleDateString("en-AU", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Draft"}
                                </span>
                                {!update.isPublished && (
                                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                                    Draft
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                  onClick={() =>
                                    deleteUpdate.mutate({ id: update.id, tenantId: DEMO_TENANT_ID })
                                  }
                                  disabled={deleteUpdate.isPending}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {update.content}
                            </p>
                            {update.mediaUrl && (
                              <a
                                href={update.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-terracotta underline mt-1 inline-block"
                              >
                                View media →
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
