"use client";

import { useState } from "react";

export default function AdminTabs({
  moderatePanel,
  filterPanel,
}: {
  moderatePanel: React.ReactNode;
  filterPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"moderate" | "filter">("moderate");

  return (
    <div>
      <div className="mb-8 inline-flex gap-1 rounded-full border border-white/15 bg-night/60 p-1">
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
      </div>

      <div hidden={tab !== "moderate"}>{moderatePanel}</div>
      <div hidden={tab !== "filter"}>{filterPanel}</div>
    </div>
  );
}
