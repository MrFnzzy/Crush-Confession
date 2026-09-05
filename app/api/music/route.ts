import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB per track
const MAX_TRACKS = 10;
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

async function trackList() {
  const tracks = await prisma.backgroundMusicTrack.findMany({
    where: { backgroundMusicId: 1 },
    orderBy: { order: "asc" },
    select: { id: true, fileName: true, mimeType: true, createdAt: true },
  });
  return tracks.map((t: { id: number; fileName: string; mimeType: string; createdAt: Date }) => ({
    id: t.id,
    fileName: t.fileName,
    mimeType: t.mimeType,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function GET() {
  try {
    const settings = await prisma.backgroundMusic.findUnique({ where: { id: 1 } });
    const tracks = await trackList();
    return NextResponse.json({ tracks, volume: settings?.volume ?? DEFAULT_VOLUME });
  } catch (err) {
    console.error("Failed to load background music:", err);
    return NextResponse.json({ tracks: [], volume: DEFAULT_VOLUME });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const audio = formData?.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Choose an audio file first." }, { status: 400 });
  if (!ALLOWED_AUDIO_TYPES.has(audio.type)) {
    return NextResponse.json({ error: "Use MP3, WAV, OGG, M4A, AAC, or WebM audio." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Keep each track under 10MB for reliable Vercel uploads." }, { status: 400 });
  }

  try {
    const existingCount = await prisma.backgroundMusicTrack.count({ where: { backgroundMusicId: 1 } });
    if (existingCount >= MAX_TRACKS) {
      return NextResponse.json({ error: `The playlist is full (max ${MAX_TRACKS} tracks) — remove one first.` }, { status: 400 });
    }

    const bytes = Buffer.from(await audio.arrayBuffer());
    await prisma.backgroundMusic.upsert({
      where: { id: 1 },
      create: { id: 1, volume: DEFAULT_VOLUME },
      update: {},
    });
    await prisma.backgroundMusicTrack.create({
      data: {
        backgroundMusicId: 1,
        fileName: audio.name.slice(0, 180),
        mimeType: audio.type,
        data: bytes.toString("base64"),
        order: existingCount,
      },
    });

    const tracks = await trackList();
    return NextResponse.json({ tracks }, { status: 201 });
  } catch (err) {
    console.error("Failed to save background music track:", err);
    return NextResponse.json({ error: "Couldn't save that track. Check your database connection and try again." }, { status: 500 });
  }
}

// PATCH { volume } — adjusts loudness for the whole playlist, without
// touching any track. Kept separate from POST since that one is a
// multipart file upload; this is a small JSON body.
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const volume = typeof body?.volume === "number" ? body.volume : NaN;
  if (!Number.isFinite(volume) || volume < MIN_VOLUME || volume > MAX_VOLUME) {
    return NextResponse.json({ error: `Volume must be between ${MIN_VOLUME * 100}% and ${MAX_VOLUME * 100}%.` }, { status: 400 });
  }

  try {
    const music = await prisma.backgroundMusic.upsert({
      where: { id: 1 },
      create: { id: 1, volume },
      update: { volume },
    });
    return NextResponse.json({ volume: music.volume, updatedAt: music.updatedAt.toISOString() });
  } catch (err) {
    console.error("Failed to update background music volume:", err);
    return NextResponse.json({ error: "Couldn't save that volume. Try again." }, { status: 500 });
  }
}

// DELETE /api/music?id=123 — removes a single track from the playlist.
// DELETE /api/music (no id) — clears the whole playlist, kept for
// backward compatibility with a full reset.
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const idParam = req.nextUrl.searchParams.get("id");
  try {
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid track." }, { status: 400 });
      await prisma.backgroundMusicTrack.deleteMany({ where: { id, backgroundMusicId: 1 } });
    } else {
      await prisma.backgroundMusicTrack.deleteMany({ where: { backgroundMusicId: 1 } });
    }
    const tracks = await trackList();
    return NextResponse.json({ ok: true, tracks });
  } catch (err) {
    console.error("Failed to remove background music track:", err);
    return NextResponse.json({ error: "Couldn't remove that track." }, { status: 500 });
  }
}
