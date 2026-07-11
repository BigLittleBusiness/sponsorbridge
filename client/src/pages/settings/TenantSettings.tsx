import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_TENANT_ID = 1;

export default function TenantSettings() {
  const utils = trpc.useUtils();
  const { data: tenant, isLoading } = trpc.tenants.getById.useQuery({ id: DEMO_TENANT_ID });
  const [name, setName] = useState(tenant?.name ?? "");
  const [primaryColor, setPrimaryColor] = useState(tenant?.primaryColor ?? "#D14A2E");
  const [features, setFeatures] = useState({
    featureVlogs: tenant?.featureVlogs ?? true,
    featureTranslation: tenant?.featureTranslation ?? true,
    featureSocialSharing: tenant?.featureSocialSharing ?? true,
    featurePooling: tenant?.featurePooling ?? false,
    featureBequest: tenant?.featureBequest ?? false,
  });
  const update = trpc.tenants.update.useMutation({
    onSuccess: () => { utils.tenants.getById.invalidate(); toast.success("Settings saved."); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <SponsorBridgeLayout><div className="p-6"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div></SponsorBridgeLayout>;

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-muted-foreground" />Organisation Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your charity's SponsorBridge environment</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-xs">Organisation Name</Label><Input value={name || tenant?.name || ""} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Subdomain</Label><Input value={tenant?.subdomain ?? ""} disabled className="mt-1 bg-muted" /></div>
              <div className="flex items-center gap-4">
                <div className="flex-1"><Label className="text-xs">Primary Colour</Label><Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="mt-1 h-10 cursor-pointer" /></div>
                <div className="flex-1"><Label className="text-xs">Preview</Label><div className="mt-1 h-10 rounded-md border" style={{ backgroundColor: primaryColor }} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Feature Toggles</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "featureVlogs", label: "Vlog System", desc: "Allow field workers to upload video updates" },
                { key: "featureTranslation", label: "Auto-Translation", desc: "Translate messages via Google Translate" },
                { key: "featureSocialSharing", label: "Social Sharing", desc: "Enable sponsor social sharing features" },
                { key: "featurePooling", label: "Pooled Sponsorship", desc: "Allow multiple sponsors per child" },
                { key: "featureBequest", label: "Bequest / Legacy Giving", desc: "Enable legacy donation options" },
              ].map((f) => (
                <div key={f.key}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
                    <Switch checked={(features as any)[f.key]} onCheckedChange={(v) => setFeatures((prev) => ({ ...prev, [f.key]: v }))} />
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: DEMO_TENANT_ID, name: name || undefined, primaryColor, ...features })}>
              {update.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </SponsorBridgeLayout>
  );
}
