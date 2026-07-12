import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <img
                src="/manus-storage/sb-icon-mark_f15604c9.svg"
                alt="SponsorBridge"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold text-[#1e3a5f]">SponsorBridge</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          {!submitted ? (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#1e3a5f]" />
                </div>
                <CardTitle className="text-2xl text-[#1e3a5f]">Forgot your password?</CardTitle>
                <CardDescription className="text-base">
                  No problem. Enter your work email and we'll send you a secure link to reset it.
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
                    <Label htmlFor="email">Work email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@yourcharity.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending reset link...</>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                  <div className="text-center pt-2">
                    <Link href="/login">
                      <button className="inline-flex items-center gap-1.5 text-sm text-[#1e3a5f] hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to sign in
                      </button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-[#1e3a5f]">Check your inbox</CardTitle>
                <CardDescription className="text-base">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-slate-600 space-y-1.5">
                  <p className="font-medium text-slate-700">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you used your work email address</li>
                    <li>Allow up to 2 minutes for delivery</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                >
                  Try a different email
                </Button>
                <div className="text-center">
                  <Link href="/login">
                    <button className="inline-flex items-center gap-1.5 text-sm text-[#1e3a5f] hover:underline">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to sign in
                    </button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Need help?{" "}
          <a href="mailto:support@sponsorbridge.com" className="text-[#1e3a5f] hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
