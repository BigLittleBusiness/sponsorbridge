import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Users } from "lucide-react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;
const ROLES = ["system_admin","program_manager","safeguarding_officer","field_worker","finance_officer","sponsor_relations","volunteer","sponsor"] as const;
const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin", program_manager: "Program Manager",
  safeguarding_officer: "Safeguarding Officer", field_worker: "Field Worker",
  finance_officer: "Finance Officer", sponsor_relations: "Sponsor Relations",
  volunteer: "Volunteer", sponsor: "Sponsor", admin: "Admin", user: "User",
};
const ROLE_COLORS: Record<string, string> = {
  system_admin: "bg-red-100 text-red-800", program_manager: "bg-blue-100 text-blue-800",
  safeguarding_officer: "bg-indigo-100 text-indigo-800", field_worker: "bg-green-100 text-green-800",
  finance_officer: "bg-amber-100 text-amber-800", sponsor_relations: "bg-purple-100 text-purple-800",
  volunteer: "bg-gray-100 text-gray-800", sponsor: "bg-orange-100 text-orange-800",
};

export default function UserManagement() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.listByTenant.useQuery({ tenantId: DEMO_TENANT_ID });
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.listByTenant.invalidate(); toast.success("Role updated."); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-muted-foreground" />User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff roles and permissions across your organisation</p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Staff Members ({users?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                      {u.name?.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{u.name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{u.email ?? "No email"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-800"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <Select value={u.role} onValueChange={(v) => updateRole.mutate({ userId: u.id, role: v as any })}>
                        <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No users found for this tenant.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </SponsorBridgeLayout>
  );
}
