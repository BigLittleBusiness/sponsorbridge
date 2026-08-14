import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { useLocation } from "wouter";
import {
  Calendar,
  Plus,
  MapPin,
  Video,
  Clock,
  Users,
  ChevronLeft,
  LayoutDashboard,
  Baby,
  UserCheck,
  MessageSquare,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  X,
  Edit2,
  Trash2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Sidebar (shared with OrgDashboard) ──────────────────────────────────────
const NAV_ITEMS = [
  { href: "/org-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/children", icon: Baby, label: "Children" },
  { href: "/sponsors", icon: Users, label: "Sponsors" },
  { href: "/messages", icon: MessageSquare, label: "Communications" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/payments", icon: DollarSign, label: "Donations" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/settings/tenant", icon: Settings, label: "Settings" },
];

function Sidebar({ account, onLogout }: { account: any; onLogout: () => void }) {
  const [location] = useLocation();
  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: "#1a3a2e" }}>
      <div className="p-6 border-b border-white/10">
        <Link href="/org-dashboard">
          <img src="/manus-storage/sb-icon-mark_f15604c9.svg" alt="SponsorBridge" className="h-8 w-8" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location === item.href || (item.href !== "/org-dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                style={active ? { backgroundColor: "#c1440e" } : {}}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            {account?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{account?.name ?? "User"}</p>
            <p className="text-white/50 text-xs truncate">{account?.email}</p>
          </div>
          <button onClick={onLogout} className="text-white/50 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Event type colours ───────────────────────────────────────────────────────
const EVENT_TYPE_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  fundraiser: "bg-amber-100 text-amber-700",
  training: "bg-blue-100 text-blue-700",
  community: "bg-green-100 text-green-700",
  webinar: "bg-purple-100 text-purple-700",
  sponsor_meet: "bg-pink-100 text-pink-700",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Create/Edit Event Dialog ─────────────────────────────────────────────────
function EventDialog({
  open,
  onClose,
  tenantId,
  editEvent,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: number;
  editEvent?: any;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(editEvent?.title ?? "");
  const [description, setDescription] = useState(editEvent?.description ?? "");
  const [eventType, setEventType] = useState(editEvent?.eventType ?? "general");
  const [startDate, setStartDate] = useState(
    editEvent?.startDate ? new Date(editEvent.startDate).toISOString().slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    editEvent?.endDate ? new Date(editEvent.endDate).toISOString().slice(0, 16) : ""
  );
  const [location, setLocation] = useState(editEvent?.location ?? "");
  const [isVirtual, setIsVirtual] = useState(editEvent?.isVirtual ?? false);
  const [meetingUrl, setMeetingUrl] = useState(editEvent?.meetingUrl ?? "");
  const [maxAttendees, setMaxAttendees] = useState(editEvent?.maxAttendees?.toString() ?? "");

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      toast.success("Event created successfully");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      toast.success("Event updated successfully");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!title.trim() || !startDate) {
      toast.error("Title and start date are required");
      return;
    }
    const payload = {
      tenantId,
      title: title.trim(),
      description: description || undefined,
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      location: location || undefined,
      isVirtual,
      meetingUrl: meetingUrl || undefined,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
    };
    if (editEvent) {
      updateMutation.mutate({ id: editEvent.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="fundraiser">Fundraiser</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="sponsor_meet">Sponsor Meet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Attendees</Label>
              <Input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date & Time *</Label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isVirtual} onCheckedChange={setIsVirtual} id="virtual-toggle" />
            <Label htmlFor="virtual-toggle">Virtual Event</Label>
          </div>
          {isVirtual ? (
            <div>
              <Label>Meeting URL</Label>
              <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          ) : (
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue or address" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} style={{ backgroundColor: "#c1440e" }} className="text-white hover:opacity-90">
            {isPending ? "Saving..." : editEvent ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { account, logout } = useCustomAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  const tenantId = account?.tenantId ?? 0;

  const { data: eventsList, isLoading } = trpc.events.list.useQuery(
    { tenantId, status: filter === "all" ? undefined : filter },
    { enabled: !!tenantId }
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("Event deleted"); },
    onError: (err) => toast.error(err.message),
  });

  const handleLogout = () => { logout(); navigate("/"); };

  const upcoming = eventsList?.filter((e) => e.status === "upcoming") ?? [];
  const past = eventsList?.filter((e) => e.status !== "upcoming") ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar account={account} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your organisation's events and activities</p>
          </div>
          <Button onClick={() => setShowCreate(true)} style={{ backgroundColor: "#c1440e" }} className="text-white hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {["all", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === s ? "text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={filter === s ? { backgroundColor: "#c1440e" } : {}}
              >
                {s === "all" ? "All Events" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : eventsList?.length === 0 ? (
            <div className="bg-white rounded-xl border p-16 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-6">Create your first event to get started.</p>
              <Button onClick={() => setShowCreate(true)} style={{ backgroundColor: "#c1440e" }} className="text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Create Event
              </Button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => setEditEvent(event)}
                        onDelete={() => deleteMutation.mutate({ id: event.id, tenantId })}
                      />
                    ))}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past & Other</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {past.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => setEditEvent(event)}
                        onDelete={() => deleteMutation.mutate({ id: event.id, tenantId })}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <EventDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        tenantId={tenantId}
      />
      {editEvent && (
        <EventDialog
          open={!!editEvent}
          onClose={() => setEditEvent(null)}
          tenantId={tenantId}
          editEvent={editEvent}
        />
      )}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete }: { event: any; onEdit: () => void; onDelete: () => void }) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={`text-xs ${EVENT_TYPE_COLORS[event.eventType ?? "general"] ?? "bg-gray-100 text-gray-700"}`}>
          {event.eventType ?? "general"}
        </Badge>
        <Badge className={`text-xs ${STATUS_COLORS[event.status ?? "upcoming"] ?? "bg-gray-100 text-gray-600"}`}>
          {event.status ?? "upcoming"}
        </Badge>
        {event.isVirtual && (
          <Badge className="text-xs bg-indigo-100 text-indigo-700">Virtual</Badge>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>
            {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {end && ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
        {event.isVirtual && event.meetingUrl ? (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
              Join online
            </a>
          </div>
        ) : event.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        ) : null}
        {event.maxAttendees && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Max {event.maxAttendees} attendees</span>
          </div>
        )}
      </div>
    </div>
  );
}
