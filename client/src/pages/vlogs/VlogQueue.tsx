import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Clock, Flag, Video, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function VlogQueue() {
  const [status, setStatus] = useState("pending_review");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [safeguarding, setSafeguarding] = useState<Record<number, boolean>>({});
  const utils = trpc.useUtils();
  const { data: vlogs, isLoading } = trpc.vlogs.list.useQuery({ tenantId: DEMO_TENANT_ID, status: status !== "all" ? status : undefined });
  const moderate = trpc.vlogs.moderate.useMutation({
    onSuccess: () => { utils.vlogs.list.invalidate(); toast.success("Vlog moderated."); },
    onError: (e) => toast.error(e.message),
  });

  const pending = vlogs?.filter((v) => v.status === "pending_review").length ?? 0;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6 text-purple-600" />Vlog Moderation Queue</h1>
            <p className="text-muted-foreground text-sm mt-1">{pending > 0 ? `${pending} vlog${pending !== 1 ? "s" : ""} awaiting review` : "Queue is clear"}</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : vlogs && vlogs.length > 0 ? (
          <div className="space-y-4">
            {vlogs.map((v) => (
              <Card key={v.id} className={v.isSafeguardingConcern ? "border-destructive/50" : v.status === "pending_review" ? "border-amber-200" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center shrink-0">
                      <Video className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{v.title ?? `Vlog #${v.id}`}</span>
                        <Badge variant="outline" className={`text-xs ${v.status === "pending_review" ? "text-amber-700 border-amber-300" : v.status === "approved" ? "text-sage border-sage/30" : "text-destructive border-destructive/30"}`}>{v.status.replace(/_/g, " ")}</Badge>
                        {v.isSafeguardingConcern && <Badge className="text-xs bg-destructive text-white"><AlertTriangle className="w-3 h-3 mr-1" />Safeguarding</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded {new Date(v.createdAt).toLocaleDateString()} · {v.direction?.replace(/_/g, " ")}
                        {v.durationSeconds && ` · ${Math.floor(v.durationSeconds / 60)}m ${v.durationSeconds % 60}s`}
                      </div>
                      {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}

                      {v.status === "pending_review" && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Moderation notes (optional)…"
                            value={notes[v.id] ?? ""}
                            onChange={(e) => setNotes((n) => ({ ...n, [v.id]: e.target.value }))}
                            rows={2}
                            className="text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <Switch checked={safeguarding[v.id] ?? false} onCheckedChange={(val) => setSafeguarding((s) => ({ ...s, [v.id]: val }))} />
                            <Label className="text-xs text-destructive font-medium">Flag as safeguarding concern</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-sage hover:bg-sage/90 text-white gap-1" onClick={() => moderate.mutate({ id: v.id, tenantId: DEMO_TENANT_ID, status: "approved", notes: notes[v.id], isSafeguardingConcern: safeguarding[v.id] })} disabled={moderate.isPending}>
                              <CheckCircle2 className="w-3 h-3" />Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => moderate.mutate({ id: v.id, tenantId: DEMO_TENANT_ID, status: "flagged", notes: notes[v.id], isSafeguardingConcern: safeguarding[v.id] })} disabled={moderate.isPending}>
                              <Flag className="w-3 h-3" />Flag
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => moderate.mutate({ id: v.id, tenantId: DEMO_TENANT_ID, status: "rejected", notes: notes[v.id], isSafeguardingConcern: safeguarding[v.id] })} disabled={moderate.isPending}>
                              <XCircle className="w-3 h-3" />Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{status === "pending_review" ? "Queue is clear — no vlogs pending review." : "No vlogs found."}</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
