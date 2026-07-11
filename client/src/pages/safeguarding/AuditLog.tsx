import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileText, Lock } from "lucide-react";

const DEMO_TENANT_ID = 1;

export default function AuditLog() {
  const { data: logs, isLoading } = trpc.audit.list.useQuery({ tenantId: DEMO_TENANT_ID, limit: 100 });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-muted-foreground" />Audit Log</h1>
          <div className="flex items-center gap-2 mt-1">
            <Lock className="w-3 h-3 text-sage" />
            <p className="text-muted-foreground text-sm">Immutable, append-only record of all system actions. Records cannot be edited or deleted.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity ({logs?.length ?? 0} entries)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-xs">
                    <span className="badge-immutable shrink-0">{log.action}</span>
                    <div className="flex-1 min-w-0">
                      {log.entityType && <span className="text-muted-foreground">{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</span>}
                      {log.userEmail && <span className="text-muted-foreground ml-2">by {log.userEmail}</span>}
                    </div>
                    <span className="text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No audit entries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </SponsorBridgeLayout>
  );
}
