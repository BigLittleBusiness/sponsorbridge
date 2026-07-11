import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;
const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-700 border-amber-300 bg-amber-50",
  under_review: "text-trust-blue border-trust-blue/30 bg-blue-50",
  verified: "text-sage border-sage/30 bg-green-50",
  expired: "text-gray-600 border-gray-300 bg-gray-50",
  failed: "text-destructive border-destructive/30 bg-red-50",
};

export default function BackgroundChecks() {
  const utils = trpc.useUtils();
  const { data: checks, isLoading } = trpc.safeguarding.listBackgroundChecks.useQuery({ tenantId: DEMO_TENANT_ID });
  const update = trpc.safeguarding.updateBackgroundCheck.useMutation({
    onSuccess: () => { utils.safeguarding.listBackgroundChecks.invalidate(); toast.success("Background check updated."); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-trust-blue" />Background Checks</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage staff background verification status</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : checks && checks.length > 0 ? (
          <div className="space-y-3">
            {checks.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">User #{c.userId}</span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted {new Date(c.createdAt).toLocaleDateString()}
                      {c.expiresAt && <span> · Expires {new Date(c.expiresAt).toLocaleDateString()}</span>}
                      {c.notes && <span> · {c.notes}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status === "pending" && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => update.mutate({ id: c.id, tenantId: DEMO_TENANT_ID, status: "under_review" })} disabled={update.isPending}>
                        Start Review
                      </Button>
                    )}
                    {c.status === "under_review" && (
                      <>
                        <Button size="sm" className="bg-sage hover:bg-sage/90 text-white gap-1" onClick={() => update.mutate({ id: c.id, tenantId: DEMO_TENANT_ID, status: "verified" })} disabled={update.isPending}>
                          <CheckCircle2 className="w-3 h-3" />Verify
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => update.mutate({ id: c.id, tenantId: DEMO_TENANT_ID, status: "failed" })} disabled={update.isPending}>
                          <XCircle className="w-3 h-3" />Fail
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
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No background checks on file.</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
