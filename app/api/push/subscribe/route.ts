import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { allowed, retryAfterSeconds } = rateLimit(`push-subscribe:${getClientKey(req)}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Slow down a little and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const confessionId = Number(body.confessionId);
  const subscription = body.subscription;
  if (!Number.isInteger(confessionId) || confessionId <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }
  if (
    !subscription ||
    typeof subscription.endpoint !== "string" ||
    !subscription.endpoint ||
    typeof subscription.keys?.p256dh !== "string" ||
    typeof subscription.keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  try {
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      select: { id: true },
    });
    if (!confession) {
      return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
    }

    await prisma.confessionPushSubscription.upsert({
      where: { confessionId_endpoint: { confessionId, endpoint: subscription.endpoint } },
      create: {
        confessionId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save push subscription:", err);
    return NextResponse.json({ error: "Couldn't save that. Please try again in a moment." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const confessionId = Number(body?.confessionId);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";

  if (!Number.isInteger(confessionId) || confessionId <= 0 || !endpoint) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await prisma.confessionPushSubscription.deleteMany({ where: { confessionId, endpoint } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to remove push subscription:", err);
    return NextResponse.json({ error: "Couldn't remove that." }, { status: 500 });
  }
}
