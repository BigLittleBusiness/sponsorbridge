import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useCustomAuth } from "@/contexts/CustomAuthContext";

export default function VerifyOtpPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { refetch } = useCustomAuth();
  const [, navigate] = useLocation();

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
      navigate("/onboarding");
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
      if (res.ok) toast.success("A new code has been sent");
      else toast.error(data.error ?? "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <img
                src="/manus-storage/sb-icon-mark_f15604c9.svg"
                alt="SponsorBridge"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-xl">SponsorBridge</span>
            </span>
          </Link>
          <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>

        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-brand-red" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verify your email</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter the 6-digit code sent to<br />
              {email ? (
                <span className="font-semibold text-foreground">{email}</span>
              ) : (
                <span className="text-muted-foreground">your email address</span>
              )}
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
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-12 text-base font-semibold"
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify Account
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Didn't receive it?{" "}
            <button
              className="text-brand-red hover:underline font-medium"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>
          <p className="text-xs text-muted-foreground">Code expires in 15 minutes</p>
        </div>
      </div>
    </div>
  );
}
