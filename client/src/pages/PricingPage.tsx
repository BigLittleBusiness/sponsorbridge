import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, X, ArrowRight, Users, Baby, Video, Shield,
  Globe, BookOpen, Zap, Building2, HelpCircle, FolderHeart,
  Share2, TrendingUp
} from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { trackConversion } from "@/lib/conversionAnalytics";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    key: "starter",
    name: "Starter",
    price: "Free",
    priceNote: "No credit card required",
    description: "Perfect for small organisations just getting started with child sponsorship.",
    color: "border-border",
    badge: null,
    cta: "Get started free",
    ctaVariant: "outline" as const,
    features: [
      { text: "Up to 50 sponsors", icon: Users },
      { text: "Up to 100 children", icon: Baby },
      { text: "Child sponsorship management", icon: Baby },
      { text: "Vlogs (add-on available)", icon: Video, addOn: true },
      { text: "Basic white-label branding", icon: Building2 },
      { text: "RBAC — 7 staff roles", icon: Shield },
      { text: "Basic audit trails", icon: BookOpen },
      { text: "Consent management", icon: Check },
      { text: "90-day sponsor onboarding", icon: Zap },
      { text: "Stripe recurring billing", icon: Check },
      { text: "Community support", icon: HelpCircle },
    ],
    notIncluded: [
      "Project & campaign sponsorship",
      "Public fundraising pages",
      "Advanced safeguarding (add-on)",
      "DeepL auto-translation (add-on)",
      "Custom domain",
      "Dedicated support",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: "$99",
    priceNote: "per month, billed monthly",
    description: "For growing organisations ready to scale their sponsorship programme — including project and campaign fundraising.",
    color: "border-terracotta",
    badge: "Most popular",
    cta: "Start free trial",
    ctaVariant: "default" as const,
    features: [
      { text: "Up to 500 sponsors", icon: Users },
      { text: "Up to 1,000 children", icon: Baby },
      { text: "Child sponsorship management", icon: Baby },
      { text: "Project & campaign sponsorship", icon: FolderHeart, isNew: true },
      { text: "Public fundraising pages + social sharing", icon: Share2, isNew: true },
      { text: "One-off & monthly project contributions", icon: TrendingUp, isNew: true },
      { text: "Vlog system included", icon: Video },
      { text: "Full branding customisation", icon: Building2 },
      { text: "All core safeguarding features", icon: Shield },
      { text: "Immutable audit trail", icon: BookOpen },
      { text: "Consent management + expiry alerts", icon: Check },
      { text: "90-day sponsor onboarding", icon: Zap },
      { text: "Stripe recurring billing", icon: Check },
      { text: "Moderated messaging system", icon: Check },
      { text: "Retention analytics + NPS surveys", icon: Check },
      { text: "Email support", icon: HelpCircle },
    ],
    notIncluded: [
      "Advanced safeguarding (add-on)",
      "DeepL auto-translation (add-on)",
      "Custom domain",
    ],
  },
  {
    key: "scale",
    name: "Scale",
    price: "$249",
    priceNote: "per month, billed monthly",
    description: "For established organisations managing large-scale child and project sponsorship programmes.",
    color: "border-border",
    badge: null,
    cta: "Start free trial",
    ctaVariant: "outline" as const,
    features: [
      { text: "Up to 2,000 sponsors", icon: Users },
      { text: "Up to 5,000 children", icon: Baby },
      { text: "Child sponsorship management", icon: Baby },
      { text: "Project & campaign sponsorship", icon: FolderHeart, isNew: true },
      { text: "Public fundraising pages + social sharing", icon: Share2, isNew: true },
      { text: "One-off & monthly project contributions", icon: TrendingUp, isNew: true },
      { text: "Vlog system included", icon: Video },
      { text: "Full branding customisation", icon: Building2 },
      { text: "Advanced safeguarding", icon: Shield },
      { text: "Incident management + case workflows", icon: Shield },
      { text: "Staff vetting workflows", icon: Shield },
      { text: "Immutable audit trail", icon: BookOpen },
      { text: "Consent management + expiry alerts", icon: Check },
      { text: "90-day sponsor onboarding", icon: Zap },
      { text: "Moderated messaging + auto-translation (add-on)", icon: Globe },
      { text: "Churn prediction + cohort analytics", icon: Check },
      { text: "Priority email support", icon: HelpCircle },
    ],
    notIncluded: [
      "Custom domain",
      "Dedicated account manager",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceNote: "Contact us for pricing",
    description: "For large NGOs and international organisations with complex requirements.",
    color: "border-[#1a2e1a]",
    badge: "For large NGOs",
    cta: "Contact us",
    ctaVariant: "outline" as const,
    features: [
      { text: "Unlimited sponsors", icon: Users },
      { text: "Unlimited children", icon: Baby },
      { text: "Child sponsorship management", icon: Baby },
      { text: "Project & campaign sponsorship", icon: FolderHeart, isNew: true },
      { text: "Public fundraising pages + social sharing", icon: Share2, isNew: true },
      { text: "Vlog system included", icon: Video },
      { text: "Full branding + custom domain", icon: Building2 },
      { text: "Everything in Scale", icon: Shield },
      { text: "Custom development", icon: Zap },
      { text: "SLA guarantees", icon: Check },
      { text: "Dedicated onboarding & training", icon: BookOpen },
      { text: "Dedicated account manager", icon: HelpCircle },
      { text: "SSO / SAML integration", icon: Check },
      { text: "Custom integrations", icon: Check },
    ],
    notIncluded: [],
  },
];

const ADD_ONS = [
  {
    name: "Vlog System",
    applicableTo: "Starter tier",
    price: "+$20/month",
    description: "Add field worker video uploads with charity moderation queue and safeguarding escalation.",
    icon: Video,
    isNew: false,
  },
  {
    name: "DeepL Auto-Translation",
    applicableTo: "All tiers",
    price: "+$15/month",
    description: "Automatically translate all sponsor–child messages using DeepL's neural translation engine.",
    icon: Globe,
    isNew: false,
  },
  {
    name: "Advanced Safeguarding",
    applicableTo: "Growth tier",
    price: "+$30/month",
    description: "Upgrade to full incident management, case workflows, and staff vetting — without moving to Scale.",
    icon: Shield,
    isNew: false,
  },
  {
    name: "Bookkeeping Integration Setup",
    applicableTo: "All tiers",
    price: "One-time fee",
    description: "Professional setup of your Xero or QuickBooks integration, including chart of accounts mapping.",
    icon: BookOpen,
    isNew: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { account } = useCustomAuth();

  const getAnnualPrice = (monthly: string) => {
    if (monthly === "Free" || monthly === "Custom") return monthly;
    const num = parseInt(monthly.replace("$", ""));
    const discounted = Math.round(num * 0.8);
    return `$${discounted}`;
  };

  const getCtaHref = (tier: typeof TIERS[0]) => {
    if (tier.key === "enterprise") return "mailto:hello@sponsorbridge.com?subject=Enterprise enquiry";
    if (account) return "/org-dashboard";
    return "/register";
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#1a2e1a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <img
                src="/manus-storage/sb-icon-mark_f15604c9.svg"
                alt="SponsorBridge"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="text-white font-bold text-lg">SponsorBridge</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {account ? (
              <Link href="/org-dashboard">
                <Button size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-terracotta border-terracotta/30 bg-terracotta/5">
            Transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a2e1a] leading-tight mb-4">
            Simple pricing for every organisation
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Start free and scale as your programme grows. No hidden fees, no lock-in contracts.
          </p>
          <p className="text-sm text-amber-700 font-medium mb-8">
            Project &amp; campaign sponsorship is now included on Growth plans and above.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-border rounded-full px-4 py-2">
            <button
              className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${!annual ? "bg-terracotta text-white" : "text-muted-foreground"}`}
              onClick={() => {
                setAnnual(false);
                trackConversion("pricing_billing_toggle", { billing_period: "monthly" });
              }}
            >
              Monthly
            </button>
            <button
              className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${annual ? "bg-terracotta text-white" : "text-muted-foreground"}`}
              onClick={() => {
                setAnnual(true);
                trackConversion("pricing_billing_toggle", { billing_period: "annual" });
              }}
            >
              Annual
              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`relative bg-white rounded-2xl border-2 ${tier.color} p-6 flex flex-col shadow-sm`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-terracotta text-white border-0 px-3 py-1 text-xs font-semibold shadow">
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-[#1a2e1a] mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#1a2e1a]">
                    {annual ? getAnnualPrice(tier.price) : tier.price}
                  </span>
                  {tier.price !== "Free" && tier.price !== "Custom" && (
                    <span className="text-sm text-muted-foreground">/mo</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{annual && tier.price !== "Free" && tier.price !== "Custom" ? "billed annually" : tier.priceNote}</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{tier.description}</p>
              </div>

              <a
                href={getCtaHref(tier)}
                target={tier.key === "enterprise" ? "_blank" : undefined}
                rel={tier.key === "enterprise" ? "noreferrer" : undefined}
                onClick={() => trackConversion("pricing_tier_cta_clicked", {
                  tier: tier.key,
                  billing_period: annual ? "annual" : "monthly",
                  destination: tier.key === "enterprise" ? "contact" : "registration",
                })}
              >
                <Button
                  variant={tier.ctaVariant}
                  className={`w-full mb-5 ${tier.ctaVariant === "default" ? "bg-terracotta hover:bg-terracotta/90 text-white" : ""}`}
                >
                  {tier.cta} {tier.key !== "enterprise" && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </a>

              <div className="space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <div key={f.text} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${('isNew' in f) && f.isNew ? "text-amber-500" : "text-green-600"}`} />
                    <span className="text-sm text-foreground leading-snug">
                      {f.text}
                      {('addOn' in f) && f.addOn && (
                        <span className="ml-1 text-xs text-muted-foreground">(add-on)</span>
                      )}
                      {('isNew' in f) && f.isNew && (
                        <Badge className="ml-1.5 bg-amber-500 text-white border-0 text-xs px-1.5 py-0 leading-5 align-middle">New</Badge>
                      )}
                    </span>
                  </div>
                ))}
                {tier.notIncluded.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 opacity-40">
                    <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Sponsorship callout banner */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <FolderHeart className="w-7 h-7 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-[#1a2e1a]">Project &amp; Campaign Sponsorship — now included</h3>
                <Badge className="bg-amber-500 text-white border-0 text-xs">New</Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Growth plans and above now include the ability to create public fundraising campaigns for houses, wells, computers, teachers, events, and more. Each campaign gets a shareable fundraising page with a live progress bar, social sharing buttons, and automatic donor updates when you post news from the field.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Houses & infrastructure", "Clean water wells", "School equipment", "Teacher salaries", "Field trips & events", "Emergency relief"].map((tag) => (
                  <span key={tag} className="text-xs bg-white border border-amber-200 text-amber-800 rounded-full px-2.5 py-1 font-medium">{tag}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
              <Link href="/campaign-preview">
                <Button
                  variant="outline"
                  className="w-full border-amber-400 text-amber-900 hover:bg-amber-100 whitespace-nowrap"
                  onClick={() => trackConversion("pricing_campaign_preview_clicked", { placement: "project_campaign_callout" })}
                >
                  View live campaign preview
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">
                  Start free trial <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1a2e1a] mb-2">Available add-ons</h2>
            <p className="text-muted-foreground">Extend your plan with the features your programme needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ADD_ONS.map((addon) => (
              <div key={addon.name} className="bg-white rounded-xl border border-border p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                  <addon.icon className="w-5 h-5 text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-[#1a2e1a] text-sm">{addon.name}</h3>
                    <span className="text-sm font-bold text-terracotta whitespace-nowrap">{addon.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{addon.description}</p>
                  <Badge variant="outline" className="text-xs">{addon.applicableTo}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto pt-16">
          <h2 className="text-2xl font-bold text-[#1a2e1a] mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I upgrade or downgrade my plan at any time?",
                a: "Yes. You can upgrade at any time and your new features will be available immediately. Downgrades take effect at the end of your current billing period.",
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "All paid plans include a 14-day free trial. No credit card is required to start. You'll only be charged if you choose to continue after the trial.",
              },
              {
                q: "Which plans include project and campaign sponsorship?",
                a: "Project and campaign sponsorship — including public fundraising pages, social sharing, and recurring contributions — is available on Growth, Scale, and Enterprise plans. Starter plan users can upgrade at any time to unlock this feature.",
              },
              {
                q: "Can donors give one-off and recurring contributions to projects?",
                a: "Yes. Every project campaign supports both one-off donations and monthly recurring contributions via Stripe. Donors choose their preference at checkout, and you can see both types in your contributions dashboard.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit and debit cards via Stripe. Enterprise customers can arrange invoice-based billing.",
              },
              {
                q: "Is my data secure and GDPR compliant?",
                a: "Yes. SponsorBridge is built with child protection and data privacy at its core. All data is encrypted at rest and in transit, and the platform is designed to meet GDPR and COPPA requirements.",
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data remains accessible for 30 days after cancellation. You can export all records at any time. After 30 days, data is securely deleted in accordance with our retention policy.",
              },
              {
                q: "Do you offer discounts for registered charities?",
                a: "Yes. Registered not-for-profit organisations may be eligible for a discount. Please contact us with your charity registration details.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-[#1a2e1a] mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#1a2e1a] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to bridge the gap?</h2>
          <p className="text-white/70 mb-8">
            Join organisations already using SponsorBridge to connect sponsors with children, fund community projects, and transform lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button className="bg-terracotta hover:bg-terracotta/90 text-white px-8 h-12 text-base">
                Create free account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="mailto:hello@sponsorbridge.com">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-12 text-base bg-transparent">
                Talk to sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a2e1a] border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-6 h-6 rounded object-contain"
            />
            <span className="text-white/60 text-sm">© {new Date().getFullYear()} SponsorBridge. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/"><span className="text-white/50 text-sm hover:text-white/80 cursor-pointer">Home</span></Link>
            <a href="/terms" className="text-white/50 text-sm hover:text-white/80">Terms</a>
            <a href="/privacy" className="text-white/50 text-sm hover:text-white/80">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
