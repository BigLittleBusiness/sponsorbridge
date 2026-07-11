import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Building2,
  Baby,
  Users,
  Shield,
  CreditCard,
  ArrowRight,
  Heart,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  cta: string;
  completed: boolean;
}

interface ChecklistSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  items: ChecklistItem[];
}

const INITIAL_SECTIONS: ChecklistSection[] = [
  {
    id: "org",
    icon: Building2,
    title: "Set up your organisation",
    subtitle: "Tell us about your charity so sponsors can trust you",
    color: "text-trust-blue",
    bg: "bg-blue-50",
    items: [
      {
        id: "org-profile",
        title: "Complete your organisation profile",
        description:
          "Add your charity's full name, registration number, mission statement, country of operation, and contact details.",
        href: "/settings/tenant",
        cta: "Go to settings",
        completed: false,
      },
      {
        id: "org-logo",
        title: "Upload your logo and branding",
        description:
          "Upload your charity logo and set your brand colours. These appear on all sponsor-facing communications.",
        href: "/settings/tenant",
        cta: "Upload logo",
        completed: false,
      },
      {
        id: "org-safeguarding",
        title: "Acknowledge the Child Protection Policy",
        description:
          "All staff must acknowledge SponsorBridge's Child Protection Policy before accessing the platform.",
        href: "/policy",
        cta: "Review policy",
        completed: false,
      },
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Invite your team",
    subtitle: "Add staff with the right roles and permissions",
    color: "text-purple-600",
    bg: "bg-purple-50",
    items: [
      {
        id: "team-admin",
        title: "Invite a Program Manager",
        description:
          "Program Managers can add children, manage sponsorships, and approve vlogs. Invite at least one before adding children.",
        href: "/settings/users",
        cta: "Invite team members",
        completed: false,
      },
      {
        id: "team-safeguarding",
        title: "Assign a Safeguarding Officer",
        description:
          "Every organisation must designate a Safeguarding Officer responsible for incident management and child protection oversight.",
        href: "/settings/users",
        cta: "Assign officer",
        completed: false,
      },
    ],
  },
  {
    id: "children",
    icon: Baby,
    title: "Add your first child record",
    subtitle: "Create a child profile ready for sponsorship matching",
    color: "text-terracotta",
    bg: "bg-red-50",
    items: [
      {
        id: "child-first",
        title: "Add your first child profile",
        description:
          "Create a child record with their name, age, location, education level, and a brief story. This is what sponsors will see.",
        href: "/children/new",
        cta: "Add a child",
        completed: false,
      },
      {
        id: "child-consent",
        title: "Upload consent documentation",
        description:
          "Upload signed consent forms from the child's guardian before the profile can be made available for sponsorship.",
        href: "/safeguarding/consent",
        cta: "Manage consent",
        completed: false,
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Set up payments",
    subtitle: "Connect Stripe to start receiving sponsorship payments",
    color: "text-golden-nectar",
    bg: "bg-amber-50",
    items: [
      {
        id: "payments-stripe",
        title: "Connect your Stripe account",
        description:
          "Link your Stripe account to receive monthly sponsorship payments directly. Stripe handles all card processing securely.",
        href: "/payments",
        cta: "Connect Stripe",
        completed: false,
      },
      {
        id: "payments-plan",
        title: "Review your subscription plan",
        description:
          "Make sure your SponsorBridge plan supports the number of sponsors and children you plan to manage.",
        href: "/pricing",
        cta: "View plans",
        completed: false,
      },
    ],
  },
  {
    id: "safeguarding",
    icon: Shield,
    title: "Complete safeguarding setup",
    subtitle: "Ensure your programme meets child protection requirements",
    color: "text-sage",
    bg: "bg-green-50",
    items: [
      {
        id: "sg-background",
        title: "Submit background check requests",
        description:
          "All staff and volunteers who interact with children or their data must have a current background check on file.",
        href: "/safeguarding/background-checks",
        cta: "Manage checks",
        completed: false,
      },
      {
        id: "sg-incident",
        title: "Review the incident reporting workflow",
        description:
          "Familiarise yourself with how to log and escalate safeguarding incidents. This is required before going live.",
        href: "/safeguarding/incidents",
        cta: "View incidents",
        completed: false,
      },
    ],
  },
];

const STORAGE_KEY = "sponsorbridge_onboarding_v1";

export default function OnboardingChecklist() {
  const { account, loading: authLoading, markOnboardingComplete } = useCustomAuth();
  const [, navigate] = useLocation();
  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedData = JSON.parse(saved) as Record<string, boolean>;
        return INITIAL_SECTIONS.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            completed: savedData[item.id] ?? false,
          })),
        }));
      }
    } catch {
      // ignore
    }
    return INITIAL_SECTIONS;
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ org: true });

  useEffect(() => {
    if (!authLoading && !account) {
      navigate("/login");
    }
  }, [account, authLoading, navigate]);

  const allItems = sections.flatMap((s) => s.items);
  const completedCount = allItems.filter((i) => i.completed).length;
  const totalCount = allItems.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  const toggleItem = (sectionId: string, itemId: string) => {
    setSections((prev) => {
      const updated = prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : section
      );
      // Persist to localStorage
      const completedMap: Record<string, boolean> = {};
      updated.forEach((s) => s.items.forEach((i) => { completedMap[i.id] = i.completed; }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedMap));
      return updated;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleFinish = async () => {
    if (!allDone) {
      toast.warning("Please complete all checklist items before proceeding.");
      return;
    }
    await markOnboardingComplete();
    toast.success("Setup complete! Welcome to SponsorBridge.");
    navigate("/org-dashboard");
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    navigate("/org-dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Nav */}
      <nav className="bg-[#1a2e1a] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-bold">SponsorBridge</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            Skip for now
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-golden-nectar" />
            <Badge className="bg-golden-nectar/20 text-golden-nectar border-golden-nectar/30">
              Getting started
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2e1a] mb-1">
            Welcome to SponsorBridge{account ? `, ${account.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Complete these steps to get <strong>{account?.orgName}</strong> ready to manage your
            child sponsorship programme. You can always come back to finish later.
          </p>
        </div>

        {/* Progress */}
        <Card className={`border-border shadow-sm mb-6 overflow-hidden ${allDone ? "border-green-300" : ""}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm font-semibold text-[#1a2e1a]">
                  {allDone ? "✅ Setup complete!" : "Setup progress"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allDone
                    ? "Your organisation is ready to manage child sponsorships."
                    : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? "s" : ""} remaining to go live`}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className={`text-4xl font-bold tabular-nums leading-none ${
                  allDone ? "text-green-600" : progressPct >= 60 ? "text-[#1e3a5f]" : "text-[#c8a96e]"
                }`}>
                  {progressPct}%
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{completedCount} of {totalCount} steps</p>
              </div>
            </div>
            {/* Main progress bar */}
            <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  allDone
                    ? "bg-green-500"
                    : progressPct >= 66
                    ? "bg-[#1e3a5f]"
                    : progressPct >= 33
                    ? "bg-[#c8a96e]"
                    : "bg-terracotta"
                }`}
                style={{ width: `${progressPct}%` }}
              />
              {/* Milestone tick marks */}
              {[33, 66].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-0 bottom-0 w-px bg-white/60"
                  style={{ left: `${pct}%` }}
                />
              ))}
            </div>
            {/* Per-section mini progress */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {sections.map((section) => {
                const done = section.items.filter((i) => i.completed).length;
                const total = section.items.length;
                const pct = Math.round((done / total) * 100);
                return (
                  <div key={section.id} className="text-center">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct === 100 ? "bg-green-500" : "bg-[#c8a96e]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-none">{done}/{total}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionCompleted = section.items.filter((i) => i.completed).length;
            const sectionTotal = section.items.length;
            const isExpanded = expanded[section.id] ?? false;
            const allSectionDone = sectionCompleted === sectionTotal;

            return (
              <Card key={section.id} className={`border-border shadow-sm overflow-hidden ${allSectionDone ? "border-green-200" : ""}`}>
                <button
                  className="w-full text-left"
                  onClick={() => toggleSection(section.id)}
                >
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${section.bg} flex items-center justify-center`}>
                          {allSectionDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <section.icon className={`w-5 h-5 ${section.color}`} />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-[#1a2e1a]">
                            {section.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{section.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs ${allSectionDone ? "border-green-300 text-green-700 bg-green-50" : "border-border text-muted-foreground"}`}
                        >
                          {sectionCompleted}/{sectionTotal}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            item.completed
                              ? "border-green-200 bg-green-50"
                              : "border-border bg-white hover:border-brand-red/30"
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(section.id, item.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground/40" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : "text-[#1a2e1a]"}`}>
                              {item.title}
                            </p>
                            {!item.completed && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {!item.completed && item.href && (
                            <Link href={item.href}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 text-xs border-brand-red/30 text-brand-red hover:bg-brand-red/5"
                              >
                                {item.cta}
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <p className="text-xs text-muted-foreground">
            You can complete remaining steps from your dashboard at any time.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Finish later
            </Button>
            <Button
              onClick={handleFinish}
              className={`${allDone ? "bg-brand-red hover:bg-brand-red/90" : "bg-muted text-muted-foreground cursor-not-allowed"} text-white`}
              disabled={!allDone}
            >
              Go to dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
