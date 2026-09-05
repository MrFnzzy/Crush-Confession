import webpush from "web-push";
import { prisma } from "./prisma";

// Web Push (the same standard behind real browser/PWA notifications) needs a
// VAPID keypair so push services (Chrome's FCM, Apple's push service for
// Safari/iOS, etc.) can verify these notifications are actually coming from
// this app. Generate your own with `npx web-push generate-vapid-keys` and
// set them as env vars (see .env.example). VAPID_SUBJECT should be a
// mailto: link or site URL — it's how push services can contact you if
// something's misbehaving.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@unspoken.local";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Notifies every browser subscribed to a confession that a new reply landed
 * on it. Best-effort per subscription: a device that revoked permission or
 * uninstalled the PWA fails with a 404/410 from the push service, which we
 * treat as "no longer valid" and clean up automatically so the table
 * doesn't accumulate dead rows. Never throws — a push failure should never
 * take down the reply request that triggered it.
 */
export async function sendReplyPush(confessionId: number, replyPreview: string) {
  if (!ensureConfigured()) return;

  let subs: { id: number; endpoint: string; p256dh: string; auth: string }[] = [];
  try {
    subs = await prisma.confessionPushSubscription.findMany({ where: { confessionId } });
  } catch (err) {
    console.error("Failed to load push subscriptions:", err);
    return;
  }
  if (subs.length === 0) return;

  const trimmedPreview = replyPreview.trim();
  const payload = JSON.stringify({
    title: "Someone replied 💬",
    body: trimmedPreview ? trimmedPreview.slice(0, 120) : "New reply on your confession.",
    url: "/wall",
    tag: `confession-${confessionId}`,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.confessionPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push send failed:", err?.message || err);
        }
      }
    })
  );
}
