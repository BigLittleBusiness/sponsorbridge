import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const incId = parseInt(id ?? "0");
  const utils = trpc.useUtils();
  const { data: inc, isLoading } = trpc.safeguarding.listIncidents.useQuery({ tenantId: DEMO_TENANT_ID });
  const incident = inc?.find((i) => i.id === incId);
  const [outcome, setOutcome] = useState(incident?.outcome ?? "");
  const [referred, setReferred] = useState(incident?.referredToAuthorities ?? false);
  const [referralDetails, setReferralDetails] = useState(incident?.referralDetails ?? "");
  const update = trpc.safeguarding.updateIncident.useMutation({
    onSuccess: () => { utils.safeguarding.listIncidents.invalidate(); toast.success("Incident updated."); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <SponsorBridgeLayout><div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div></SponsorBridgeLayout>;
  if (!incident) return <SponsorBridgeLayout><div className="p-6 text-center py-16"><p className="text-muted-foreground">Incident not found.</p><Link href="/safeguarding/incidents"><Button variant="outline" className="mt-4">Back</Button></Link></div></SponsorBridgeLayout>;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/safeguarding/incidents"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          <h1 className="text-2xl font-bold flex-1 flex items-center gap-2">
            <AlertTriangle className={`w-6 h-6 ${incident.isEmergency ? "text-destructive" : "text-amber-500"}`} />
            {incident.title}
          </h1>
          {incident.isEmergency && <Badge className="bg-destructive text-white">Emergency</Badge>}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Incident Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{incident.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs block">Status</span><span className="capitalize">{incident.status.replace(/_/g, " ")}</span></div>
                <div><span className="text-muted-foreground text-xs block">Priority</span><span className="capitalize">{incident.priority}</span></div>
                <div><span className="text-muted-foreground text-xs block">Reported</span>{new Date(incident.createdAt).toLocaleString()}</div>
                {incident.childId && <div><span className="text-muted-foreground text-xs block">Related Child</span><Link href={`/children/${incident.childId}`}><span className="text-primary hover:underline">Child #{incident.childId}</span></Link></div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select defaultValue={incident.status} onValueChange={(v) => update.mutate({ id: incId, tenantId: DEMO_TENANT_ID, status: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="triaged">Triaged</SelectItem>
                    <SelectItem value="under_investigation">Under Investigation</SelectItem>
                    <SelectItem value="referred">Referred</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={referred} onCheckedChange={setReferred} />
                <Label className="text-sm">Referred to Authorities</Label>
              </div>
              {referred && <Textarea value={referralDetails} onChange={(e) => setReferralDetails(e.target.value)} placeholder="Referral details…" rows={2} />}
              <div>
                <Label className="text-xs">Outcome / Resolution Notes</Label>
                <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Document the outcome…" rows={3} className="mt-1" />
              </div>
              <Button className="bg-trust-blue hover:bg-trust-blue/90 text-white"
                onClick={() => update.mutate({ id: incId, tenantId: DEMO_TENANT_ID, outcome, referredToAuthorities: referred, referralDetails })}
                disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save Update"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
