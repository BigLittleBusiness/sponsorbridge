/**
 * SponsorMessagesPage
 * Message thread between sponsor and their sponsored child.
 * Messages go through a moderation queue before delivery.
 */
import { useState, useEffect, useRef } from "react";
import { useSponsorAuth } from "@/contexts/SponsorAuthContext";
import { SponsorPortalLayout } from "@/components/SponsorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Heart, Clock, Info, Loader2 } from "lucide-react";

interface Message {
  id: number;
  direction: "sponsor_to_child" | "child_to_sponsor";
  originalText: string;
  translatedText: string | null;
  status: string;
  deliveredAt: string | null;
  createdAt: string;
  childFirstName: string;
  childLastName: string;
}

export default function SponsorMessagesPage() {
  const { sponsorships } = useSponsorAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const primarySponsorship = sponsorships[0];

  const fetchMessages = () => {
    fetch("/api/sponsor/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !primarySponsorship) return;
    setSendError("");
    setSendSuccess("");
    setSending(true);
    try {
      const res = await fetch("/api/sponsor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sponsorshipId: primarySponsorship.sponsorshipId, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setText("");
      setSendSuccess("Message sent! It will appear here once reviewed by the team.");
      fetchMessages();
    } catch (err: any) {
      setSendError(err.message ?? "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const childName = primarySponsorship
    ? `${primarySponsorship.childFirstName} ${primarySponsorship.childLastName}`
    : "your child";

  return (
    <SponsorPortalLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2e]">Messages</h1>
          <p className="text-[#8a7060] mt-1">Your correspondence with {childName}</p>
        </div>

        {/* Moderation notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            All messages are reviewed by the sponsorship team before delivery to ensure the safety and wellbeing of the child. This typically takes 1–2 business days.
          </p>
        </div>

        {/* Message thread */}
        <Card className="border-[#e8ddd5] bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-[#e8ddd5]">
            <CardTitle className="text-base font-semibold text-[#1a3a2e] flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#C1440E]" />
              Conversation with {childName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <Skeleton className="h-16 w-64 rounded-2xl" />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <Heart className="h-12 w-12 text-[#e8ddd5] mb-3" />
                  <p className="text-[#8a7060] font-medium">No messages yet</p>
                  <p className="text-sm text-[#b0a090] mt-1">
                    Send your first message to {childName} below!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isFromSponsor = msg.direction === "sponsor_to_child";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromSponsor ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-3 ${
                          isFromSponsor
                            ? "bg-[#C1440E] text-white rounded-br-sm"
                            : "bg-[#f0e8e0] text-[#1a3a2e] rounded-bl-sm"
                        }`}
                      >
                        {!isFromSponsor && (
                          <p className="text-xs font-semibold text-[#C1440E] mb-1">
                            {msg.childFirstName} {msg.childLastName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.originalText}</p>
                        {msg.translatedText && msg.translatedText !== msg.originalText && (
                          <p className="text-xs mt-2 opacity-75 italic border-t border-white/20 pt-2">
                            {msg.translatedText}
                          </p>
                        )}
                        <div className={`flex items-center gap-1 mt-1.5 ${isFromSponsor ? "justify-end" : "justify-start"}`}>
                          <Clock className="h-3 w-3 opacity-60" />
                          <span className="text-xs opacity-60">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                          {isFromSponsor && msg.status === "approved" && (
                            <Badge className="ml-1 bg-white/20 text-white border-0 text-xs py-0 px-1.5">
                              Delivered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Send message form */}
            <div className="border-t border-[#e8ddd5] p-4">
              {sendError && (
                <p className="text-sm text-red-600 mb-2">{sendError}</p>
              )}
              {sendSuccess && (
                <p className="text-sm text-green-600 mb-2">{sendSuccess}</p>
              )}
              <form onSubmit={handleSend} className="flex gap-3">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Write a message to ${childName}...`}
                  rows={2}
                  maxLength={2000}
                  className="resize-none border-[#d4c4b8] focus:border-[#C1440E] focus:ring-[#C1440E]/20 bg-white text-[#1a3a2e] flex-1"
                />
                <Button
                  type="submit"
                  disabled={sending || !text.trim() || !primarySponsorship}
                  className="bg-[#C1440E] hover:bg-[#a03508] text-white self-end px-4 py-2 transition-all active:scale-[0.97]"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-[#b0a090] mt-2">
                {text.length}/2000 characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SponsorPortalLayout>
  );
}
