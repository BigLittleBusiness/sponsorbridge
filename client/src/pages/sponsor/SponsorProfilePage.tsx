/**
 * SponsorProfilePage
 * Sponsor profile settings and notification preferences.
 */
import { useState } from "react";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { SponsorPortalLayout } from "@/components/SponsorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, User, Bell, Shield, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function SponsorProfilePage() {
  const { sponsor, refresh } = useSponsorAuth();
  const [emailNotifications, setEmailNotifications] = useState(sponsor?.emailNotifications ?? true);
  const [smsNotifications, setSmsNotifications] = useState(sponsor?.smsNotifications ?? false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const initials = sponsor
    ? `${sponsor.firstName[0] ?? ""}${sponsor.lastName[0] ?? ""}`.toUpperCase()
    : "SP";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/sponsor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailNotifications, smsNotifications, marketingConsent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SponsorPortalLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2e]">My Profile</h1>
          <p className="text-[#8a7060] mt-1">Manage your account details and preferences</p>
        </div>

        {/* Profile card */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1a3a2e] flex items-center gap-2">
              <User className="h-4 w-4 text-[#C1440E]" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-bold bg-[#C1440E]/10 text-[#C1440E]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-[#1a3a2e]">
                  {sponsor?.firstName} {sponsor?.lastName}
                </h2>
                <p className="text-sm text-[#8a7060]">Sponsor</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {sponsor?.email && (
                <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                  <Mail className="h-4 w-4 text-[#8a7060] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#8a7060]">Email</p>
                    <p className="text-sm font-medium text-[#1a3a2e] break-all">{sponsor.email}</p>
                  </div>
                </div>
              )}
              {sponsor?.phone && (
                <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                  <Phone className="h-4 w-4 text-[#8a7060] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#8a7060]">Phone</p>
                    <p className="text-sm font-medium text-[#1a3a2e]">{sponsor.phone}</p>
                  </div>
                </div>
              )}
              {sponsor?.country && (
                <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                  <MapPin className="h-4 w-4 text-[#8a7060] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#8a7060]">Country</p>
                    <p className="text-sm font-medium text-[#1a3a2e]">{sponsor.country}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-[#8a7060]">
              To update your name, email, or phone number, please contact your sponsorship organisation directly.
            </p>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1a3a2e] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#C1440E]" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif" className="text-sm font-medium text-[#1a3a2e]">
                  Email notifications
                </Label>
                <p className="text-xs text-[#8a7060] mt-0.5">
                  Receive updates about your sponsored child via email
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-[#C1440E]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notif" className="text-sm font-medium text-[#1a3a2e]">
                  SMS notifications
                </Label>
                <p className="text-xs text-[#8a7060] mt-0.5">
                  Receive text message alerts for important updates
                </p>
              </div>
              <Switch
                id="sms-notif"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
                className="data-[state=checked]:bg-[#C1440E]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing" className="text-sm font-medium text-[#1a3a2e]">
                  Program updates & stories
                </Label>
                <p className="text-xs text-[#8a7060] mt-0.5">
                  Occasional newsletters about the broader program impact
                </p>
              </div>
              <Switch
                id="marketing"
                checked={marketingConsent}
                onCheckedChange={setMarketingConsent}
                className="data-[state=checked]:bg-[#C1440E]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#C1440E] hover:bg-[#a03508] text-white font-semibold transition-all active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save preferences
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy & data */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1a3a2e] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#C1440E]" />
              Privacy & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#4a3728] leading-relaxed">
              Your personal data is processed in accordance with our Privacy Policy and the data protection policies of your sponsorship organisation. We do not share your information with third parties without your consent.
            </p>
            <p className="text-sm text-[#4a3728] leading-relaxed">
              To request a copy of your data or to exercise your right to erasure, please contact your sponsorship organisation directly.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="/privacy"
                className="text-sm text-[#C1440E] hover:underline font-medium"
              >
                Privacy Policy
              </a>
              <span className="text-[#e8ddd5]">·</span>
              <a
                href="/terms"
                className="text-sm text-[#C1440E] hover:underline font-medium"
              >
                Terms of Service
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </SponsorPortalLayout>
  );
}
