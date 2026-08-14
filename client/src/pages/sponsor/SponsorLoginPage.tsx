/**
 * SponsorLoginPage
 * Clean split-screen login for the sponsor self-service portal.
 * Supports email/password and OTP magic link.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, Lock, ArrowRight, Loader2, KeyRound } from "lucide-react";

type Mode = "password" | "otp-request" | "otp-verify";

export default function SponsorLoginPage() {
  const [, navigate] = useLocation();
  const { login, requestOtp, verifyOtp, isAuthenticated } = useSponsorAuth();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect after render to avoid a render-phase navigation.
  useEffect(() => {
    if (isAuthenticated) navigate("/sponsor/dashboard");
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/sponsor/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestOtp(email);
      setMode("otp-verify");
      setSuccess("A 6-digit code has been sent to your email.");
    } catch (err: any) {
      setError(err.message ?? "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate("/sponsor/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — warm terracotta */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#C1440E] to-[#a03508] flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-2.5" aria-label="SponsorBridge">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <img src="/manus-storage/sb-icon-mark_f15604c9.svg" alt="" className="h-7 w-7" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">SponsorBridge</span>
          </div>
        </div>
        <div className="space-y-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Welcome back,<br />dear sponsor.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Sign in to see the latest updates on your sponsored child, review your giving history, and send a message of encouragement.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l) => (
                <div key={l} className="w-9 h-9 rounded-full bg-white/30 border-2 border-white flex items-center justify-center text-xs font-bold">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-sm">Join thousands of sponsors making a difference</p>
          </div>
        </div>
        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} SponsorBridge. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fdf8f5]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <div className="flex items-center gap-2" aria-label="SponsorBridge">
              <img src="/manus-storage/sb-icon-mark_f15604c9.svg" alt="" className="h-8 w-8" />
              <span className="text-base font-bold tracking-tight text-[#1a3a2e]">SponsorBridge</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1a3a2e]">
              {mode === "otp-verify" ? "Enter your code" : "Sign in to your portal"}
            </h2>
            <p className="text-[#8a7060] mt-1 text-sm">
              {mode === "otp-verify"
                ? `We sent a 6-digit code to ${email}`
                : "Access your sponsorship dashboard"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              {success}
            </div>
          )}

          {/* Password login form */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#1a3a2e] font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 border-[#d4c4b8] focus:border-[#C1440E] focus:ring-[#C1440E]/20 bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[#1a3a2e] font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10 border-[#d4c4b8] focus:border-[#C1440E] focus:ring-[#C1440E]/20 bg-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C1440E] hover:bg-[#a03508] text-white font-semibold py-2.5 transition-all duration-150 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign in
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e8ddd5]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#fdf8f5] px-3 text-[#8a7060]">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setMode("otp-request"); setError(""); }}
                className="w-full border-[#d4c4b8] text-[#4a3728] hover:bg-[#f0e8e0] bg-white"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Sign in with a magic code
              </Button>
            </form>
          )}

          {/* OTP request form */}
          {mode === "otp-request" && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email-otp" className="text-[#1a3a2e] font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7060]" />
                  <Input
                    id="email-otp"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 border-[#d4c4b8] focus:border-[#C1440E] focus:ring-[#C1440E]/20 bg-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C1440E] hover:bg-[#a03508] text-white font-semibold py-2.5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send sign-in code
              </Button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className="w-full text-sm text-[#8a7060] hover:text-[#C1440E] transition-colors"
              >
                ← Back to password sign-in
              </button>
            </form>
          )}

          {/* OTP verify form */}
          {mode === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-[#1a3a2e] font-medium">6-digit code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="text-center text-2xl tracking-[0.5em] font-mono border-[#d4c4b8] focus:border-[#C1440E] focus:ring-[#C1440E]/20 bg-white"
                />
                <p className="text-xs text-[#8a7060]">Code expires in 15 minutes</p>
              </div>
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#C1440E] hover:bg-[#a03508] text-white font-semibold py-2.5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify and sign in
              </Button>
              <button
                type="button"
                onClick={() => { setMode("otp-request"); setOtp(""); setError(""); setSuccess(""); }}
                className="w-full text-sm text-[#8a7060] hover:text-[#C1440E] transition-colors"
              >
                Resend code
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#8a7060]">
            Not a sponsor?{" "}
            <a href="/" className="text-[#C1440E] hover:underline font-medium">
              Learn about SponsorBridge
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
