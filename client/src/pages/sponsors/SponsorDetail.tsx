import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";

const DEMO_TENANT_ID = 1;

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const sponsorId = parseInt(id ?? "0");
  const { data: sponsor, isLoading } = trpc.sponsors.getById.useQuery({ id: sponsorId, tenantId: DEMO_TENANT_ID });
  const { data: sponsorships } = trpc.sponsorships.list.useQuery({ tenantId: DEMO_TENANT_ID, sponsorId });

  if (isLoading) return <SponsorBridgeLayout><div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div></SponsorBridgeLayout>;
  if (!sponsor) return <SponsorBridgeLayout><div className="p-6 text-center py-16"><p className="text-muted-foreground">Sponsor not found.</p><Link href="/sponsors"><Button variant="outline" className="mt-4">Back</Button></Link></div></SponsorBridgeLayout>;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/sponsors"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          <h1 className="text-2xl font-bold flex-1">{sponsor.firstName} {sponsor.lastName}</h1>
          <Badge variant="outline" className={sponsor.isActive ? "text-sage border-sage/30" : "text-muted-foreground"}>{sponsor.isActive ? "Active" : "Inactive"}</Badge>
        </div>
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
              <div className="flex justify-between"><span className="text-muted-foreground">Preferred Gender</span><span className="capitalize">{sponsor.preferredGender ?? "No preference"}</span></div>
              {(sponsor.preferredChildAgeMin || sponsor.preferredChildAgeMax) && (
                <div className="flex justify-between"><span className="text-muted-foreground">Age Range</span><span>{sponsor.preferredChildAgeMin ?? "Any"}–{sponsor.preferredChildAgeMax ?? "Any"}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Communication</span><span className="capitalize">{sponsor.communicationStyle ?? "Occasional"}</span></div>
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
