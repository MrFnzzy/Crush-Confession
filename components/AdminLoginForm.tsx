"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function AdminLoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter the admin password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Wrong password.");
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.push(msg, "error");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pin relative w-full max-w-sm rounded-note bg-paper p-8 text-ink shadow-noteLg"
    >
      <Link href="/" className="text-xs text-slateInk/60 transition hover:text-roseDeep">
        ← back home
      </Link>
      <h1 className="mt-4 font-display text-2xl">Admin</h1>
      <p className="mt-1 text-sm text-slateInk">Enter the admin password to manage the wall.</p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="mt-6 w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink focus:border-rose"
      />

      {error && (
        <p className="mt-2 text-sm text-roseDeep" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-full bg-ink px-6 py-3 font-medium text-paper transition hover:bg-inkLight disabled:opacity-60"
      >
        {busy ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
