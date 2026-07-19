import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function EarlyAccessSection() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; email?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const signup = trpc.earlyAccess.signup.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setServerError(null);
    },
    onError: (err) => {
      setServerError(err.message || "Something went wrong. Please try again.");
    },
  });

  const validate = () => {
    const newErrors: { firstName?: string; email?: string } = {};
    if (!firstName.trim()) newErrors.firstName = "Please enter your first name.";
    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    signup.mutate({ firstName: firstName.trim(), email: email.trim() });
  };

  return (
    <section className="bg-[#162614] border-y border-white/10 py-10 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
          Get early access before we open the doors.
        </h2>
        <p className="text-white/65 text-sm md:text-base mb-6 leading-relaxed">
          Be among the first charities to join SponsorBridge. Leave your details and we'll let you know the moment we launch.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-medium py-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Thanks — we'll be in touch when SponsorBridge launches.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Horizontal on desktop, stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-start">
              <div className="w-full sm:w-auto flex flex-col gap-1">
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#D14A2E] focus:ring-[#D14A2E]/30 h-11 w-full sm:w-44 ${errors.firstName ? "border-red-400" : ""}`}
                  aria-label="First name"
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs text-left">{errors.firstName}</p>
                )}
              </div>

              <div className="w-full sm:w-auto flex flex-col gap-1">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#D14A2E] focus:ring-[#D14A2E]/30 h-11 w-full sm:w-64 ${errors.email ? "border-red-400" : ""}`}
                  aria-label="Email address"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs text-left">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={signup.isPending}
                className="bg-[#D14A2E] hover:bg-[#b83d23] active:scale-[0.97] text-white h-11 px-6 font-semibold transition-all duration-150 w-full sm:w-auto shrink-0"
              >
                {signup.isPending ? "Sending…" : (
                  <>Get Early Access <ArrowRight className="w-4 h-4 ml-1.5" /></>
                )}
              </Button>
            </div>

            {serverError && (
              <p className="text-red-400 text-sm mt-3">{serverError}</p>
            )}
          </form>
        )}

        <p className="text-white/35 text-xs mt-4">
          No credit card required · We'll only email you about launch
        </p>
      </div>
    </section>
  );
}
