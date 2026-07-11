import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Mail, Search, User, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const DEMO_TENANT_ID = 1;

export default function SponsorsList() {
  const [search, setSearch] = useState("");
  const { data: sponsors, isLoading } = trpc.sponsors.list.useQuery({ tenantId: DEMO_TENANT_ID, search: search || undefined });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-trust-blue" />Sponsors</h1>
            <p className="text-muted-foreground text-sm mt-1">{sponsors?.length ?? 0} sponsors registered</p>
          </div>
        </div>
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search sponsors…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : sponsors && sponsors.length > 0 ? (
          <div className="space-y-2">
            {sponsors.map((s) => (
              <Link key={s.id} href={`/sponsors/${s.id}`}>
                <Card className="card-hover cursor-pointer">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-trust-blue/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-trust-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {s.country && <div className="text-xs text-muted-foreground">{s.country}</div>}
                      <Badge variant="outline" className={s.isActive ? "text-sage border-sage/30 text-xs" : "text-muted-foreground text-xs"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No sponsors found.</p>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
