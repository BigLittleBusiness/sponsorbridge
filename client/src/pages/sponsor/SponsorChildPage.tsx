/**
 * SponsorChildPage
 * Detailed child profile with full updates history, photos, and milestones.
 */
import { useState, useEffect } from "react";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { SponsorPortalLayout } from "@/components/SponsorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MapPin,
  GraduationCap,
  Activity,
  BookOpen,
  Image,
  Mail,
  Video,
  Star,
  Clock,
  Filter,
} from "lucide-react";

interface ChildData {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  country: string | null;
  region: string | null;
  bio: string | null;
  interests: string | null;
  photoUrl: string | null;
  status: string;
  educationLevel: string | null;
  schoolName: string | null;
  healthStatus: string | null;
  programType: string | null;
}

interface ChildUpdate {
  id: number;
  title: string;
  content: string;
  updateType: string;
  mediaUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const UPDATE_ICONS: Record<string, React.ElementType> = {
  general: BookOpen,
  education: GraduationCap,
  health: Activity,
  milestone: Star,
  photo: Image,
  letter: Mail,
  video: Video,
};

const UPDATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  general: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  education: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  health: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  milestone: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  photo: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  letter: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  video: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function getAge(dob: string | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} years old`;
}

export default function SponsorChildPage() {
  const { sponsorships } = useSponsorAuth();
  const [child, setChild] = useState<ChildData | null>(null);
  const [updates, setUpdates] = useState<ChildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const primaryChild = sponsorships[0];

  useEffect(() => {
    if (!primaryChild) {
      setLoading(false);
      return;
    }
    fetch(`/api/sponsor/child/${primaryChild.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setChild(d.child ?? null);
        setUpdates(d.updates ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [primaryChild?.id]);

  const filteredUpdates = filter === "all"
    ? updates
    : updates.filter((u) => u.updateType === filter);

  const updateTypes = ["all", ...Array.from(new Set(updates.map((u) => u.updateType)))];

  return (
    <SponsorPortalLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2e]">My Sponsored Child</h1>
          <p className="text-[#8a7060] mt-1">Full profile and updates history</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : !child ? (
          <Card className="border-[#e8ddd5] bg-white">
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-[#e8ddd5]" />
              <p className="text-[#8a7060]">No active sponsorship found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child profile card */}
            <Card className="border-[#e8ddd5] bg-white shadow-sm overflow-hidden">
              <div className="relative">
                {child.photoUrl ? (
                  <img
                    src={child.photoUrl}
                    alt={`${child.firstName} ${child.lastName}`}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-[#C1440E]/20 to-[#C1440E]/5 flex items-center justify-center">
                    <Heart className="h-16 w-16 text-[#C1440E]/30" fill="currentColor" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h2 className="text-2xl font-bold text-white">
                    {child.firstName} {child.lastName}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {child.dateOfBirth && (
                      <span className="text-white/80 text-sm">{getAge(child.dateOfBirth)}</span>
                    )}
                    {child.country && (
                      <span className="text-white/80 text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {child.country}
                        {child.region ? `, ${child.region}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {child.bio && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1a3a2e] mb-1">About</h3>
                      <p className="text-sm text-[#4a3728] leading-relaxed">{child.bio}</p>
                    </div>
                  )}
                  {child.interests && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#1a3a2e] mb-2">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {child.interests.split(",").map((interest) => (
                          <Badge
                            key={interest.trim()}
                            variant="secondary"
                            className="bg-[#f0e8e0] text-[#4a3728] border-0 text-xs"
                          >
                            {interest.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {child.programType && (
                    <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                      <Heart className="h-4 w-4 text-[#C1440E] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7060]">Program</p>
                        <p className="text-sm font-medium text-[#1a3a2e]">{child.programType}</p>
                      </div>
                    </div>
                  )}
                  {child.educationLevel && (
                    <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                      <GraduationCap className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7060]">Education</p>
                        <p className="text-sm font-medium text-[#1a3a2e]">
                          {child.educationLevel}
                          {child.schoolName ? ` — ${child.schoolName}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {child.healthStatus && (
                    <div className="flex items-start gap-3 p-3 bg-[#f9f5f1] rounded-lg">
                      <Activity className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[#8a7060]">Health</p>
                        <p className="text-sm font-medium text-[#1a3a2e]">{child.healthStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Updates feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a3a2e]">Updates from the field</h2>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#8a7060]" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border border-[#e8ddd5] rounded-lg px-3 py-1.5 bg-white text-[#4a3728] focus:outline-none focus:border-[#C1440E]"
                  >
                    {updateTypes.map((t) => (
                      <option key={t} value={t}>
                        {t === "all" ? "All updates" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredUpdates.length === 0 ? (
                <Card className="border-[#e8ddd5] bg-white">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#e8ddd5]" />
                    <p className="text-[#8a7060] text-sm">No updates yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredUpdates.map((update) => {
                    const Icon = UPDATE_ICONS[update.updateType] ?? BookOpen;
                    const colors = UPDATE_COLORS[update.updateType] ?? UPDATE_COLORS.general;
                    return (
                      <Card key={update.id} className="border-[#e8ddd5] bg-white shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`h-5 w-5 ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-[#1a3a2e]">{update.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                                  {update.updateType.charAt(0).toUpperCase() + update.updateType.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-[#4a3728] leading-relaxed">{update.content}</p>
                              {update.mediaUrl && (
                                <img
                                  src={update.mediaUrl}
                                  alt="Update media"
                                  className="mt-3 rounded-lg max-h-64 object-cover"
                                />
                              )}
                              {update.publishedAt && (
                                <p className="text-xs text-[#b0a090] mt-3 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(update.publishedAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SponsorPortalLayout>
  );
}
