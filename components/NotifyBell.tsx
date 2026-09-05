"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getNotifyIds, isPushSupported, saveNotifyId, subscribeToConfessionReplies } from "@/lib/pushClient";

export default function NotifyBell({ confessionId }: { confessionId: number }) {
  const toast = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setSubscribed(getNotifyIds().includes(confessionId));
  }, [confessionId]);

  if (!supported) return null;

  async function handleClick() {
    if (busy || subscribed) return;
    setBusy(true);
    const result = await subscribeToConfessionReplies(confessionId);
    setBusy(false);

    if (result.ok) {
      setSubscribed(true);
      saveNotifyId(confessionId);
      toast.push("You'll get notified if someone replies.", "success");
    } else if (result.reason === "denied") {
      toast.push("Notifications are blocked — enable them in your browser settings first.", "error");
    } else {
      toast.push("Couldn't turn on notifications right now.", "error");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy || subscribed}
      aria-pressed={subscribed}
      title={subscribed ? "You'll be notified of replies" : "Get notified when someone replies"}
      className={`rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 ${
        subscribed ? "bg-lime text-night" : "bg-night/5 hover:bg-lime hover:text-night"
      }`}
    >
      {subscribed ? "🔔 notifying" : busy ? "…" : "🔔 notify me"}
    </button>
  );
}
