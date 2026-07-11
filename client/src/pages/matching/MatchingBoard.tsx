import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;
const STATUS_COLORS: Record<string, string> = {
  pending_approval: "text-amber-700 border-amber-300 bg-amber-50",
  active: "text-sage border-sage/30 bg-green-50",
  paused: "text-gray-600 border-gray-300 bg-gray-50",
  cancelled: "text-destructive border-destructive/30 bg-red-50",
  completed: "text-purple-700 border-purple-300 bg-purple-50",
};

export default function MatchingBoard() {
  const [status, setStatus] = useState("all");
  const utils = trpc.useUtils();
  const { data: sponsorships, isLoading } = trpc.sponsorships.list.useQuery({ tenantId: DEMO_TENANT_ID, status: status !== "all" ? status : undefined });
  const approve = trpc.sponsorships.approve.useMutation({ onSuccess: () => { utils.sponsorships.list.invalidate(); toast.success("Match approved!"); } });
  const reject = trpc.sponsorships.reject.useMutation({ onSuccess: () => { utils.sponsorships.list.invalidate(); toast.success("Match rejected."); } });

  const pending = sponsorships?.filter((s) => s.status === "pending_approval").length ?? 0;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-golden-nectar" />Matching Board</h1>
            <p className="text-muted-foreground text-sm mt-1">{pending > 0 ? `${pending} match${pending !== 1 ? "es" : ""} awaiting approval` : "All matches reviewed"}</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : sponsorships && sponsorships.length > 0 ? (
          <div className="space-y-3">
            {sponsorships.map((sp) => (
              <Card key={sp.id} className={`${sp.status === "pending_approval" ? "border-amber-200 bg-amber-50/30" : ""}`}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Sponsorship #{sp.id}</span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[sp.status] ?? ""}`}>{sp.status.replace(/_/g, " ")}</Badge>
                      {sp.matchedBy && <span className="text-xs text-muted-foreground">via {sp.matchedBy.replace(/_/g, " ")}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sponsor #{sp.sponsorId} → Child #{sp.childId}
                      {sp.startDate && <span> · Started {new Date(sp.startDate).toLocaleDateString()}</span>}
                      {sp.monthlyAmount && <span> · ${(sp.monthlyAmount / 100).toFixed(2)}/mo</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/sponsorships/${sp.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    {sp.status === "pending_approval" && (
                      <>
                        <Button size="sm" className="bg-sage hover:bg-sage/90 text-white gap-1" onClick={() => approve.mutate({ id: sp.id, tenantId: DEMO_TENANT_ID })} disabled={approve.isPending}>
                          <CheckCircle2 className="w-3 h-3" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => reject.mutate({ id: sp.id, tenantId: DEMO_TENANT_ID })} disabled={reject.isPending}>
                          <XCircle className="w-3 h-3" />Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No sponsorships found.</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
