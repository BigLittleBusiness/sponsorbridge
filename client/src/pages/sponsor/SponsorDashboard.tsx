/**
 * SponsorDashboard
 * Landing page after login: greeting, child profile card, recent updates, quick stats.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { SponsorPortalLayout } from "@/components/SponsorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  DollarSign,
  Calendar,
  MessageCircle,
  BookOpen,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";

interface DashboardData {
  totalDonatedCents: number;
  monthsActive: number;
  updatesCount: number;
  messagesCount: number;
  recentUpdates: Array<{
    id: number;
    title: string;
    content: string;
    updateType: string;
    mediaUrl: string | null;
    publishedAt: string | null;
    childFirstName: string;
    childLastName: string;
    childPhotoUrl: string | null;
  }>;
}

const UPDATE_TYPE_LABELS: Record<string, string> = {
  general: "Update",
  education: "Education",
  health: "Health",
  milestone: "Milestone",
  photo: "Photo",
  letter: "Letter",
  video: "Video",
};

const UPDATE_TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  education: "bg-purple-100 text-purple-700",
  health: "bg-green-100 text-green-700",
  milestone: "bg-yellow-100 text-yellow-700",
  photo: "bg-pink-100 text-pink-700",
  letter: "bg-orange-100 text-orange-700",
  video: "bg-red-100 text-red-700",
};

function getAge(dob: string | Date | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} years old`;
}

export default function SponsorDashboard() {
  const { sponsor, sponsorships } = useSponsorAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sponsor/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const primaryChild = sponsorships[0];

  return (
    <SponsorPortalLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2e]">
            Welcome back, {sponsor?.firstName ?? "Sponsor"} 👋
          </h1>
          <p className="text-[#8a7060] mt-1">
            Here's the latest from your sponsorship journey.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Donated",
              value: loading ? null : `$${((data?.totalDonatedCents ?? 0) / 100).toFixed(0)}`,
              icon: DollarSign,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Months Active",
              value: loading ? null : String(data?.monthsActive ?? 0),
              icon: Calendar,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Child Updates",
              value: loading ? null : String(data?.updatesCount ?? 0),
              icon: BookOpen,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Messages",
              value: loading ? null : String(data?.messagesCount ?? 0),
              icon: MessageCircle,
              color: "text-[#C1440E]",
              bg: "bg-[#C1440E]/10",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-[#e8ddd5] bg-white shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                {value === null ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-[#1a3a2e]">{value}</p>
                )}
                <p className="text-xs text-[#8a7060] mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sponsored child card */}
          <div className="lg:col-span-2">
            <Card className="border-[#e8ddd5] bg-white shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1a3a2e] flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[#C1440E]" fill="#C1440E" />
                  Your Sponsored Child
                </CardTitle>
              </CardHeader>
              <CardContent>
                {primaryChild ? (
                  <div className="space-y-4">
                    {/* Child photo */}
                    <div className="relative">
                      {primaryChild.childPhotoUrl ? (
                        <img
                          src={primaryChild.childPhotoUrl}
                          alt={`${primaryChild.childFirstName} ${primaryChild.childLastName}`}
                          className="w-full h-40 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-[#C1440E]/20 to-[#C1440E]/5 rounded-xl flex items-center justify-center">
                          <Heart className="h-12 w-12 text-[#C1440E]/40" fill="currentColor" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs border-0">
                        Active
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-[#1a3a2e] text-lg">
                        {primaryChild.childFirstName} {primaryChild.childLastName}
                      </h3>
                      {primaryChild.childDateOfBirth && (
                        <p className="text-sm text-[#8a7060]">
                          {getAge(primaryChild.childDateOfBirth)}
                        </p>
                      )}
                      {primaryChild.childCountry && (
                        <p className="text-sm text-[#8a7060] flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {primaryChild.childCountry}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#e8ddd5]">
                      <p className="text-xs text-[#8a7060] mb-1">Monthly contribution</p>
                      <p className="text-xl font-bold text-[#C1440E]">
                        ${((primaryChild.monthlyAmount ?? 0) / 100).toFixed(0)}/mo
                      </p>
                    </div>

                    <Link href={`/sponsor/child`}>
                      <a className="flex items-center gap-2 text-sm font-medium text-[#C1440E] hover:underline">
                        View full profile
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#8a7060]">
                    <Heart className="h-10 w-10 mx-auto mb-3 text-[#e8ddd5]" />
                    <p className="text-sm">No active sponsorship found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent updates */}
          <div className="lg:col-span-3">
            <Card className="border-[#e8ddd5] bg-white shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1a3a2e]">
                  Recent Updates
                </CardTitle>
                <Link href="/sponsor/child">
                  <a className="text-xs text-[#C1440E] hover:underline font-medium">
                    View all
                  </a>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))
                ) : (data?.recentUpdates ?? []).length === 0 ? (
                  <div className="text-center py-8 text-[#8a7060]">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#e8ddd5]" />
                    <p className="text-sm">No updates yet. Check back soon!</p>
                  </div>
                ) : (
                  (data?.recentUpdates ?? []).map((update) => (
                    <div
                      key={update.id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-[#f9f5f1] transition-colors"
                    >
                      {update.childPhotoUrl ? (
                        <img
                          src={update.childPhotoUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#C1440E]/10 flex items-center justify-center shrink-0">
                          <Heart className="h-5 w-5 text-[#C1440E]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#1a3a2e] truncate">
                            {update.title}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              UPDATE_TYPE_COLORS[update.updateType] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {UPDATE_TYPE_LABELS[update.updateType] ?? update.updateType}
                          </span>
                        </div>
                        <p className="text-xs text-[#8a7060] mt-0.5 line-clamp-2">
                          {update.content}
                        </p>
                        {update.publishedAt && (
                          <p className="text-xs text-[#b0a090] mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(update.publishedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SponsorPortalLayout>
  );
}
