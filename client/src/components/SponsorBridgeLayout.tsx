import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileText,
  Heart,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Users,
  Video,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useRouter } from "wouter";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Children", href: "/children", icon: Heart, roles: ["system_admin", "program_manager", "safeguarding_officer", "field_worker", "sponsor_relations", "volunteer", "admin"] },
  { label: "Sponsors", href: "/sponsors", icon: Users, roles: ["system_admin", "program_manager", "sponsor_relations", "finance_officer", "admin"] },
  { label: "Matching", href: "/matching", icon: BookOpen, roles: ["system_admin", "program_manager", "sponsor_relations", "admin"] },
  { label: "Vlogs", href: "/vlogs", icon: Video, roles: ["system_admin", "program_manager", "safeguarding_officer", "field_worker", "sponsor_relations", "admin"] },
  { label: "Messages", href: "/messages", icon: MessageSquare, roles: ["system_admin", "program_manager", "safeguarding_officer", "sponsor_relations", "admin"] },
  { label: "Payments", href: "/payments", icon: Wallet, roles: ["system_admin", "finance_officer", "program_manager", "admin"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["system_admin", "program_manager", "sponsor_relations", "finance_officer", "admin"] },
  { label: "Community", href: "/community", icon: Share2 },
];

const SAFEGUARDING_ITEMS: NavItem[] = [
  { label: "Incidents", href: "/safeguarding/incidents", icon: AlertTriangle },
  { label: "Background Checks", href: "/safeguarding/background-checks", icon: ShieldCheck },
  { label: "Consent Manager", href: "/safeguarding/consent", icon: ClipboardList },
  { label: "Audit Log", href: "/safeguarding/audit", icon: FileText },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: "Organisation", href: "/settings/tenant", icon: Settings },
  { label: "User Management", href: "/settings/users", icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin",
  program_manager: "Program Manager",
  safeguarding_officer: "Safeguarding Officer",
  field_worker: "Field Worker",
  finance_officer: "Finance Officer",
  sponsor_relations: "Sponsor Relations",
  volunteer: "Volunteer",
  sponsor: "Sponsor",
  admin: "Admin",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  system_admin: "bg-red-100 text-red-800",
  program_manager: "bg-blue-100 text-blue-800",
  safeguarding_officer: "bg-indigo-100 text-indigo-800",
  field_worker: "bg-green-100 text-green-800",
  finance_officer: "bg-amber-100 text-amber-800",
  sponsor_relations: "bg-purple-100 text-purple-800",
  volunteer: "bg-gray-100 text-gray-800",
  sponsor: "bg-terracotta/10 text-terracotta",
  admin: "bg-red-100 text-red-800",
};

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));

  return (
    <Link href={item.href} onClick={onClick}>
      <span className={`nav-item cursor-pointer ${isActive ? "nav-item-active" : ""}`}>
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="ml-auto bg-terracotta text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
            {item.badge}
          </span>
        )}
      </span>
    </Link>
  );
}

function Sidebar({ onClose, userRole }: { onClose?: () => void; userRole?: string }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isSafeguardingActive = location.startsWith("/safeguarding");
  const isSettingsActive = location.startsWith("/settings");

  // Filter nav items by role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  // Safeguarding visible to safeguarding roles and managers
  const safeguardingRoles = ["system_admin", "program_manager", "safeguarding_officer", "admin"];
  const showSafeguarding = userRole ? safeguardingRoles.includes(userRole) : false;

  // Settings visible to managers and admins
  const settingsRoles = ["system_admin", "program_manager", "admin"];
  const showSettings = userRole ? settingsRoles.includes(userRole) : false;

  return (
    <div className="flex flex-col h-full bg-midnight-slate text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src="/manus-storage/sb-icon-mark_f15604c9.svg"
              alt="SponsorBridge"
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div className="font-bold text-sm leading-tight">SponsorBridge</div>
              <div className="text-xs text-white/50 leading-tight">Charity Platform</div>
            </div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNavItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}

        {showSafeguarding && (
          <>
            <Separator className="my-3 bg-white/10" />
            {/* Safeguarding section */}
            <div className="px-3 py-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">
                <Shield className="w-3 h-3" />
                Safeguarding
              </div>
            </div>
            {SAFEGUARDING_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </>
        )}

        {showSettings && (
          <>
            <Separator className="my-3 bg-white/10" />
            {/* Settings section */}
            <div className="px-3 py-1">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Settings</div>
            </div>
            {SETTINGS_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      {user && (
        <div className="border-t border-white/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 transition-colors text-left">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-terracotta text-white text-xs">
                    {user.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user.name ?? "User"}</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded inline-block mt-0.5 ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-800"}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

export default function SponsorBridgeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: notifs } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const unreadCount = notifs?.filter((n) => !n.isRead).length ?? 0;

  // Policy acknowledgment gate — redirect to /policy if user hasn't acknowledged
  const needsPolicyAck = isAuthenticated && user && !user.policyAcknowledgedAt;
  if (!loading && needsPolicyAck && typeof window !== "undefined" && window.location.pathname !== "/policy") {
    navigate("/policy");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-linen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/manus-storage/sb-icon-mark_f15604c9.svg"
            alt="SponsorBridge"
            className="w-10 h-10 rounded-xl object-contain animate-pulse"
          />
          <div className="text-sm text-muted-foreground">Loading SponsorBridge…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-warm-linen flex items-center justify-center">
        <div className="text-center">
          <img
            src="/manus-storage/sb-icon-mark_f15604c9.svg"
            alt="SponsorBridge"
            className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold mb-2">Sign in to SponsorBridge</h2>
          <p className="text-muted-foreground mb-6 text-sm">Access your charity's sponsorship platform</p>
          <Button onClick={() => startLogin()} className="bg-terracotta hover:bg-terracotta/90 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-warm-linen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col shadow-xl">
        <Sidebar userRole={user?.role} />
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col shadow-xl transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} userRole={user?.role} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {/* Notifications */}
          <Link href="/dashboard">
            <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
