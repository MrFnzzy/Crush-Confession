"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Send, MessageCircle, QrCode, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Home() {
  const router = useRouter();
  const location = router.asPath.split("?")[0];
  const [view, setView] = useState<"wall" | "confess">(location === "/confess" ? "confess" : "wall");
  const [origin, setOrigin] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (location === "/confess") {
      setView("confess");
    } else {
      setView("wall");
    }
  }, [location]);

  const handleViewChange = (newView: "wall" | "confess") => {
    setView(newView);
    void router.push(newView === "confess" ? "/confess" : "/");
  };

  const { data: confessions, isLoading: isConfessionsLoading } = trpc.confessions.list.useQuery();
  const { data: totalCount } = trpc.confessions.count.useQuery();

  const createConfession = trpc.confessions.create.useMutation({
    onSuccess: () => {
      toast.success("Your confession has been posted to the wall!");
      utils.confessions.list.invalidate();
      utils.confessions.count.invalidate();
      handleViewChange("wall");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to post confession");
    },
  });

  const [formData, setFormData] = useState({
    fromName: "",
    toName: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromName || !formData.toName || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    createConfession.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      {/* Header */}
      <header className="glass-effect py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleViewChange("wall")}>
            <div className="bg-primary p-2 rounded-xl">
              <Heart className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">CrushConfess</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <QrCode className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">Share the Wall</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(origin + "/confess")}`} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan to confess your feelings anonymously
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(origin + "/confess");
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant={view === "confess" ? "secondary" : "default"}
              className="rounded-full px-6"
              onClick={() => handleViewChange(view === "confess" ? "wall" : "confess")}
            >
              {view === "confess" ? "Back to Wall" : "Confess Now"}
            </Button>
          </nav>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        {view === "confess" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Say what's on your heart</h2>
              <p className="text-muted-foreground">It's completely anonymous. We promise.</p>
            </div>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Nickname</label>
                      <Input 
                        placeholder="e.g. Secret Admirer" 
                        value={formData.fromName}
                        onChange={(e) => setFormData({...formData, fromName: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Crush's Name</label>
                      <Input 
                        placeholder="Who is it for?" 
                        value={formData.toName}
                        onChange={(e) => setFormData({...formData, toName: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Message</label>
                    <Textarea 
                      placeholder="Pour your heart out here..." 
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="rounded-xl resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-12 text-lg font-semibold"
                    disabled={createConfession.isPending}
                  >
                    {createConfession.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Post Anonymously
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Confession Wall</h2>
              <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {totalCount ?? 0} Confessions
              </div>
            </div>

            {isConfessionsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading confessions...</p>
              </div>
            ) : confessions?.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No confessions yet</h3>
                <p className="text-muted-foreground">Be the first to post a secret message!</p>
                <Button onClick={() => handleViewChange("confess")} className="rounded-full">
                  Confess Now
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {confessions?.map((confession) => (
                  <ConfessionCard key={confession.id} confession={confession} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ConfessionCard({ confession }: { confession: any }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const utils = trpc.useUtils();

  const { data: replies, isLoading: isRepliesLoading } = trpc.replies.list.useQuery(
    { confessionId: confession.id },
    { enabled: showReplies }
  );

  const postReply = trpc.replies.create.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.replies.list.invalidate({ confessionId: confession.id });
      toast.success("Reply posted!");
    }
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    postReply.mutate({
      confessionId: confession.id,
      message: replyText
    });
  };

  return (
    <Card className="confession-card border-none shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Confession #{confession.number}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(confession.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">To:</span>
          <span className="text-lg font-bold text-foreground">{confession.toName}</span>
          <span className="text-sm font-medium text-muted-foreground ml-auto">From:</span>
          <span className="text-sm font-semibold italic text-primary">{confession.fromName}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {confession.message}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col items-stretch gap-4">
        <div className="flex items-center justify-between border-t pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full text-muted-foreground hover:text-primary"
            onClick={() => setShowReplies(!showReplies)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {showReplies ? "Hide Replies" : `View Replies`}
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="w-3 h-3 text-destructive fill-destructive" />
            Anonymous
          </div>
        </div>

        {showReplies && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {isRepliesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading replies...</span>
                </div>
              ) : replies?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No replies yet. Be the first to say something!</p>
              ) : (
                replies?.map((reply: any) => (
                  <div key={reply.id} className="bg-muted/30 p-3 rounded-xl space-y-1">
                    <p className="text-sm">{reply.message}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )).reverse()
              )}
            </div>

            <form onSubmit={handleReply} className="flex gap-2">
              <Input 
                placeholder="Write a reply..." 
                className="rounded-full h-9 text-sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button 
                type="submit" 
                size="sm" 
                className="rounded-full"
                disabled={postReply.isPending}
              >
                {postReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
