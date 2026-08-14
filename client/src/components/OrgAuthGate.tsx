import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/contexts/CustomAuthContext";

export function OrgAuthGate({ children }: { children: React.ReactNode }) {
  const { account, loading } = useCustomAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !account) navigate("/login");
  }, [account, loading, navigate]);

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#c1440e] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Checking your access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
