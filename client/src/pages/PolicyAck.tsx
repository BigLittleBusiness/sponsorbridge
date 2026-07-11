import SponsorBridgeLayout from "@/components/SponsorBridgeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { CheckCircle2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PolicyAck() {
  const [, navigate] = useLocation();
  const [agreed, setAgreed] = useState(false);
  const ack = trpc.auth.acknowledgePolicy.useMutation({
    onSuccess: () => { toast.success("Policy acknowledged."); navigate("/dashboard"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <SponsorBridgeLayout>
      <div className="p-6 animate-in-up max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-trust-blue/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-trust-blue" />
          </div>
          <h1 className="text-2xl font-bold">Child Protection Policy</h1>
          <p className="text-muted-foreground mt-2">All staff must acknowledge this policy before accessing the platform.</p>
        </div>
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Policy Summary — Version 1.0</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>SponsorBridge is committed to the protection of every child in our programme. All staff, volunteers, and partners must adhere to the following principles:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The welfare of the child is paramount at all times.</li>
              <li>All communications with or about children must be moderated before delivery.</li>
              <li>Parental consent must be obtained and verified before a child is enrolled.</li>
              <li>Any safeguarding concern must be reported immediately using the incident reporting system.</li>
              <li>Background checks are required for all staff with direct access to child data.</li>
              <li>All personal data is handled in accordance with GDPR and COPPA requirements.</li>
              <li>The audit trail is immutable — all actions are permanently logged.</li>
              <li>Emergency disclosures to authorities must follow the documented protocol.</li>
            </ul>
            <p>Violation of this policy may result in immediate suspension of access and referral to relevant authorities.</p>
          </CardContent>
        </Card>
        <div className="flex items-start gap-3 mb-6 p-4 rounded-lg border border-trust-blue/30 bg-blue-50">
          <Switch checked={agreed} onCheckedChange={setAgreed} />
          <Label className="text-sm leading-relaxed cursor-pointer" onClick={() => setAgreed(!agreed)}>
            I have read and understood the SponsorBridge Child Protection Policy (v1.0) and agree to comply with all requirements.
          </Label>
        </div>
        <Button className="w-full bg-trust-blue hover:bg-trust-blue/90 text-white gap-2"
          disabled={!agreed || ack.isPending}
          onClick={() => ack.mutate({ policyVersion: "1.0" })}>
          <CheckCircle2 className="w-4 h-4" />
          {ack.isPending ? "Acknowledging…" : "Acknowledge & Continue"}
        </Button>
      </div>
    </SponsorBridgeLayout>
  );
}
