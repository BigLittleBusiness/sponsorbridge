/**
 * SponsorPortalLayout
 * Warm, light sidebar layout for the sponsor self-service portal.
 * Distinct from the dark-green org dashboard — uses warm cream/terracotta palette.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import {
  LayoutDashboard,
  Heart,
  MessageCircle,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FolderHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/sponsor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sponsor/child", label: "My Child", icon: Heart },
  { href: "/sponsor/projects", label: "My Projects", icon: FolderHeart },
  { href: "/sponsor/messages", label: "Messages", icon: MessageCircle },
  { href: "/sponsor/payments", label: "Payments", icon: CreditCard },
  { href: "/sponsor/profile", label: "My Profile", icon: User },
];

interface SponsorPortalLayoutProps {
  children: React.ReactNode;
}

export function SponsorPortalLayout({ children }: SponsorPortalLayoutProps) {
  const [location] = useLocation();
  const { sponsor, logout } = useSponsorAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = sponsor
    ? `${sponsor.firstName[0] ?? ""}${sponsor.lastName[0] ?? ""}`.toUpperCase()
    : "SP";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/sponsor/login";
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#fdf8f5] border-r border-[#e8ddd5]",
        mobile ? "w-full" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e8ddd5]">
        <img
          src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-icon-mark_7b8d4e2a.svg"
          alt="SponsorBridge"
          className="h-8 w-8"
        />
        <div>
          <p className="text-sm font-bold text-[#1a3a2e] leading-none">SponsorBridge</p>
          <p className="text-xs text-[#8a7060] mt-0.5">Sponsor Portal</p>
        </div>
      </div>

      {/* Sponsor greeting */}
      {sponsor && (
        <div className="px-6 py-4 border-b border-[#e8ddd5]">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-[#C1440E]/10">
              <AvatarFallback className="text-[#C1440E] text-sm font-semibold bg-[#C1440E]/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1a3a2e] truncate">
                {sponsor.firstName} {sponsor.lastName}
              </p>
              <p className="text-xs text-[#8a7060] truncate">{sponsor.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <a
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#C1440E] text-white shadow-sm"
                    : "text-[#4a3728] hover:bg-[#f0e8e0] hover:text-[#1a3a2e]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#e8ddd5]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[#8a7060] hover:bg-[#f0e8e0] hover:text-[#C1440E] transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#f9f5f1] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#fdf8f5] border-b border-[#e8ddd5]">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#4a3728]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img
            src="https://sponsorapp-k6ifqkyq.manus.space/manus-storage/sb-icon-mark_7b8d4e2a.svg"
            alt="SponsorBridge"
            className="h-7 w-7"
          />
          <span className="text-sm font-bold text-[#1a3a2e]">Sponsor Portal</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
