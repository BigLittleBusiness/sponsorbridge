import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, CheckCircle2, Heart, Share2, Users } from "lucide-react";

const EXAMPLE_UPDATES = [
  { title: "Site assessment completed", text: "The local team has confirmed a safe site and community water committee for the project.", date: "Example update" },
  { title: "Materials sourced locally", text: "Suppliers have been identified so more of every contribution supports the surrounding community.", date: "Example update" },
];

/** A non-transactional illustration of the public donor experience. */
export default function CampaignPreviewPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-background">
      <nav className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/pricing")}>
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Button>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Illustrative preview</Badge>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="rounded-2xl overflow-hidden border border-amber-200 bg-gradient-to-br from-[#1a3a2e] to-[#275443] text-white shadow-md">
          <div className="p-8 md:p-12">
            <Badge className="bg-white/15 text-white border-white/25 mb-4">Clean water campaign</Badge>
            <h1 className="font-serif text-3xl md:text-5xl font-bold max-w-2xl leading-tight">Clean water for Mtoni Primary School</h1>
            <p className="mt-4 text-white/75 text-lg max-w-xl">A sample public campaign page showing the donor experience your organisation can create with SponsorBridge.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> Infrastructure · Community project</div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">$7,300</p>
                    <p className="text-sm text-muted-foreground">raised of $10,000 goal</p>
                  </div>
                  <div className="text-right"><p className="text-2xl font-bold">73%</p><p className="text-sm text-muted-foreground">funded</p></div>
                </div>
                <Progress value={73} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>47 example contributors</span><span>Example campaign</span></div>
              </CardContent>
            </Card>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">The campaign story</h2>
              <p className="text-muted-foreground leading-relaxed">This is a non-transactional example. A live campaign page gives donors a clear story, a transparent progress indicator, project updates, social sharing tools, and the choice of one-off or monthly contributions.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Project updates</h2>
              {EXAMPLE_UPDATES.map((update) => (
                <Card key={update.title}><CardContent className="pt-5"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-amber-100 p-2"><CheckCircle2 className="h-4 w-4 text-amber-700" /></div><div><p className="font-semibold">{update.title}</p><p className="text-sm text-muted-foreground mt-1">{update.text}</p><p className="text-xs text-muted-foreground mt-2">{update.date}</p></div></div></CardContent></Card>
              ))}
            </section>
          </section>

          <aside className="space-y-4">
            <Card className="border-amber-200 shadow-sm"><CardContent className="pt-6 space-y-4"><div><h2 className="font-bold text-lg">Support this campaign</h2><p className="text-sm text-muted-foreground mt-1">Donation controls are disabled in this illustrative preview.</p></div><div className="grid grid-cols-2 gap-2">{[25, 50, 100, 250].map((amount) => <Button key={amount} variant="outline" disabled>${amount}</Button>)}</div><Button disabled className="w-full bg-terracotta text-white"><Heart className="h-4 w-4 mr-2" /> Continue to secure donation</Button><p className="text-xs text-center text-muted-foreground">Live campaigns use Stripe for one-off and recurring contributions.</p></CardContent></Card>
            <Card><CardContent className="pt-5 space-y-3"><div className="flex items-center gap-2 font-semibold"><Share2 className="h-4 w-4 text-terracotta" /> Built to be shared</div><p className="text-sm text-muted-foreground">Live campaign pages include social sharing and copy-link controls to help supporters spread the word.</p><div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Contributor wall optional</div></CardContent></Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
