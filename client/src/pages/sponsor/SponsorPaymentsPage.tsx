/**
 * SponsorPaymentsPage
 * Payment history table + manage subscription (Stripe portal link).
 */
import { useState, useEffect } from "react";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { SponsorPortalLayout } from "@/components/SponsorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Download,
} from "lucide-react";

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  stripeInvoiceId: string | null;
  childFirstName: string;
  childLastName: string;
}

interface PaymentsData {
  payments: Payment[];
  totalDonatedCents: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  succeeded: { label: "Paid", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  failed: { label: "Failed", icon: XCircle, color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", icon: AlertTriangle, color: "bg-gray-100 text-gray-600" },
  disputed: { label: "Disputed", icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
};

export default function SponsorPaymentsPage() {
  const { sponsorships } = useSponsorAuth();
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sponsor/payments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const primarySponsorship = sponsorships[0];

  const totalFormatted = data && data.totalDonatedCents != null
    ? `$${(data.totalDonatedCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  return (
    <SponsorPortalLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2e]">Payments</h1>
          <p className="text-[#8a7060] mt-1">Your giving history and subscription management</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-[#e8ddd5] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-[#1a3a2e]">{totalFormatted}</p>
              )}
              <p className="text-xs text-[#8a7060]">Total donated</p>
            </CardContent>
          </Card>

          <Card className="border-[#e8ddd5] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="w-9 h-9 bg-[#C1440E]/10 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-[#C1440E]" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-[#1a3a2e]">
                  ${((primarySponsorship?.monthlyAmount ?? 0) / 100).toFixed(0)}/mo
                </p>
              )}
              <p className="text-xs text-[#8a7060]">Monthly contribution</p>
            </CardContent>
          </Card>

          <Card className="border-[#e8ddd5] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-[#1a3a2e]">
                  {(data?.payments ?? []).filter((p) => p.status === "succeeded").length}
                </p>
              )}
              <p className="text-xs text-[#8a7060]">Successful payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Manage subscription */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a3a2e]">
              Manage Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#4a3728]">
                  Your sponsorship is billed monthly via Stripe. You can update your payment method, view invoices, or cancel your subscription through the Stripe customer portal.
                </p>
                <p className="text-xs text-[#8a7060] mt-1">
                  Changes take effect at the next billing cycle.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#C1440E] text-[#C1440E] hover:bg-[#C1440E]/5 shrink-0"
                onClick={() => {
                  // In production, this would redirect to a Stripe Customer Portal session
                  window.open("https://billing.stripe.com/p/login/test_example", "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage in Stripe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment history table */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-[#1a3a2e]">
              Payment History
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8a7060] hover:text-[#C1440E]"
              onClick={() => {
                // CSV export placeholder
                const rows = [
                  ["Date", "Amount", "Status", "Child", "Invoice ID"],
                  ...(data?.payments ?? []).map((p) => [
                    new Date(p.paidAt ?? p.createdAt).toLocaleDateString(),
                    `${(p.currency ?? "USD").toUpperCase()} ${(p.amount / 100).toFixed(2)}`,
                    p.status,
                    `${p.childFirstName} ${p.childLastName}`,
                    p.stripeInvoiceId ?? "",
                  ]),
                ];
                const csv = rows.map((r) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sponsorbridge-payments.csv";
                a.click();
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !(data?.payments ?? []).length ? (
              <div className="py-12 text-center">
                <CreditCard className="h-10 w-10 mx-auto mb-3 text-[#e8ddd5]" />
                <p className="text-[#8a7060] text-sm">No payment history yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8ddd5] bg-[#f9f5f1]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wide">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wide">For</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8a7060] uppercase tracking-wide">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.payments ?? []).map((payment) => {
                      const statusCfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.pending;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-[#f0e8e0] hover:bg-[#fdf8f5] transition-colors"
                        >
                          <td className="px-4 py-3 text-[#4a3728]">
                            {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#1a3a2e]">
                            {(payment.currency ?? "USD").toUpperCase()}{" "}
                            {(payment.amount / 100).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-[#4a3728]">
                            {payment.childFirstName} {payment.childLastName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {payment.stripeInvoiceId ? (
                              <span className="text-xs text-[#8a7060] font-mono">
                                {payment.stripeInvoiceId.slice(0, 12)}…
                              </span>
                            ) : (
                              <span className="text-xs text-[#b0a090]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SponsorPortalLayout>
  );
}
