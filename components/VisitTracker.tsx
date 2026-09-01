"use client";

import { useEffect } from "react";

const SESSION_KEY = "unspoken_visit_recorded";
let requestInFlight = false;

export default function VisitTracker() {
  useEffect(() => {
    let alreadyRecorded = false;
    try {
      alreadyRecorded = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage may be unavailable; the request can still be attempted.
    }

    if (alreadyRecorded || requestInFlight) return;
    requestInFlight = true;

    void fetch("/api/visits", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Visit request failed with ${response.status}`);
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // The server-side cookie still prevents duplicate counting.
        }
      })
      .catch(() => {
        // A failed request is intentionally not marked as recorded, so the next visit can retry.
      })
      .finally(() => {
        requestInFlight = false;
      });
  }, []);

  return null;
}
