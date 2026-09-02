"use client";

import { useState } from "react";

export default function AdminTabs({
  moderatePanel,
  filterPanel,
  announcePanel,
  musicPanel,
  statusPanel,
}: {
  moderatePanel: React.ReactNode;
  filterPanel: React.ReactNode;
  announcePanel: React.ReactNode;
  musicPanel: React.ReactNode;
  statusPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"moderate" | "filter" | "announce" | "music" | "status">("moderate");

  return (
    <div>
      <div className="mb-8 inline-flex flex-wrap gap-1 rounded-full border border-white/15 bg-night/60 p-1">
        <button
          onClick={() => setTab("moderate")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            tab === "moderate" ? "bg-lime text-night" : "text-muted hover:text-paper"
          }`}
        >
          Moderate
        </button>
        <button
          onClick={() => setTab("filter")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            tab === "filter" ? "bg-lime text-night" : "text-muted hover:text-paper"
          }`}
        >
          Filtered words
        </button>
        <button
          onClick={() => setTab("announce")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            tab === "announce" ? "bg-lime text-night" : "text-muted hover:text-paper"
          }`}
        >
          Announce
        </button>
        <button
          onClick={() => setTab("music")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            tab === "music" ? "bg-lime text-night" : "text-muted hover:text-paper"
          }`}
        >
          Music
        </button>
        <button
          onClick={() => setTab("status")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            tab === "status" ? "bg-lime text-night" : "text-muted hover:text-paper"
          }`}
        >
          Shutdown
        </button>
      </div>

      <div hidden={tab !== "moderate"}>{moderatePanel}</div>
      <div hidden={tab !== "filter"}>{filterPanel}</div>
      <div hidden={tab !== "announce"}>{announcePanel}</div>
      <div hidden={tab !== "music"}>{musicPanel}</div>
      <div hidden={tab !== "status"}>{statusPanel}</div>
    </div>
  );
}
