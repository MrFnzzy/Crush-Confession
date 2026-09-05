"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function AdminLogoutButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.push("Couldn't log out — try again.", "error");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="rounded-full border border-paper/30 px-4 py-2 text-sm text-paper transition hover:border-paper/60 disabled:opacity-60"
    >
      {busy ? "Logging out..." : "Log out"}
    </button>
  );
}
