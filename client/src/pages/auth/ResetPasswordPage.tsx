import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";

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
              i <= score ? strengthColor : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Password strength</span>
        <span className={`text-xs font-medium ${score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500"}`}>
          {strengthLabel}
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-green-600" : "text-slate-400"}`}>
            {c.pass ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <img
                src="/manus-storage/sb-icon-mark_d802f749.png"
                alt="SponsorBridge"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold text-[#1e3a5f]">SponsorBridge</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          {/* Loading token validation */}
          {tokenValid === null && (
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto mb-3" />
              <p className="text-slate-500">Validating your reset link...</p>
            </CardContent>
          )}

          {/* Invalid / expired token */}
          {tokenValid === false && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-[#1e3a5f]">Link expired or invalid</CardTitle>
                <CardDescription className="text-base">
                  This password reset link is no longer valid. Reset links expire after 1 hour and can only be used once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full h-11 bg-[#1e3a5f] hover:bg-[#16304f] text-white">
                    Request a new reset link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full h-11">Back to sign in</Button>
                </Link>
              </CardContent>
            </>
          )}

          {/* Success */}
          {success && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-[#1e3a5f]">Password updated</CardTitle>
                <CardDescription className="text-base">
                  Your password has been reset successfully. Redirecting you to sign in...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full h-11 bg-[#1e3a5f] hover:bg-[#16304f] text-white">
                    Sign in now
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {/* Reset form */}
          {tokenValid === true && !success && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#1e3a5f]" />
                </div>
                <CardTitle className="text-2xl text-[#1e3a5f]">Choose a new password</CardTitle>
                <CardDescription className="text-base">
                  Create a strong password for your SponsorBridge account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
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
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className={`h-11 pr-10 ${confirm && confirm !== password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold mt-2"
                    disabled={loading || !password || !confirm || password !== confirm}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating password...</>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
