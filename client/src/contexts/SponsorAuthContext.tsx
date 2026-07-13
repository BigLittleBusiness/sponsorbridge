/**
 * SponsorAuthContext
 * Manages authentication state for the Sponsor self-service portal.
 * Uses the sb_sponsor_token cookie via /api/sponsor/* endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SponsorAccount {
  id: number;
  sponsorId: number;
  tenantId: number;
  email: string;
  firstName: string;
  lastName: string;
  country: string | null;
  phone: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  stripeCustomerId: string | null;
}

export interface SponsoredChild {
  id: number;
  childFirstName: string;
  childLastName: string;
  childCountry: string | null;
  childPhotoUrl: string | null;
  childDateOfBirth: Date | null;
  childGender: string | null;
  childProgramType: string | null;
  sponsorshipId: number;
  status: string;
  startDate: Date | null;
  monthlyAmount: number | null;
}

interface SponsorAuthContextValue {
  sponsor: SponsorAccount | null;
  sponsorships: SponsoredChild[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SponsorAuthContext = createContext<SponsorAuthContextValue | null>(null);

export function SponsorAuthProvider({ children }: { children: React.ReactNode }) {
  const [sponsor, setSponsor] = useState<SponsorAccount | null>(null);
  const [sponsorships, setSponsorships] = useState<SponsoredChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/sponsor/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSponsor(data.sponsor ?? null);
        setSponsorships(data.sponsorships ?? []);
      } else {
        setSponsor(null);
        setSponsorships([]);
      }
    } catch {
      setSponsor(null);
      setSponsorships([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/sponsor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    await fetchMe();
  };

  const requestOtp = async (email: string) => {
    const res = await fetch("/api/sponsor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, requestOtp: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to send code");
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch("/api/sponsor/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed");
    await fetchMe();
  };

  const logout = async () => {
    await fetch("/api/sponsor/logout", { method: "POST", credentials: "include" });
    setSponsor(null);
    setSponsorships([]);
  };

  const refresh = fetchMe;

  return (
    <SponsorAuthContext.Provider
      value={{
        sponsor,
        sponsorships,
        isLoading,
        isAuthenticated: !!sponsor,
        login,
        requestOtp,
        verifyOtp,
        logout,
        refresh,
      }}
    >
      {children}
    </SponsorAuthContext.Provider>
  );
}

export function useSponsorAuth() {
  const ctx = useContext(SponsorAuthContext);
  if (!ctx) throw new Error("useSponsorAuth must be used within SponsorAuthProvider");
  return ctx;
}
