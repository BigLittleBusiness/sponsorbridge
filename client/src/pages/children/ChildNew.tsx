import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function ChildNew() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", country: "", region: "", bio: "",
    interests: "", educationLevel: "", schoolName: "", healthStatus: "",
    programType: "", gender: "female" as "male"|"female"|"other",
    hasSpecialNeeds: false, specialNeedsDetails: "",
    parentalConsentGranted: false, photoConsentGranted: false, videoConsentGranted: false,
  });

  const createChild = trpc.children.create.useMutation({
    onSuccess: () => { toast.success("Child profile created."); navigate("/children"); },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/children"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-terracotta" />Add Child</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">First Name *</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Last Name *</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="female">Female</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Country</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Region / City</Label><Input value={form.region} onChange={(e) => set("region", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Bio</Label><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1" rows={3} placeholder="A short description of the child…" /></div>
              <div><Label className="text-xs">Interests</Label><Input value={form.interests} onChange={(e) => set("interests", e.target.value)} className="mt-1" placeholder="e.g. Football, Drawing, Music" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Education & Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Education Level</Label><Input value={form.educationLevel} onChange={(e) => set("educationLevel", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">School Name</Label><Input value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Programme Type</Label><Input value={form.programType} onChange={(e) => set("programType", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Health Notes</Label><Textarea value={form.healthStatus} onChange={(e) => set("healthStatus", e.target.value)} className="mt-1" rows={2} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.hasSpecialNeeds} onCheckedChange={(v) => set("hasSpecialNeeds", v)} />
                <Label className="text-sm">Has Special Needs</Label>
              </div>
              {form.hasSpecialNeeds && <Textarea value={form.specialNeedsDetails} onChange={(e) => set("specialNeedsDetails", e.target.value)} placeholder="Describe special needs…" rows={2} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Consent</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "parentalConsentGranted", label: "Parental consent granted" },
                { key: "photoConsentGranted", label: "Photo consent granted" },
                { key: "videoConsentGranted", label: "Video consent granted" },
              ].map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <Switch checked={(form as any)[c.key]} onCheckedChange={(v) => set(c.key, v)} />
                  <Label className="text-sm">{c.label}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Link href="/children"><Button variant="outline">Cancel</Button></Link>
            <Button
              className="bg-terracotta hover:bg-terracotta/90 text-white"
              disabled={!form.firstName || !form.lastName || createChild.isPending}
              onClick={() => createChild.mutate({ tenantId: DEMO_TENANT_ID, ...form })}>
              {createChild.isPending ? "Saving…" : "Create Child Profile"}
            </Button>
          </div>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
