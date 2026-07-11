import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { DollarSign, Wallet } from "lucide-react";
import { useState } from "react";

const DEMO_TENANT_ID = 1;
const STATUS_COLORS: Record<string, string> = {
  succeeded: "text-sage border-sage/30 bg-green-50",
  pending: "text-amber-700 border-amber-300 bg-amber-50",
  failed: "text-destructive border-destructive/30 bg-red-50",
  refunded: "text-gray-600 border-gray-300 bg-gray-50",
  disputed: "text-orange-700 border-orange-300 bg-orange-50",
};

export default function PaymentsPage() {
  const [status, setStatus] = useState("all");
  const { data: payments, isLoading } = trpc.payments.list.useQuery({ tenantId: DEMO_TENANT_ID, status: status !== "all" ? status : undefined });
  const total = payments?.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount, 0) ?? 0;
  const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6 text-sage" />Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">{payments?.length ?? 0} transactions</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Collected</p>
            <p className="text-2xl font-bold text-sage mt-1">{fmt(total)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Transactions</p>
            <p className="text-2xl font-bold mt-1">{payments?.length ?? 0}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Failed Payments</p>
            <p className="text-2xl font-bold text-destructive mt-1">{payments?.filter((p) => p.status === "failed").length ?? 0}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Transaction History</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{fmt(p.amount)}</div>
                      <div className="text-xs text-muted-foreground">Sponsorship #{p.sponsorshipId} · {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </SponsorBridgeLayout>
  );
}
