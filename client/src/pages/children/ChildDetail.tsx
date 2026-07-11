import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Edit, Heart, MapPin, School, User } from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;
const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "status-available", SPONSORED: "status-sponsored",
  GRADUATED: "status-graduated", WAITLISTED: "status-waitlisted",
};

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const childId = parseInt(id ?? "0");
  const utils = trpc.useUtils();
  const { data: child, isLoading } = trpc.children.getById.useQuery({ id: childId, tenantId: DEMO_TENANT_ID });
  const updateChild = trpc.children.update.useMutation({
    onSuccess: () => { utils.children.getById.invalidate(); toast.success("Child updated."); },
  });

  const age = child?.dateOfBirth
    ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  if (isLoading) return (
    <SponsorBridgeLayout>
      <div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" /></div>
    </SponsorBridgeLayout>
  );

  if (!child) return (
    <SponsorBridgeLayout>
      <div className="p-6 text-center py-16">
        <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Child not found.</p>
        <Link href="/children"><Button variant="outline" className="mt-4">Back to Children</Button></Link>
      </div>
    </SponsorBridgeLayout>
  );

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/children"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          <h1 className="text-2xl font-bold flex-1">{child.firstName} {child.lastName}</h1>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[child.status] ?? ""}`}>{child.status}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <div className="aspect-square bg-gradient-to-br from-terracotta/10 to-golden-nectar/10 flex items-center justify-center rounded-t-lg overflow-hidden">
                {child.photoUrl ? (
                  <img src={child.photoUrl} alt={child.firstName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-20 h-20 text-terracotta/30" />
                )}
              </div>
              <CardContent className="pt-4 space-y-3">
                {age !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Age {age}</span>
                    {child.gender && <span className="capitalize text-muted-foreground">· {child.gender}</span>}
                  </div>
                )}
                {child.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{child.region ? `${child.region}, ` : ""}{child.country}</span>
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
                    <Badge variant="outline" className={child.parentalConsentGranted ? "text-sage border-sage/30" : "text-amber-700 border-amber-300"}>{child.parentalConsentGranted ? "Granted" : "Pending"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Photo Consent</span>
                    <Badge variant="outline" className={child.photoConsentGranted ? "text-sage border-sage/30" : "text-amber-700 border-amber-300"}>{child.photoConsentGranted ? "Granted" : "Pending"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Video Consent</span>
                    <Badge variant="outline" className={child.videoConsentGranted ? "text-sage border-sage/30" : "text-amber-700 border-amber-300"}>{child.videoConsentGranted ? "Granted" : "Pending"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-2">
              {(["AVAILABLE","SPONSORED","GRADUATED","WAITLISTED"] as const).map((s) => (
                <Button key={s} variant="outline" size="sm" className="w-full justify-start text-xs"
                  disabled={child.status === s}
                  onClick={() => updateChild.mutate({ id: childId, tenantId: DEMO_TENANT_ID, status: s })}>
                  Set to {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">About {child.firstName}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{child.bio ?? "No bio added yet."}</p>
                {child.interests && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Interests</p>
                    <p className="text-sm">{child.interests}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Education & Health</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs block">Education Level</span>{child.educationLevel ?? "—"}</div>
                  <div><span className="text-muted-foreground text-xs block">Programme Type</span>{child.programType ?? "—"}</div>
                </div>
                {child.healthStatus && (
                  <div><span className="text-muted-foreground text-xs block mb-1">Health Notes</span><p className="text-sm">{child.healthStatus}</p></div>
                )}
                {child.hasSpecialNeeds && (
                  <div className="safeguarding-alert rounded">
                    <p className="text-xs font-semibold text-trust-blue mb-1">Special Needs</p>
                    <p className="text-xs text-muted-foreground">{child.specialNeedsDetails ?? "Details not provided."}</p>
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
