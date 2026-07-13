import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
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
            Account recovery
          </h2>
          <p className="text-white/60 text-base">
            We'll send a secure reset link to your work email. Links expire after 1 hour and can only be used once.
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

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-terracotta" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  No problem. Enter your work email and we'll send you a secure link to reset it.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Work email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourcharity.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-base"
                disabled={loading || !email}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending reset link...</>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  If an account exists for <strong className="text-foreground">{email}</strong>, we've sent a password reset link. It expires in 1 hour.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2 border border-border">
                <p className="font-medium text-foreground">Didn't receive the email?</p>
                <p>Check your spam or junk folder, make sure you used your work email address, and allow up to 2 minutes for delivery.</p>
              </div>

              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => { setSubmitted(false); setEmail(""); }}
              >
                Try a different email
              </Button>

              <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            Need help?{" "}
            <a href="mailto:support@sponsorbridge.com" className="text-terracotta hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
