"use client";

// Client-side half of "notify me if someone replies". No accounts here —
// a push subscription is just tied to this browser on this device
// (VAPID endpoint + keys), the same anonymous-trace pattern as the
// relate/guess tracking already done in localStorage elsewhere in the app.
// Clearing browser data, switching devices, or using a different browser
// loses the subscription — there's nothing to re-link it to.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

async function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js");
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "server" };

/**
 * Requests notification permission (if needed), subscribes this browser to
 * push, and links that subscription to a specific confession server-side.
 * Reuses an existing push subscription if this browser already has one
 * (from subscribing to a different confession earlier).
 */
export async function subscribeToConfessionReplies(confessionId: number): Promise<SubscribeResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  try {
    const registration = await registerServiceWorker();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confessionId, subscription: subscription.toJSON() }),
    });
    if (!res.ok) return { ok: false, reason: "server" };
    return { ok: true };
  } catch (err) {
    console.error("Failed to subscribe to push:", err);
    return { ok: false, reason: "server" };
  }
}

const NOTIFY_KEY = "unspoken_notify_ids";

export function getNotifyIds(): number[] {
  try {
    const raw = window.localStorage.getItem(NOTIFY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifyId(id: number) {
  try {
    window.localStorage.setItem(NOTIFY_KEY, JSON.stringify([...new Set([...getNotifyIds(), id])]));
  } catch {
    // ignore — worst case the bell just doesn't remember its state locally
  }
}
