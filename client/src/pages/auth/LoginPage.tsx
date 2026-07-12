import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Loader2, ShieldCheck } from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const { refetch } = useCustomAuth();
  const [, navigate] = useLocation();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.needsVerification) {
          setNeedsVerification(result.email);
          return;
        }
        toast.error(result.error ?? "Login failed. Please check your credentials.");
        return;
      }
      await refetch();
      // Route based on onboarding status
      if (result.account?.onboardingCompletedAt) {
        navigate("/org-dashboard");
      } else {
        navigate("/onboarding");
      }
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold">Email not yet verified</h2>
          <p className="text-muted-foreground text-sm">
            Your account for <strong>{needsVerification}</strong> has not been verified yet. Please check your email for the verification code.
          </p>
          <Button
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white"
            onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(needsVerification)}`)}
          >
            Enter Verification Code
          </Button>
          <button
            className="text-sm text-muted-foreground hover:text-foreground underline"
            onClick={() => setNeedsVerification(null)}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1a2e1a] flex-col justify-between p-12">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <img
              src="/manus-storage/sb-icon-mark-v2_6799b40d.png"
              alt="SponsorBridge"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-white font-bold text-xl">SponsorBridge</span>
          </span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Welcome back.
          </h2>
          <p className="text-white/60 text-base">
            Sign in to manage your child sponsorship programme, review sponsor activity, and keep your organisation running smoothly.
          </p>
        </div>
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} SponsorBridge. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img
              src="/manus-storage/sb-icon-mark-v2_6799b40d.png"
              alt="SponsorBridge"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-bold text-xl">SponsorBridge</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Don't have an account?{" "}
                <Link href="/register" className="text-brand-red hover:underline font-medium">Create one free</Link>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="jane@yourcharity.org"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-brand-red hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-12 text-base"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By signing in you agree to our{" "}
              <a href="/terms" className="hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
