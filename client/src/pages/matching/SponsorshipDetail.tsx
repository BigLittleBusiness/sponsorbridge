import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function SponsorshipDetail() {
  const { id } = useParams<{ id: string }>();
  const spId = parseInt(id ?? "0");
  const utils = trpc.useUtils();
  const { data: sp, isLoading } = trpc.sponsorships.getById.useQuery({ id: spId, tenantId: DEMO_TENANT_ID });
  const complete = trpc.sponsorships.complete.useMutation({ onSuccess: () => { utils.sponsorships.getById.invalidate(); toast.success("Sponsorship marked as completed."); } });
  const pause = trpc.sponsorships.pause.useMutation({ onSuccess: () => { utils.sponsorships.getById.invalidate(); toast.success("Sponsorship paused."); } });

  if (isLoading) return <SponsorBridgeLayout><div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div></SponsorBridgeLayout>;
  if (!sp) return <SponsorBridgeLayout><div className="p-6 text-center py-16"><p className="text-muted-foreground">Sponsorship not found.</p><Link href="/matching"><Button variant="outline" className="mt-4">Back</Button></Link></div></SponsorBridgeLayout>;

  const onboardingSteps = [
    { day: 1, label: "Welcome email", sent: !!sp.onboardingDay1SentAt, date: sp.onboardingDay1SentAt },
    { day: 3, label: "Child story", sent: !!sp.onboardingDay3SentAt, date: sp.onboardingDay3SentAt },
    { day: 7, label: "How it works guide", sent: !!sp.onboardingDay7SentAt, date: sp.onboardingDay7SentAt },
    { day: 14, label: "Impact update", sent: !!sp.onboardingDay14SentAt, date: sp.onboardingDay14SentAt },
    { day: 30, label: "First vlog", sent: !!sp.onboardingDay30SentAt, date: sp.onboardingDay30SentAt },
    { day: 90, label: "Milestone + NPS survey", sent: !!sp.onboardingDay90SentAt, date: sp.onboardingDay90SentAt },
  ];

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/matching"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          <h1 className="text-2xl font-bold flex-1">Sponsorship #{sp.id}</h1>
          <Badge variant="outline" className="capitalize">{sp.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sponsor</span><Link href={`/sponsors/${sp.sponsorId}`}><span className="text-primary hover:underline">Sponsor #{sp.sponsorId}</span></Link></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Child</span><Link href={`/children/${sp.childId}`}><span className="text-primary hover:underline">Child #{sp.childId}</span></Link></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Matched By</span><span className="capitalize">{sp.matchedBy?.replace(/_/g, " ") ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Amount</span><span>${((sp.monthlyAmount ?? 0) / 100).toFixed(2)}</span></div>
              {sp.startDate && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{new Date(sp.startDate).toLocaleDateString()}</span></div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sp.status === "active" && (
                <>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => pause.mutate({ id: spId, tenantId: DEMO_TENANT_ID })} disabled={pause.isPending}>Pause Sponsorship</Button>
                  <Button variant="outline" size="sm" className="w-full text-sage border-sage/30" onClick={() => complete.mutate({ id: spId, tenantId: DEMO_TENANT_ID })} disabled={complete.isPending}>Mark as Graduated</Button>
                </>
              )}
              <Link href={`/messages?sponsorshipId=${sp.id}`}><Button variant="outline" size="sm" className="w-full">View Messages</Button></Link>
              <Link href={`/vlogs?sponsorshipId=${sp.id}`}><Button variant="outline" size="sm" className="w-full">View Vlogs</Button></Link>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-golden-nectar" />90-Day Onboarding Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onboardingSteps.map((step) => (
                  <div key={step.day} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center shrink-0">{step.day}</div>
                    <span className="text-sm flex-1">{step.label}</span>
                    {step.sent ? (
                      <div className="flex items-center gap-1 text-xs text-sage"><CheckCircle2 className="w-3 h-3" />{step.date ? new Date(step.date).toLocaleDateString() : "Sent"}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
