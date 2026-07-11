import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Heart,
  MessageSquare,
  Shield,
  ShieldCheck,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: Users,
    title: "Multi-Tenant Architecture",
    description: "Each charity operates in a fully isolated environment with white-label branding, custom domains, and subdomain routing.",
    color: "text-trust-blue",
    bg: "bg-blue-50",
  },
  {
    icon: Heart,
    title: "Child Profile Management",
    description: "Comprehensive profiles with photo uploads, education and health tracking, consent management, and a clear AVAILABLE → SPONSORED → GRADUATED workflow.",
    color: "text-terracotta",
    bg: "bg-red-50",
  },
  {
    icon: Zap,
    title: "Smart 90-Day Onboarding",
    description: "Automated nurture sequences fire on Days 1, 3, 7, 14, 30, and 90 — building the sponsor relationship from the very first moment.",
    color: "text-golden-nectar",
    bg: "bg-amber-50",
  },
  {
    icon: Video,
    title: "Moderated Vlog System",
    description: "Field workers upload vlogs from the field. Every video passes through a charity moderation queue before reaching sponsors.",
    color: "text-sage",
    bg: "bg-green-50",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "All sponsor–child communications are moderated before delivery. Auto-translation via Google Translate bridges language barriers.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Child Protection First",
    description: "Immutable audit trails, safeguarding incident management, consent tracking, GDPR compliance, and emergency disclosure protocols built in by design.",
    color: "text-trust-blue",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Retention Analytics",
    description: "NPS and CSAT surveys, ML-powered churn prediction, 4-step re-engagement campaigns, and cohort analysis to maximise sponsor lifetime value.",
    color: "text-terracotta",
    bg: "bg-red-50",
  },
  {
    icon: ShieldCheck,
    title: "7 Role-Based Access Levels",
    description: "System Admin, Program Manager, Safeguarding Officer, Field Worker, Finance Officer, Sponsor Relations, and Volunteer — each with granular permissions.",
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

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-warm-linen">
      {/* Navigation */}
      <nav className="bg-midnight-slate/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">SponsorBridge</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => startLogin()} className="bg-terracotta hover:bg-terracotta/90 text-white">
                Sign In
              </Button>
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
              B2B SaaS for Child Sponsorship Charities
            </Badge>
            <h1 className="text-5xl font-bold leading-tight mb-6 font-serif">
              The platform that empowers child sponsorship charities.
            </h1>
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              SponsorBridge gives smaller charities the same sophisticated tools that World Vision and Compassion International use — at a fraction of the cost. Multi-tenant, white-label, and built with child protection at its core.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-8">
                    Open Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={() => startLogin()} className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-8">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
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
            <h2 className="text-3xl font-bold font-serif mb-3">Everything a charity needs to grow</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From child profiles to donor retention analytics — SponsorBridge covers the full sponsorship lifecycle with child protection built in at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="card-hover border-border">
                <CardContent className="pt-6">
                  <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
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
              <h2 className="text-2xl font-bold mb-3 font-serif">Child protection is not optional — it's foundational.</h2>
              <p className="text-white/70 leading-relaxed">
                Every feature in SponsorBridge is designed with safeguarding by default. Immutable audit trails, moderated communications, emergency disclosure protocols, GDPR and COPPA compliance, and a dedicated Safeguarding Officer role ensure that the children in your programme are always protected.
              </p>
            </div>
            <div className="shrink-0">
              <div className="flex flex-col gap-2">
                {["Immutable audit logs", "Emergency disclosure protocol", "Moderated all communications", "GDPR & COPPA compliant"].map((item) => (
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

      {/* CTA */}
      <section className="py-20 bg-warm-linen">
        <div className="container text-center">
          <h2 className="text-3xl font-bold font-serif mb-4">Ready to bridge the gap?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Give your charity the tools it needs to acquire more sponsors, retain them longer, and protect every child in your programme.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-10">
                Open Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={() => startLogin()} className="bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-10">
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-midnight-slate text-white/50 py-8 text-sm">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-terracotta" />
            <span>SponsorBridge — The platform that empowers child sponsorship charities.</span>
          </div>
          <div>© {new Date().getFullYear()} SponsorBridge. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
