import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Share2,
  Users,
  Award,
  Heart,
  Copy,
  Twitter,
  Facebook,
  Mail,
  Gift,
  TrendingUp,
  Star,
  MessageSquare,
  Globe,
} from "lucide-react";

const AMBASSADOR_TIERS = [
  {
    name: "Advocate",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50",
    referrals: 0,
    description: "Every sponsor starts here. Share your story and inspire others.",
    perks: ["Personal referral link", "Impact updates to share", "Sponsor community access"],
  },
  {
    name: "Champion",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50",
    referrals: 3,
    description: "You've inspired 3 new sponsors. Your impact is multiplying.",
    perks: ["Champion badge on profile", "Early access to child updates", "Monthly champion digest"],
  },
  {
    name: "Ambassador",
    icon: Award,
    color: "text-blue-500",
    bg: "bg-blue-50",
    referrals: 10,
    description: "10 sponsors joined because of you. You're changing lives at scale.",
    perks: ["Ambassador certificate", "Annual impact report", "Direct line to program team", "Exclusive ambassador events"],
  },
  {
    name: "Patron",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-50",
    referrals: 25,
    description: "25 sponsors. Your network is funding an entire community.",
    perks: ["Field visit invitation", "Named in annual report", "Advisory board invitation", "Patron recognition plaque"],
  },
];

const SHARE_MESSAGES = [
  "I sponsor a child through SponsorBridge and it's one of the most meaningful things I do. For just $40/month, you can change a child's life. Join me →",
  "Did you know that consistent sponsorship is one of the most effective forms of giving? I've been sponsoring a child and the updates I receive are incredible. Learn more →",
  "I just received a video message from the child I sponsor. It's moments like these that remind me why I give. You can do this too →",
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(0);
  const [customMessage, setCustomMessage] = useState("");

  // Real backend data
  const { data: referralData, isLoading: codeLoading } = trpc.community.myReferralCode.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: statsData, isLoading: statsLoading } = trpc.community.myStats.useQuery(undefined, {
    enabled: !!user,
  });

  const referralCode = referralData?.code ?? "";
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${encodeURIComponent(referralCode)}` : "";
  const referralCount = statsData?.referralCount ?? 0;
  const currentTierName = statsData?.tier ?? "Advocate";
  const monthlyImpact = statsData?.monthlyImpact ?? 0;

  const currentTier = AMBASSADOR_TIERS.find(t => t.name === currentTierName) ?? AMBASSADOR_TIERS[0];
  const nextTierIndex = AMBASSADOR_TIERS.findIndex(t => t.name === currentTierName) + 1;
  const nextTier = nextTierIndex < AMBASSADOR_TIERS.length ? AMBASSADOR_TIERS[nextTierIndex] : null;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const message = customMessage || SHARE_MESSAGES[selectedMessage];
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message + " " + referralLink)}`;
    window.open(url, "_blank");
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank");
  };

  const handleShareEmail = () => {
    const message = customMessage || SHARE_MESSAGES[selectedMessage];
    const subject = "I want to share something meaningful with you";
    const body = `${message}\n\n${referralLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community & Ambassador Program</h1>
        <p className="text-muted-foreground mt-1">
          Share your sponsorship story and inspire others to give. Every referral multiplies your impact.
        </p>
      </div>

      {/* Ambassador Status Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="pt-6">
          {statsLoading ? (
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className={`w-16 h-16 rounded-full ${currentTier.bg} flex items-center justify-center flex-shrink-0`}>
                <currentTier.icon className={`w-8 h-8 ${currentTier.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{currentTier.name}</h2>
                  <Badge variant="secondary">{referralCount} referral{referralCount !== 1 ? "s" : ""}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">{currentTier.description}</p>
                {nextTier && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to {nextTier.name}</span>
                      <span>{referralCount}/{nextTier.referrals} referrals</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((referralCount / nextTier.referrals) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {currentTier.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="share">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Award className="w-4 h-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="w-4 h-4 mr-2" />
            Referrals
          </TabsTrigger>
        </TabsList>

        {/* Share Tab */}
        <TabsContent value="share" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Referral Link</CardTitle>
              <CardDescription>Share this link to track who joins because of you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {codeLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="font-mono text-sm bg-muted" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink} disabled={!referralLink}>
                    {copied ? (
                      <span className="text-xs text-green-600">✓</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleShareTwitter} disabled={!referralLink}>
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter / X
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShareFacebook} disabled={!referralLink}>
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShareEmail} disabled={!referralLink}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Templates</CardTitle>
              <CardDescription>Choose a message or write your own</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SHARE_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedMessage(i); setCustomMessage(""); }}
                  className={`p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                    selectedMessage === i && !customMessage
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {msg}
                </div>
              ))}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Or write your own:</p>
                <Textarea
                  placeholder="Share your personal sponsorship story..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AMBASSADOR_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={`${tier.name === currentTier.name ? "border-2 border-primary" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${tier.bg} flex items-center justify-center`}>
                      <tier.icon className={`w-5 h-5 ${tier.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{tier.name}</h3>
                        {tier.name === currentTier.name && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tier.referrals === 0 ? "Starting tier" : `${tier.referrals}+ referrals`}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                  <div className="space-y-1">
                    {tier.perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-2 text-sm">
                        <Gift className={`w-3 h-3 ${tier.color}`} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {referralCount === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No referrals yet</p>
                  <p className="text-sm mt-1">Share your referral link to start tracking who joins because of you.</p>
                  <Button className="mt-4" onClick={handleCopyLink} disabled={!referralLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Referral Link
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl font-bold text-primary">{referralCount}</p>
                  <p className="text-muted-foreground mt-1">Sponsors joined because of you</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your referrals generate <strong>${monthlyImpact}/month</strong> in sponsorship funding
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Your Referrals", value: statsLoading ? "—" : referralCount, icon: Users, color: "text-blue-500" },
          { label: "Children Helped", value: statsLoading ? "—" : referralCount, icon: Heart, color: "text-rose-500" },
          { label: "Monthly Impact", value: statsLoading ? "—" : `$${monthlyImpact}`, icon: TrendingUp, color: "text-green-500" },
          { label: "Ambassador Tier", value: statsLoading ? "—" : currentTierName, icon: MessageSquare, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
