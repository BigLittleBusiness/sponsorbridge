import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart, ArrowRight, ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Globe, Users } from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  orgName: z.string().min(2, "Organisation name is required"),
  orgCountry: z.string().min(2, "Country is required"),
  orgWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  orgSize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  planTier: z.enum(["starter", "growth", "professional", "enterprise"]),
  agreedToTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── OTP Step ────────────────────────────────────────────────────────────────

function OtpStep({ email, onSuccess }: { email: string; onSuccess: () => void }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { refetch } = useCustomAuth();

  const handleVerify = async () => {
    if (otp.length !== 6) return toast.error("Please enter the 6-digit code");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Verification failed");
      await refetch();
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) toast.success("A new code has been sent to your email");
      else toast.error(data.error ?? "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
        <ShieldCheck className="w-8 h-8 text-brand-red" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We sent a 6-digit verification code to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>
      <div className="space-y-3">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="text-center text-3xl tracking-[0.5em] font-bold h-16 border-2 focus:border-brand-red"
        />
        <Button
          className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-12 text-base"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Verify & Activate Account
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Didn't receive it?{" "}
        <button
          className="text-brand-red hover:underline font-medium disabled:opacity-50"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
      <p className="text-xs text-muted-foreground">Code expires in 15 minutes</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { planTier: "starter", orgSize: "1-10" },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1Data, ...data }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Registration failed. Please try again.");
        return;
      }
      setRegisteredEmail(step1Data.email);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  const COUNTRIES = [
    "Australia", "New Zealand", "United Kingdom", "United States", "Canada",
    "South Africa", "Kenya", "Uganda", "Tanzania", "Ethiopia", "India",
    "Philippines", "Indonesia", "Brazil", "Colombia", "Mexico", "Germany",
    "France", "Netherlands", "Sweden", "Norway", "Denmark", "Other",
  ];

  const PLAN_LABELS: Record<string, string> = {
    starter: "Starter — Free",
    growth: "Growth — $99/month",
    professional: "Professional — $249/month",
    enterprise: "Enterprise — Contact us",
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1a2e1a] flex-col justify-between p-12">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <img
              src="/manus-storage/sb-icon-mark_d802f749.png"
              alt="SponsorBridge"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-white font-bold text-xl">SponsorBridge</span>
          </span>
        </Link>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Give your charity the tools it deserves.
            </h2>
            <p className="text-white/60 mt-3 text-base">
              Join hundreds of organisations already using SponsorBridge to connect sponsors with children and transform lives.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: "Child protection built in from day one" },
              { icon: Globe, text: "Multi-language sponsor communications" },
              { icon: Users, text: "7 role-based access levels for your team" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-red" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} SponsorBridge. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= s ? "bg-brand-red text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-sm ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {s === 1 ? "Your details" : "Organisation"}
                  </span>
                  {s < 2 && <div className="w-8 h-px bg-border mx-1" />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Personal details */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Already have an account?{" "}
                  <Link href="/login" className="text-brand-red hover:underline font-medium">Sign in</Link>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input id="firstName" {...form1.register("firstName")} placeholder="Jane" />
                  {form1.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{form1.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input id="lastName" {...form1.register("lastName")} placeholder="Smith" />
                  {form1.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{form1.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" {...form1.register("jobTitle")} placeholder="Programme Director" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Work email address *</Label>
                <Input id="email" type="email" {...form1.register("email")} placeholder="jane@yourcharity.org" />
                {form1.formState.errors.email && (
                  <p className="text-xs text-destructive">{form1.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" {...form1.register("phone")} placeholder="+61 400 000 000" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...form1.register("password")} placeholder="Min. 8 characters" />
                {form1.formState.errors.password && (
                  <p className="text-xs text-destructive">{form1.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Must be at least 8 characters with one uppercase letter and one number.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password *</Label>
                <Input id="confirmPassword" type="password" {...form1.register("confirmPassword")} placeholder="Repeat your password" />
                {form1.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form1.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-12 text-base">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Step 2: Organisation details */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">About your organisation</h1>
                <p className="text-muted-foreground text-sm mt-1">Tell us about the charity you represent.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organisation name *</Label>
                <Input id="orgName" {...form2.register("orgName")} placeholder="Hope for Children Foundation" />
                {form2.formState.errors.orgName && (
                  <p className="text-xs text-destructive">{form2.formState.errors.orgName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Country of operation *</Label>
                <Select onValueChange={(v) => form2.setValue("orgCountry", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form2.formState.errors.orgCountry && (
                  <p className="text-xs text-destructive">{form2.formState.errors.orgCountry.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgWebsite">Website</Label>
                <Input id="orgWebsite" {...form2.register("orgWebsite")} placeholder="https://yourcharity.org" />
                {form2.formState.errors.orgWebsite && (
                  <p className="text-xs text-destructive">{form2.formState.errors.orgWebsite.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Organisation size *</Label>
                  <Select defaultValue="1-10" onValueChange={(v) => form2.setValue("orgSize", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1–10 staff</SelectItem>
                      <SelectItem value="11-50">11–50 staff</SelectItem>
                      <SelectItem value="51-200">51–200 staff</SelectItem>
                      <SelectItem value="200+">200+ staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Plan *</Label>
                  <Select defaultValue="starter" onValueChange={(v) => form2.setValue("planTier", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                <Checkbox
                  id="terms"
                  onCheckedChange={(checked) => form2.setValue("agreedToTerms", checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a href="/terms" className="text-brand-red hover:underline" target="_blank">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-brand-red hover:underline" target="_blank">Privacy Policy</a>
                  , and confirm that our organisation complies with applicable child protection legislation.
                </Label>
              </div>
              {form2.formState.errors.agreedToTerms && (
                <p className="text-xs text-destructive">{form2.formState.errors.agreedToTerms.message}</p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white h-12 text-base"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: OTP verification */}
          {step === 3 && (
            <OtpStep
              email={registeredEmail}
              onSuccess={() => navigate("/onboarding")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
