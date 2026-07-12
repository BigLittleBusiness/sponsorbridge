import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Shield,
  ShieldCheck,
  Users,
  Video,
  Zap,
  Globe,
  Baby,
} from "lucide-react";
import { Link } from "wouter";
import { useCustomAuth } from "@/contexts/CustomAuthContext";

const FEATURES = [
  {
    icon: Users,
    title: "Multi-Tenant Architecture",
    description:
      "Each charity operates in a fully isolated environment with white-label branding, custom domains, and subdomain routing.",
    color: "text-trust-blue",
    bg: "bg-blue-50",
  },
  {
    icon: Baby,
    title: "Child Profile Management",
    description:
      "Comprehensive profiles with photo uploads, education and health tracking, consent management, and a clear AVAILABLE → SPONSORED → GRADUATED workflow.",
    color: "text-terracotta",
    bg: "bg-red-50",
  },
  {
    icon: Zap,
    title: "Smart 90-Day Onboarding",
    description:
      "Automated nurture sequences fire on Days 1, 3, 7, 14, 30, and 90 — building the sponsor relationship from the very first moment.",
    color: "text-golden-nectar",
    bg: "bg-amber-50",
  },
  {
    icon: Video,
    title: "Moderated Vlog System",
    description:
      "Field workers upload vlogs from the field. Every video passes through a charity moderation queue before reaching sponsors.",
    color: "text-sage",
    bg: "bg-green-50",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description:
      "All sponsor–child communications are moderated before delivery. Auto-translation bridges language barriers across your programme.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Child Protection First",
    description:
      "Immutable audit trails, safeguarding incident management, consent tracking, GDPR compliance, and emergency disclosure protocols built in by design.",
    color: "text-trust-blue",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Retention Analytics",
    description:
      "NPS and CSAT surveys, churn prediction, 4-step re-engagement campaigns, and cohort analysis to maximise sponsor lifetime value.",
    color: "text-terracotta",
    bg: "bg-red-50",
  },
  {
    icon: ShieldCheck,
    title: "7 Role-Based Access Levels",
    description:
      "System Admin, Program Manager, Safeguarding Officer, Field Worker, Finance Officer, Sponsor Relations, and Volunteer — each with granular permissions.",
    color: "text-sage",
    bg: "bg-green-50",
  },
];

const STATS = [
  { value: "7", label: "Defined Staff Roles" },
  { value: "90", label: "Day Onboarding Sequence" },
  { value: "100%", label: "Moderated Communications" },
  { value: "GDPR", label: "& COPPA Compliant" },
];

// Research-accurate comparison:
// Large orgs (World Vision, Compassion, Plan International) genuinely have:
//   child selector/browse, sponsor app, auto-translated correspondence, trust badges, community impact stats
// Large orgs do NOT have (confirmed by research):
//   moderated vlogs, NPS/CSAT surveys, RBAC with defined roles, incident management, immutable audit trail,
//   white-label multi-tenancy, churn prediction, or 90-day structured onboarding sequences
const COMPARISON: { feature: string; large: boolean; small: boolean; note?: string }[] = [
  { feature: "Child profile browse & selector", large: true, small: false },
  { feature: "Sponsor app with giving history", large: true, small: false },
  { feature: "Auto-translated correspondence", large: true, small: false },
  { feature: "Community impact statistics", large: true, small: false },
  { feature: "Structured 90-day onboarding sequence", large: false, small: false, note: "Built in-house at enormous cost" },
  { feature: "Moderated vlog system", large: false, small: false },
  { feature: "Role-based access control (7 roles)", large: false, small: false },
  { feature: "Safeguarding incident management", large: false, small: false },
  { feature: "Retention analytics & NPS surveys", large: false, small: false },
  { feature: "White-label multi-tenancy", large: false, small: false },
  { feature: "Immutable audit trail", large: false, small: false },
  { feature: "Churn prediction & re-engagement", large: false, small: false },
];

export default function Home() {
  const { account } = useCustomAuth();

  return (
    <div className="min-h-screen bg-warm-linen">
      {/* Navigation */}
      <nav className="bg-midnight-slate/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-bold text-white text-lg">SponsorBridge</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing">
              <span className="text-white/70 hover:text-white text-sm font-medium cursor-pointer transition-colors">
                Pricing
              </span>
            </Link>
            <a href="mailto:hello@sponsorbridge.com" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            {account ? (
              <Link href="/org-dashboard">
                <Button size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
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
      <section className="gradient-hero text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-terracotta blur-3xl" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-terracotta/20 text-terracotta border-terracotta/30 text-sm">
              Purpose-built for child sponsorship charities
            </Badge>
            <h1 className="text-5xl font-bold leading-tight mb-6 font-serif">
              The platform that empowers child sponsorship charities.
            </h1>
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              SponsorBridge gives smaller charities the same sophisticated tools that the world's largest child sponsorship organisations use — at a fraction of the cost. Multi-tenant, white-label, and built with child protection at its core.
            </p>
            <div className="flex flex-wrap gap-4">
              {account ? (
                <Link href="/org-dashboard">
                  <Button
                    size="lg"
                    className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-8"
                  >
                    Open Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-8"
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="text-white/50 text-sm mt-4">
              Free plan available · No credit card required · Set up in minutes
            </p>
          </div>
        </div>
      </section>

      {/* Hero image strip */}
      <section className="relative overflow-hidden bg-[#1a2e1a]" style={{ height: 420 }}>
        <img
          src="/manus-storage/hero-connection_aabce0a0.jpg"
          alt="A smiling child in a village — the face of child sponsorship"
          className="w-full h-full object-cover opacity-60"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <blockquote className="max-w-lg">
              <p className="text-white text-2xl font-serif font-medium leading-relaxed mb-4">
                &ldquo;Every child deserves a champion. SponsorBridge helps charities find them — and keep them.&rdquo;
              </p>
              <cite className="text-white/60 text-sm not-italic">— Built for the organisations changing lives every day</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-border py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-terracotta mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-serif mb-3">
              Everything a charity needs to grow
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From child profiles to donor retention analytics — SponsorBridge covers the full
              sponsorship lifecycle with child protection built in at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="card-hover border-border">
                <CardContent className="pt-6">
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#1e3a5f]/10 text-[#1e3a5f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl font-bold font-serif mb-3">Up and running in three steps</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              SponsorBridge is designed to be simple to set up and powerful to operate — no technical expertise required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-[#1e3a5f]/20 via-[#1e3a5f]/40 to-[#1e3a5f]/20" />
            {([
              {
                step: "01",
                emoji: "🏢",
                title: "Set up your organisation",
                description: "Create your account, configure your branding, and add your team members with the right roles and permissions in minutes.",
              },
              {
                step: "02",
                emoji: "👧",
                title: "Add children and match sponsors",
                description: "Upload child profiles with photos, education and health records. Our two-way matching engine connects sponsors with the right child based on preferences.",
              },
              {
                step: "03",
                emoji: "📊",
                title: "Track impact and retain sponsors",
                description: "Sponsors receive automated updates, vlogs, and personalised impact reports. Built-in analytics and NPS surveys help you identify and act on churn risk early.",
              },
            ] as const).map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200">
                <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f] flex items-center justify-center text-2xl mb-5 shadow-md">
                  {item.emoji}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#c8a96e] flex items-center justify-center text-white text-xs font-bold shadow">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register">
              <Button className="bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-8 py-3 h-auto rounded-xl">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-serif mb-3">
              Close the gap between large and small charities
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The world's largest child sponsorship organisations have invested millions in
              proprietary technology. SponsorBridge makes those same capabilities accessible to
              every organisation.
            </p>
          </div>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground w-1/2">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Large orgs
                    <div className="text-xs font-normal text-muted-foreground">(World Vision, Compassion)</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Without SponsorBridge
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-terracotta">
                    With SponsorBridge
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border ${i % 2 === 0 ? "bg-warm-linen/30" : ""}`}
                  >
                    <td className="py-3 px-4 text-foreground">
                      <span>{row.feature}</span>
                      {row.note && (
                        <span className="block text-xs text-muted-foreground mt-0.5 italic">{row.note}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.large ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/40 text-lg leading-none">✗</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground/40 text-lg leading-none">
                      ✗
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Based on published features of World Vision, Compassion International, and Plan International as of 2025.
            </p>
          </div>
        </div>
      </section>

      {/* Sponsor connection image section */}
      <section className="py-0 overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[400px]">
          <div className="relative">
            <img
              src="/manus-storage/sponsor-watching_2407f809.jpg"
              alt="A sponsor watching a video update from their sponsored child on a tablet"
              className="w-full h-full object-cover"
              style={{ minHeight: 360 }}
            />
          </div>
          <div className="bg-[#1a2e1a] flex items-center px-10 py-16">
            <div>
              <Badge className="mb-4 bg-terracotta/20 text-terracotta border-terracotta/30">
                Real connections, every month
              </Badge>
              <h2 className="text-3xl font-bold font-serif text-white mb-4 leading-tight">
                Sponsors who feel connected stay for years, not months.
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                SponsorBridge's moderated vlog system, personalised impact reports, and 90-day onboarding sequence transform one-time donors into lifelong champions for the children they support.
              </p>
              <div className="space-y-2">
                {["Monthly video updates from the field", "Personalised impact dashboards", "Secure two-way messaging", "Automated retention campaigns"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Child protection callout */}
      <section className="bg-midnight-slate text-white py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-trust-blue/20 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-trust-blue" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 font-serif">
                Child protection is not optional — it's foundational.
              </h2>
              <p className="text-white/70 leading-relaxed">
                Every feature in SponsorBridge is designed with safeguarding by default. Immutable
                audit trails, moderated communications, emergency disclosure protocols, GDPR and
                COPPA compliance, and a dedicated Safeguarding Officer role ensure that the children
                in your programme are always protected.
              </p>
            </div>
            <div className="shrink-0">
              <div className="flex flex-col gap-2">
                {[
                  "Immutable audit logs",
                  "Emergency disclosure protocol",
                  "Moderated all communications",
                  "GDPR & COPPA compliant",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform mockup section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-sage/10 text-sage border-sage/30">See it in action</Badge>
            <h2 className="text-3xl font-bold font-serif mb-3">A platform built for the way charities actually work</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From the dashboard to safeguarding reports, every screen is designed for clarity, speed, and child protection compliance.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border max-w-5xl mx-auto">
            <img
              src="/manus-storage/platform-mockup_c956cc1c.jpg"
              alt="SponsorBridge platform dashboard showing child profiles, sponsor management, and analytics"
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {["Child profiles", "Sponsor matching", "Vlog moderation", "Retention analytics", "Safeguarding"].map((tag) => (
                  <Badge key={tag} className="bg-white/20 text-white border-white/30 backdrop-blur-sm">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 bg-warm-linen">
        <div className="container text-center">
          <h2 className="text-3xl font-bold font-serif mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Start free and scale as your programme grows. No hidden fees, no lock-in contracts.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { name: "Starter", price: "Free", note: "Up to 50 sponsors" },
              { name: "Growth", price: "$99/mo", note: "Up to 500 sponsors" },
              { name: "Scale", price: "$249/mo", note: "Up to 2,000 sponsors" },
              { name: "Enterprise", price: "Custom", note: "Unlimited" },
            ].map((tier) => (
              <div
                key={tier.name}
                className="bg-white rounded-xl border border-border p-5 text-left"
              >
                <div className="font-semibold text-foreground mb-1">{tier.name}</div>
                <div className="text-xl font-bold text-terracotta mb-1">{tier.price}</div>
                <div className="text-xs text-muted-foreground">{tier.note}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing">
            <Button
              size="lg"
              variant="outline"
              className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white px-8"
            >
              See full pricing details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight-slate text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold font-serif mb-4">Ready to bridge the gap?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Give your charity the tools it needs to acquire more sponsors, retain them longer, and
            protect every child in your programme.
          </p>
          {account ? (
            <Link href="/org-dashboard">
              <Button
                size="lg"
                className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-10"
              >
                Open Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-10"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent px-10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-midnight-slate border-t border-white/10 text-white/50 py-8 text-sm">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-6 h-6 rounded object-contain"
            />
            <span>SponsorBridge — The platform that empowers child sponsorship charities.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing">
              <span className="hover:text-white/80 cursor-pointer transition-colors">Pricing</span>
            </Link>
            <a href="/terms" className="hover:text-white/80 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy</a>
            <a href="mailto:hello@sponsorbridge.com" className="hover:text-white/80 transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} SponsorBridge. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
