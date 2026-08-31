"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-paper/30 px-4 py-2 text-sm text-paper transition hover:border-paper/60"
    >
      Log out
    </button>
  );
}
