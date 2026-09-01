import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/webm",
]);

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  try {
    const music = await prisma.backgroundMusic.findUnique({ where: { id: 1 } });
    if (!music) return NextResponse.json({ music: null });
    const includeData = new URL(req.url).searchParams.get("data") === "1";
    return NextResponse.json({
      music: {
        ...(includeData ? { src: `data:${music.mimeType};base64,${music.data}` } : {}),
        fileName: music.fileName,
        mimeType: music.mimeType,
        updatedAt: music.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to load background music:", err);
    return NextResponse.json({ music: null });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const audio = formData?.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Choose an audio file first." }, { status: 400 });
  if (!ALLOWED_AUDIO_TYPES.has(audio.type)) return NextResponse.json({ error: "Use MP3, WAV, OGG, M4A, AAC, or WebM audio." }, { status: 400 });
  if (audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: "Keep the background track under 3MB for reliable Vercel uploads." }, { status: 400 });

  try {
    const bytes = Buffer.from(await audio.arrayBuffer());
    const music = await prisma.backgroundMusic.upsert({
      where: { id: 1 },
      create: { id: 1, fileName: audio.name.slice(0, 180), mimeType: audio.type, data: bytes.toString("base64") },
      update: { fileName: audio.name.slice(0, 180), mimeType: audio.type, data: bytes.toString("base64") },
    });
    return NextResponse.json({ fileName: music.fileName, updatedAt: music.updatedAt.toISOString() }, { status: 201 });
  } catch (err) {
    console.error("Failed to save background music:", err);
    return NextResponse.json({ error: "Couldn't save that track. Check your database connection and try again." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  try {
    await prisma.backgroundMusic.deleteMany({ where: { id: 1 } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to remove background music:", err);
    return NextResponse.json({ error: "Couldn't remove that track." }, { status: 500 });
  }
}
