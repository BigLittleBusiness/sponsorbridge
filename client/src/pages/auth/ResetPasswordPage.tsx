import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One number", pass: /[0-9]/.test(password) },
    { label: "One special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][score];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? strengthColor : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span className={`text-xs font-medium ${score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-destructive"}`}>
          {strengthLabel}
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-green-600" : "text-muted-foreground"}`}>
            {c.pass ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(d.valid === true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1a2e1a] flex-col justify-between p-12">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold text-xl">SponsorBridge</span>
          </span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Choose a new password
          </h2>
          <p className="text-white/60 text-base">
            Create a strong, unique password for your SponsorBridge account. Use a mix of letters, numbers, and symbols.
          </p>
        </div>
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} SponsorBridge. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-xl">SponsorBridge</span>
          </div>

          {/* Loading token validation */}
          {tokenValid === null && (
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-red mx-auto" />
              <p className="text-muted-foreground">Validating your reset link...</p>
            </div>
          )}

          {/* Invalid / expired token */}
          {tokenValid === false && (
            <div className="space-y-5">
              <div>
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <XCircle className="w-7 h-7 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Link expired or invalid</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  This password reset link is no longer valid. Reset links expire after 1 hour and can only be used once.
                </p>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-semibold">
                  Request a new reset link
                </Button>
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="space-y-5">
              <div>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Password updated</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Your password has been reset successfully. Redirecting you to sign in...
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-semibold">
                  Sign in now
                </Button>
              </Link>
            </div>
          )}

          {/* Reset form */}
          {tokenValid === true && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-brand-red" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Create a strong password for your SponsorBridge account.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={`h-12 pr-10 ${confirm && confirm !== password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-base"
                disabled={loading || !password || !confirm || password !== confirm}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating password...</>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
