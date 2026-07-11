import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Clock, Flag, MessageSquare, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function MessageQueue() {
  const [status, setStatus] = useState("pending_approval");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [safeguarding, setSafeguarding] = useState<Record<number, boolean>>({});
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.messages.list.useQuery({ tenantId: DEMO_TENANT_ID, status: status !== "all" ? status : undefined });
  const moderate = trpc.messages.moderate.useMutation({
    onSuccess: () => { utils.messages.list.invalidate(); toast.success("Message moderated."); },
    onError: (e) => toast.error(e.message),
  });
  const pending = messages?.filter((m) => m.status === "pending_approval").length ?? 0;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-trust-blue" />Message Moderation</h1>
            <p className="text-muted-foreground text-sm mt-1">{pending > 0 ? `${pending} message${pending !== 1 ? "s" : ""} awaiting approval` : "Queue is clear"}</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="quarantined">Quarantined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((m) => (
              <Card key={m.id} className={m.isSafeguardingConcern ? "border-destructive/50 bg-red-50/30" : m.status === "pending_approval" ? "border-amber-200" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <ArrowLeftRight className="w-3 h-3" />
                      <span className="capitalize">{m.direction.replace(/_/g, " ")}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${m.status === "pending_approval" ? "text-amber-700 border-amber-300" : m.status === "approved" ? "text-sage border-sage/30" : "text-destructive border-destructive/30"}`}>{m.status.replace(/_/g, " ")}</Badge>
                    {m.isSafeguardingConcern && <Badge className="text-xs bg-destructive text-white"><AlertTriangle className="w-3 h-3 mr-1" />Safeguarding</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <p className="text-sm">{m.originalText}</p>
                    {m.translatedText && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Translation ({m.translatedLanguage})</p>
                        <p className="text-sm text-muted-foreground italic">{m.translatedText}</p>
                      </div>
                    )}
                  </div>
                  {m.status === "pending_approval" && (
                    <div className="space-y-2">
                      <Textarea placeholder="Moderation notes…" value={notes[m.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [m.id]: e.target.value }))} rows={2} className="text-xs" />
                      <div className="flex items-center gap-2">
                        <Switch checked={safeguarding[m.id] ?? false} onCheckedChange={(val) => setSafeguarding((s) => ({ ...s, [m.id]: val }))} />
                        <Label className="text-xs text-destructive font-medium">Flag as safeguarding concern</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-sage hover:bg-sage/90 text-white gap-1" onClick={() => moderate.mutate({ id: m.id, tenantId: DEMO_TENANT_ID, status: "approved", notes: notes[m.id], isSafeguardingConcern: safeguarding[m.id] })} disabled={moderate.isPending}>
                          <CheckCircle2 className="w-3 h-3" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => moderate.mutate({ id: m.id, tenantId: DEMO_TENANT_ID, status: "quarantined", notes: notes[m.id], isSafeguardingConcern: safeguarding[m.id] })} disabled={moderate.isPending}>
                          <Flag className="w-3 h-3" />Quarantine
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => moderate.mutate({ id: m.id, tenantId: DEMO_TENANT_ID, status: "rejected", notes: notes[m.id], isSafeguardingConcern: safeguarding[m.id] })} disabled={moderate.isPending}>
                          <XCircle className="w-3 h-3" />Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{status === "pending_approval" ? "Queue is clear — no messages pending." : "No messages found."}</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
