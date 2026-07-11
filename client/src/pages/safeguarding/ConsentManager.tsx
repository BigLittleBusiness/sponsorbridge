import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function ConsentManager() {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.consent.list.useQuery({ tenantId: DEMO_TENANT_ID });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ childId: "", consentType: "parental" as any, granted: true });
  const record = trpc.consent.record.useMutation({
    onSuccess: () => { utils.consent.list.invalidate(); toast.success("Consent recorded."); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-trust-blue" />Consent Manager</h1>
            <p className="text-muted-foreground text-sm mt-1">Track parental, photo, video, and data consent records</p>
          </div>
          <Button className="bg-terracotta hover:bg-terracotta/90 text-white gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />Record Consent
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 border-terracotta/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">New Consent Record</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Child ID</Label><Input value={form.childId} onChange={(e) => setForm((f) => ({ ...f, childId: e.target.value }))} className="mt-1" placeholder="e.g. 1" /></div>
                <div><Label className="text-xs">Consent Type</Label>
                  <Select value={form.consentType} onValueChange={(v) => setForm((f) => ({ ...f, consentType: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parental">Parental</SelectItem>
                      <SelectItem value="photo_video">Photo / Video</SelectItem>
                      <SelectItem value="sponsor_data">Sponsor Data</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="gdpr">GDPR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.granted} onCheckedChange={(v) => setForm((f) => ({ ...f, granted: v }))} />
                <Label className="text-sm">Consent Granted</Label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white"
                  disabled={!form.childId || record.isPending}
                  onClick={() => record.mutate({ tenantId: DEMO_TENANT_ID, childId: parseInt(form.childId), consentType: form.consentType, granted: form.granted })}>
                  {record.isPending ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="py-3"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : records && records.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                    <Badge variant="outline" className={`text-xs ${r.granted ? "text-sage border-sage/30" : "text-destructive border-destructive/30"}`}>{r.granted ? "Granted" : "Denied"}</Badge>
                    <span className="capitalize flex-1">{r.consentType.replace(/_/g, " ")}</span>
                    {r.childId && <span className="text-muted-foreground text-xs">Child #{r.childId}</span>}
                    {r.sponsorId && <span className="text-muted-foreground text-xs">Sponsor #{r.sponsorId}</span>}
                    {r.expiresAt && <span className="text-xs text-amber-600">Expires {new Date(r.expiresAt).toLocaleDateString()}</span>}
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No consent records yet.</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
