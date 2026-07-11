import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Plus, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const DEMO_TENANT_ID = 1;
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-600 border-gray-300 bg-gray-50",
  medium: "text-amber-700 border-amber-300 bg-amber-50",
  high: "text-orange-700 border-orange-300 bg-orange-50",
  urgent: "text-destructive border-destructive/30 bg-red-50",
};
const STATUS_COLORS: Record<string, string> = {
  open: "text-destructive border-destructive/30",
  triaged: "text-amber-700 border-amber-300",
  under_investigation: "text-trust-blue border-trust-blue/30",
  referred: "text-purple-700 border-purple-300",
  closed: "text-sage border-sage/30",
};

export default function IncidentsList() {
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const { data: incidents, isLoading } = trpc.safeguarding.listIncidents.useQuery({
    tenantId: DEMO_TENANT_ID,
    status: status !== "all" ? status : undefined,
    priority: priority !== "all" ? priority : undefined,
  });
  const open = incidents?.filter((i) => i.status === "open" || i.status === "under_investigation").length ?? 0;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-trust-blue" />Safeguarding Incidents</h1>
            <p className="text-muted-foreground text-sm mt-1">{open > 0 ? <span className="text-destructive font-medium">{open} open incident{open !== 1 ? "s" : ""}</span> : "No open incidents"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="referred">Referred</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : incidents && incidents.length > 0 ? (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/safeguarding/incidents/${inc.id}`}>
                <Card className={`card-hover cursor-pointer ${inc.isEmergency ? "border-destructive/50 bg-red-50/30" : ""}`}>
                  <CardContent className="py-4 flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${inc.priority === "urgent" || inc.isEmergency ? "text-destructive" : "text-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{inc.title}</span>
                        {inc.isEmergency && <Badge className="text-xs bg-destructive text-white">Emergency</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{inc.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[inc.priority ?? "medium"] ?? ""}`}>{inc.priority}</Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[inc.status] ?? ""}`}>{inc.status.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(inc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No incidents found.</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
