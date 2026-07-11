import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Heart, Plus, Search, User } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const DEMO_TENANT_ID = 1;

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "status-available",
  SPONSORED: "status-sponsored",
  GRADUATED: "status-graduated",
  WAITLISTED: "status-waitlisted",
};

function ChildCard({ child }: { child: any }) {
  const age = child.dateOfBirth
    ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  return (
    <Link href={`/children/${child.id}`}>
      <Card className="card-hover cursor-pointer overflow-hidden">
        <div className="aspect-[4/3] bg-gradient-to-br from-terracotta/10 to-golden-nectar/10 flex items-center justify-center relative">
          {child.photoUrl ? (
            <img src={child.photoUrl} alt={child.firstName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-terracotta/30" />
          )}
          <div className="absolute top-2 right-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[child.status] ?? ""}`}>
              {child.status}
            </span>
          </div>
          {!child.parentalConsentGranted && (
            <div className="absolute bottom-2 left-2">
              <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">Consent Pending</span>
            </div>
          )}
        </div>
        <CardContent className="pt-3 pb-4">
          <div className="font-semibold text-sm">{child.firstName} {child.lastName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {age !== null ? `Age ${age}` : "Age unknown"}{child.country ? ` · ${child.country}` : ""}
          </div>
          {child.educationLevel && <div className="text-xs text-muted-foreground mt-1">{child.educationLevel}</div>}
          {child.hasSpecialNeeds && <Badge variant="outline" className="mt-2 text-xs border-purple-200 text-purple-700">Special Needs</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ChildrenList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gender, setGender] = useState("all");
  const { data: children, isLoading } = trpc.children.list.useQuery({
    tenantId: DEMO_TENANT_ID,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    gender: gender !== "all" ? gender : undefined,
  });
  const counts = {
    available: children?.filter((c) => c.status === "AVAILABLE").length ?? 0,
    sponsored: children?.filter((c) => c.status === "SPONSORED").length ?? 0,
    graduated: children?.filter((c) => c.status === "GRADUATED").length ?? 0,
    waitlisted: children?.filter((c) => c.status === "WAITLISTED").length ?? 0,
  };
  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-terracotta" />Children</h1>
            <p className="text-muted-foreground text-sm mt-1">{children?.length ?? 0} children in programme</p>
          </div>
          <Link href="/children/new">
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white gap-2"><Plus className="w-4 h-4" />Add Child</Button>
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Available", count: counts.available, key: "AVAILABLE", style: "status-available" },
            { label: "Sponsored", count: counts.sponsored, key: "SPONSORED", style: "status-sponsored" },
            { label: "Graduated", count: counts.graduated, key: "GRADUATED", style: "status-graduated" },
            { label: "Waitlisted", count: counts.waitlisted, key: "WAITLISTED", style: "status-waitlisted" },
          ].map((s) => (
            <button key={s.key} onClick={() => setStatus(status === s.key ? "all" : s.key)}
              className={`rounded-lg border p-3 text-center transition-all ${s.style} ${status === s.key ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"}`}>
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="SPONSORED">Sponsored</SelectItem>
              <SelectItem value="GRADUATED">Graduated</SelectItem>
              <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}><div className="aspect-[4/3] bg-muted animate-pulse" /><CardContent className="pt-3 pb-4"><div className="h-4 bg-muted animate-pulse rounded mb-2" /><div className="h-3 bg-muted animate-pulse rounded w-2/3" /></CardContent></Card>
            ))}
          </div>
        ) : children && children.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {children.map((child) => <ChildCard key={child.id} child={child} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No children found matching your filters.</p>
            <Link href="/children/new"><Button variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Add the first child</Button></Link>
          </div>
        )}
      </div>
    </SponsorBridgeLayout>
  );
}
