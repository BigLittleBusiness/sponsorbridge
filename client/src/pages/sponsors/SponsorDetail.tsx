import { useState } from "react";
import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Mail, MapPin, Phone, KeyRound, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const sponsorId = parseInt(id ?? "0");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");

  const { data: sponsor, isLoading } = trpc.sponsors.getById.useQuery({ id: sponsorId, tenantId: DEMO_TENANT_ID });
  const { data: sponsorships } = trpc.sponsorships.list.useQuery({ tenantId: DEMO_TENANT_ID, sponsorId });
  const { data: portalAccount, refetch: refetchPortalAccount } = trpc.sponsors.getPortalAccount.useQuery(
    { sponsorId },
    { enabled: !!sponsor }
  );

  const createPortalAccountMutation = trpc.sponsors.createPortalAccount.useMutation({
    onSuccess: () => {
      toast.success("Portal account created! The sponsor can now log in at /sponsor/login using their email and a magic code.");
      setDialogOpen(false);
      setPortalEmail("");
      refetchPortalAccount();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCreatePortalAccount() {
    if (!portalEmail.trim()) { toast.error("Email is required."); return; }
    createPortalAccountMutation.mutate({
      sponsorId,
      tenantId: DEMO_TENANT_ID,
      email: portalEmail.trim().toLowerCase(),
    });
  }

  // Pre-fill with sponsor's own email when dialog opens
  function openDialog() {
    setPortalEmail(sponsor?.email ?? "");
    setDialogOpen(true);
  }

  if (isLoading) return (
    <SponsorBridgeLayout>
      <div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>
    </SponsorBridgeLayout>
  );

  if (!sponsor) return (
    <SponsorBridgeLayout>
      <div className="p-6 text-center py-16">
        <p className="text-muted-foreground">Sponsor not found.</p>
        <Link href="/sponsors"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </SponsorBridgeLayout>
  );

  const hasPortalAccount = !!portalAccount;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href="/sponsors">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex-1">{sponsor.firstName} {sponsor.lastName}</h1>
          <Badge variant="outline" className={sponsor.isActive ? "text-sage border-sage/30" : "text-muted-foreground"}>
            {sponsor.isActive ? "Active" : "Inactive"}
          </Badge>

          {/* Create / Reset Portal Account button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant={hasPortalAccount ? "outline" : "default"}
                className="gap-1.5"
                onClick={openDialog}
              >
                {hasPortalAccount
                  ? <><RefreshCw className="w-3.5 h-3.5" />Reset Portal Access</>
                  : <><KeyRound className="w-3.5 h-3.5" />Create Portal Account</>}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {hasPortalAccount ? "Reset Portal Access" : "Create Sponsor Portal Account"}
                </DialogTitle>
                <DialogDescription>
                  {hasPortalAccount
                    ? "This will reactivate the sponsor's portal account and allow them to sign in with a new magic code. Their previous session will be invalidated."
                    : "Set up a self-service portal account for this sponsor. They will be able to log in at /sponsor/login using their email and a one-time magic code — no password required."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-email">Portal Login Email</Label>
                  <Input
                    id="portal-email"
                    type="email"
                    placeholder="sponsor@example.com"
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePortalAccount()}
                  />
                  <p className="text-xs text-muted-foreground">
                    The sponsor will receive a magic code at this address each time they sign in.
                  </p>
                </div>
                {hasPortalAccount && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Current portal email: <strong>{portalAccount.email}</strong></span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreatePortalAccount}
                  disabled={createPortalAccountMutation.isPending || !portalEmail.trim()}
                  className="gap-1.5"
                >
                  {createPortalAccountMutation.isPending
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                    : hasPortalAccount ? "Reset Access" : "Create Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portal account status banner */}
        {hasPortalAccount && (
          <div className="mb-4 flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-700">
              Portal account active — <strong>{portalAccount.email}</strong>
              {portalAccount.isVerified ? " · Verified" : " · Not yet verified"}
              {portalAccount.lastLoginAt && ` · Last login ${new Date(portalAccount.lastLoginAt).toLocaleDateString("en-AU")}`}
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{sponsor.email}</div>
              {sponsor.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{sponsor.phone}</div>}
              {sponsor.country && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" />{sponsor.country}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Gender</span>
                <span className="capitalize">{sponsor.preferredGender ?? "No preference"}</span>
              </div>
              {(sponsor.preferredChildAgeMin || sponsor.preferredChildAgeMax) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age Range</span>
                  <span>{sponsor.preferredChildAgeMin ?? "Any"}–{sponsor.preferredChildAgeMax ?? "Any"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Communication</span>
                <span className="capitalize">{sponsor.communicationStyle ?? "Occasional"}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sponsorships ({sponsorships?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {sponsorships && sponsorships.length > 0 ? (
                <div className="space-y-2">
                  {sponsorships.map((sp) => (
                    <Link key={sp.id} href={`/sponsorships/${sp.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <span className="text-sm">Sponsorship #{sp.id}</span>
                        <Badge variant="outline" className="text-xs capitalize">{sp.status.replace("_", " ")}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No sponsorships yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
