import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Heart, Users, Calendar, RefreshCw, CheckCircle2, Loader2,
  Building2, BookOpen, Monitor, Zap, Package, ArrowLeft, Share2
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

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

function formatCurrency(cents: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(d);
}

interface FundraisingPageProps {
  slug: string;
  tenantId?: number;
}

export default function FundraisingPage({ slug, tenantId = 1 }: FundraisingPageProps) {
  const [, navigate] = useLocation();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"donate" | "details" | "success">("donate");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: project, isLoading: projectLoading } = trpc.projects.getBySlug.useQuery(
    { slug, tenantId },
    { retry: false }
  );

  const { data: donorWall } = trpc.projects.getDonorWall.useQuery(
    { projectId: project?.id ?? 0 },
    { enabled: !!project?.id && (project?.showDonorWall ?? false) }
  );

  const { data: updates } = trpc.projects.getUpdates.useQuery(
    { projectId: project?.id ?? 0, tenantId },
    { enabled: !!project?.id }
  );

  const checkoutMutation = trpc.projects.createCheckout.useMutation({
    onSuccess: (data) => {
      window.open(data.checkoutUrl, "_blank");
      setIsRedirecting(false);
      setStep("success");
    },
    onError: (err) => {
      toast.error(err.message);
      setIsRedirecting(false);
    },
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Campaign not found</p>
          <p className="text-muted-foreground">This campaign may have ended or the link may be incorrect.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const pct = project.goalAmountCents > 0
    ? Math.min(100, Math.round((project.raisedAmountCents / project.goalAmountCents) * 100))
    : 0;

  const effectiveAmount = selectedPreset ?? (customAmount ? parseFloat(customAmount) : null);
  const amountCents = effectiveAmount ? Math.round(effectiveAmount * 100) : null;

  function handleDonate() {
    if (!amountCents || amountCents < 50) {
      toast.error("Please enter an amount of at least $0.50");
      return;
    }
    setStep("details");
  }

  function handleCheckout() {
    if (!donorName.trim() || !donorEmail.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    if (!amountCents) return;
    setIsRedirecting(true);
    checkoutMutation.mutate({
      projectId: project!.id,
      tenantId,
      amountCents,
      currency: project!.currency,
      isRecurring,
      isAnonymous,
      message: message || undefined,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      successUrl: `${origin}/fund/${slug}/thank-you`,
      cancelUrl: `${origin}/fund/${slug}`,
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: project!.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            SponsorBridge
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {project.coverImageUrl && (
          <div className="h-64 rounded-2xl overflow-hidden shadow-md">
            <img src={project.coverImageUrl} alt={project.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: project info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & category */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {CATEGORY_ICONS[project.category]}
                <span className="capitalize">{project.category}</span>
              </div>
              <h1 className="text-3xl font-bold leading-tight">{project.title}</h1>
              {project.shortDescription && (
                <p className="text-lg text-muted-foreground mt-2">{project.shortDescription}</p>
              )}
            </div>

            {/* Progress */}
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(project.raisedAmountCents, project.currency)}</p>
                    <p className="text-sm text-muted-foreground">raised of {formatCurrency(project.goalAmountCents, project.currency)} goal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{pct}%</p>
                    <p className="text-sm text-muted-foreground">funded</p>
                  </div>
                </div>
                <Progress value={pct} className="h-3" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{(donorWall ?? []).length} supporters</span>
                  {project.deadlineAt && (
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Ends {formatDate(project.deadlineAt)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>

            {/* Updates */}
            {(updates ?? []).filter((u) => u.isPublished).length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Updates</h2>
                {(updates ?? []).filter((u) => u.isPublished).map((u) => (
                  <Card key={u.id}>
                    <CardContent className="pt-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{u.title}</p>
                        <span className="text-xs text-muted-foreground">{timeAgo(u.publishedAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.content}</p>
                      {u.mediaUrl && (
                        <a href={u.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                          View media
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Donor wall */}
            {project.showDonorWall && (donorWall ?? []).length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Supporters</h2>
                <div className="space-y-2">
                  {(donorWall ?? []).slice(0, 10).map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        {d.message && <p className="text-xs text-muted-foreground italic">"{d.message}"</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(d.amountCents, d.currency)}</p>
                        {d.isRecurring && <Badge variant="outline" className="text-xs">Monthly</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: donation widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {step === "success" ? (
                <Card className="text-center">
                  <CardContent className="pt-8 pb-6 space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <h3 className="text-xl font-bold">Thank you!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your contribution is being processed. You'll receive a confirmation email shortly.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => setStep("donate")}>
                      Make Another Donation
                    </Button>
                  </CardContent>
                </Card>
              ) : step === "details" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isRecurring ? "Monthly" : "One-off"} gift of {formatCurrency(amountCents!, project.currency)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="donorName">Full Name *</Label>
                      <Input
                        id="donorName"
                        placeholder="Jane Smith"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donorEmail">Email Address *</Label>
                      <Input
                        id="donorEmail"
                        type="email"
                        placeholder="jane@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Leave a message (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Share why you're supporting this campaign..."
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} id="anon" />
                      <Label htmlFor="anon" className="text-sm cursor-pointer">Donate anonymously</Label>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setStep("donate")}>Back</Button>
                      <Button
                        className="flex-1 gap-1.5"
                        disabled={isRedirecting || !donorName || !donorEmail}
                        onClick={handleCheckout}
                      >
                        {isRedirecting
                          ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting...</>
                          : <><Heart className="h-4 w-4" />Give Now</>}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll be redirected to Stripe's secure checkout. Your card details are never stored by SponsorBridge.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Support This Campaign</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recurring toggle */}
                    {project.allowRecurring && (
                      <div className="flex rounded-lg border overflow-hidden">
                        <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium transition-colors ${!isRecurring ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                          onClick={() => setIsRecurring(false)}
                        >
                          Give Once
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${isRecurring ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                          onClick={() => setIsRecurring(true)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Monthly
                        </button>
                      </div>
                    )}

                    {/* Preset amounts */}
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`py-2 rounded-lg border text-sm font-medium transition-colors ${selectedPreset === amt ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                          onClick={() => { setSelectedPreset(amt); setCustomAmount(""); }}
                        >
                          ${amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors col-span-3 ${selectedPreset === null && customAmount ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                        onClick={() => { setSelectedPreset(null); }}
                      >
                        Custom amount
                      </button>
                    </div>

                    {/* Custom amount input */}
                    {selectedPreset === null && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0.50"
                          step="0.01"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="pl-7"
                          autoFocus
                        />
                      </div>
                    )}

                    <Button
                      className="w-full gap-2"
                      size="lg"
                      disabled={!amountCents || amountCents < 50}
                      onClick={handleDonate}
                    >
                      <Heart className="h-4 w-4" />
                      {amountCents && amountCents >= 50
                        ? `Give ${formatCurrency(amountCents, project.currency)}${isRecurring ? "/mo" : ""}`
                        : "Select an amount"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Secure payments via Stripe. Receipts emailed automatically.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
