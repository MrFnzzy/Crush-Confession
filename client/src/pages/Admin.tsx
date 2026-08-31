import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2, ShieldAlert, LogOut, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Admin() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const utils = trpc.useUtils();

  const { data: confessions, isLoading: isConfessionsLoading } = trpc.confessions.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin"
  });

  const deleteConfession = trpc.confessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Confession deleted");
      utils.confessions.list.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteReply = trpc.replies.delete.useMutation({
    onSuccess: () => {
      toast.success("Reply deleted");
      utils.replies.list.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center gap-6">
        <div className="bg-destructive/10 p-4 rounded-full">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground max-w-xs">
            Please log in with an administrator account to access this dashboard.
          </p>
        </div>
        <Button onClick={() => window.location.href = "/api/oauth/login"} className="rounded-full px-8">
          Login as Admin
        </Button>
        <Link href="/">
          <Button variant="ghost" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center gap-6">
        <div className="bg-destructive/10 p-4 rounded-full">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p className="text-muted-foreground max-w-xs">
            Your account does not have administrator privileges.
          </p>
        </div>
        <Button onClick={() => logout()} variant="outline" className="rounded-full">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <Link href="/">
          <Button variant="ghost" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Moderate anonymous confessions and replies.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                View Site
              </Button>
            </Link>
            <Button onClick={() => logout()} variant="ghost" className="rounded-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Recent Confessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isConfessionsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="max-w-md">Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confessions?.map((confession: any) => (
                      <ConfessionRow 
                        key={confession.id} 
                        confession={confession} 
                        onDelete={(id) => {
                          if (confirm("Are you sure you want to delete this confession?")) {
                            deleteConfession.mutate({ id });
                          }
                        }}
                        onDeleteReply={(id) => {
                          if (confirm("Delete this reply?")) {
                            deleteReply.mutate({ id });
                          }
                        }}
                      />
                    ))}
                    {confessions?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No confessions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConfessionRow({ confession, onDelete, onDeleteReply }: { confession: any, onDelete: (id: number) => void, onDeleteReply: (id: number) => void }) {
  const [showReplies, setShowReplies] = useState(false);
  const { data: replies } = trpc.replies.list.useQuery({ confessionId: confession.id }, { enabled: showReplies });

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">#{confession.number}</TableCell>
        <TableCell className="font-medium">{confession.fromName}</TableCell>
        <TableCell className="font-medium">{confession.toName}</TableCell>
        <TableCell className="max-w-md truncate text-muted-foreground">
          {confession.message}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap">
          {format(new Date(confession.createdAt), "MMM d, HH:mm")}
        </TableCell>
        <TableCell className="text-right flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full", showReplies && "bg-accent")}
            onClick={() => setShowReplies(!showReplies)}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10 rounded-full"
            onClick={() => onDelete(confession.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
      {showReplies && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={6} className="p-0">
            <div className="px-12 py-4 space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Replies</h4>
              {!replies ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : replies.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No replies.</p>
              ) : (
                replies.map((reply: any) => (
                  <div key={reply.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm">{reply.message}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteReply(reply.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
