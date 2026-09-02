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
const MIN_VOLUME = 0;
const MAX_VOLUME = 3; // 300% — see the comment on BackgroundMusic.volume in schema.prisma
const DEFAULT_VOLUME = 0.22;

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  try {
    const music = await prisma.backgroundMusic.findUnique({ where: { id: 1 } });
    if (!music) return NextResponse.json({ music: null });
    return NextResponse.json({
      music: {
        fileName: music.fileName,
        mimeType: music.mimeType,
        updatedAt: music.updatedAt.toISOString(),
        volume: music.volume,
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

  // A new upload keeps whatever volume is already set (defaulting for a
  // first-ever upload) rather than silently resetting it, so replacing the
  // track doesn't undo a volume the admin already dialed in.
  const existing = await prisma.backgroundMusic.findUnique({ where: { id: 1 }, select: { volume: true } });

  try {
    const bytes = Buffer.from(await audio.arrayBuffer());
    const music = await prisma.backgroundMusic.upsert({
      where: { id: 1 },
      create: { id: 1, fileName: audio.name.slice(0, 180), mimeType: audio.type, data: bytes.toString("base64"), volume: existing?.volume ?? DEFAULT_VOLUME },
      update: { fileName: audio.name.slice(0, 180), mimeType: audio.type, data: bytes.toString("base64") },
    });
    return NextResponse.json({ fileName: music.fileName, updatedAt: music.updatedAt.toISOString(), volume: music.volume }, { status: 201 });
  } catch (err) {
    console.error("Failed to save background music:", err);
    return NextResponse.json({ error: "Couldn't save that track. Check your database connection and try again." }, { status: 500 });
  }
}

// PATCH { volume } — adjusts loudness only, without needing to re-upload
// the track. Kept separate from POST since that one is a multipart file
// upload; this is a small JSON body.
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const volume = typeof body?.volume === "number" ? body.volume : NaN;
  if (!Number.isFinite(volume) || volume < MIN_VOLUME || volume > MAX_VOLUME) {
    return NextResponse.json({ error: `Volume must be between ${MIN_VOLUME * 100}% and ${MAX_VOLUME * 100}%.` }, { status: 400 });
  }

  try {
    const music = await prisma.backgroundMusic.update({ where: { id: 1 }, data: { volume } });
    return NextResponse.json({ volume: music.volume, updatedAt: music.updatedAt.toISOString() });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Upload a track first." }, { status: 404 });
    }
    console.error("Failed to update background music volume:", err);
    return NextResponse.json({ error: "Couldn't save that volume. Try again." }, { status: 500 });
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
