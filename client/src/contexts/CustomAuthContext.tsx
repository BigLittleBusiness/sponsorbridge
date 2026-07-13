/**
 * Custom Auth Context
 * Manages the SponsorBridge charity admin session (separate from Manus OAuth).
 * Uses the /api/auth/* endpoints backed by custom_accounts table.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CustomAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  orgName: string;
  planTier: string;
  onboardingCompletedAt: string | null;
  tenantId: number | null;
  isSystemAdmin: boolean;
}

interface CustomAuthState {
  account: CustomAccount | null;
  loading: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const CustomAuthContext = createContext<CustomAuthState>({
  account: null,
  loading: true,
  refetch: () => {},
  logout: async () => {},
  markOnboardingComplete: async () => {},
});

export function CustomAuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CustomAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me-custom", { credentials: "include" });
      const data = await res.json();
      setAccount(data.account ?? null);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout-custom", { method: "POST", credentials: "include" });
    setAccount(null);
  };

  const markOnboardingComplete = async () => {
    try {
      await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        credentials: "include",
      });
      // Optimistically update the local state so the redirect fires immediately
      setAccount((prev) =>
        prev ? { ...prev, onboardingCompletedAt: new Date().toISOString() } : prev
      );
    } catch {
      // Non-fatal — the redirect will still proceed
    }
  };

  return (
    <CustomAuthContext.Provider
      value={{ account, loading, refetch: fetchMe, logout, markOnboardingComplete }}
    >
      {children}
    </CustomAuthContext.Provider>
  );
}

export function useCustomAuth() {
  return useContext(CustomAuthContext);
}
