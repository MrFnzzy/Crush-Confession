"use client";

import { useEffect } from "react";

const SESSION_KEY = "unspoken_visit_recorded";

export default function VisitTracker() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // If browser storage is unavailable, the visit is simply not counted.
      return;
    }

    void fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the visitor experience.
    });
  }, []);

  return null;
}
