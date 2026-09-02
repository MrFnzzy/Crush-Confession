import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";
import { DEFAULT_SHUTDOWN_MESSAGE, getSiteSettings, setSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 200;

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const shutdown = body.shutdown === true;
  const rawMessage = typeof body.shutdownMessage === "string" ? body.shutdownMessage.trim() : "";
  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Keep the message under ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }
  const shutdownMessage = rawMessage || DEFAULT_SHUTDOWN_MESSAGE;

  try {
    await setSiteSettings({ shutdown, shutdownMessage });
    return NextResponse.json({ shutdown, shutdownMessage });
  } catch (err) {
    console.error("Failed to save site status:", err);
    return NextResponse.json(
      { error: "Couldn't save that. Check your database connection and try again." },
      { status: 500 }
    );
  }
}
