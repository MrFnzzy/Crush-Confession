"use client";

import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence";

/** Keeps this tab "checked in" as an active visitor for the admin
 * dashboard's live-visitor count. Sends a heartbeat on load and every
 * ~20s after; sends a best-effort "leave" beacon when the tab closes so
 * the count drops right away instead of waiting for the heartbeat to go
 * stale. No identity or IP is stored — just an anonymous session id in a
 * cookie, same privacy model as the existing visit counter. */
export default function PresenceTracker() {
  useEffect(() => {
    let cancelled = false;

    const beat = () => {
      if (cancelled) return;
      void fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {});
    };

    beat();
    const interval = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);

    const leave = () => {
      try {
        navigator.sendBeacon("/api/presence/leave");
      } catch {
        // sendBeacon isn't available; the heartbeat will just go stale.
      }
    };
    window.addEventListener("pagehide", leave);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("pagehide", leave);
    };
  }, []);

  return null;
}
