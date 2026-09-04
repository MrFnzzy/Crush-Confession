import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unlike /api/music (small JSON metadata for the whole playlist), this
// route streams one track's actual audio bytes with a real Content-Type
// and a long, immutable Cache-Control header. A track's bytes never
// change after upload (removing and re-adding is how you'd "replace"
// one), so caching forever on the id alone is safe — no version query
// param needed the way the old single-track route needed one.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse(null, { status: 400 });

  try {
    const track = await prisma.backgroundMusicTrack.findUnique({ where: { id } });
    if (!track) return new NextResponse(null, { status: 404 });

    const bytes = Buffer.from(track.data, "base64");
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": track.mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Failed to stream background music track:", err);
    return new NextResponse(null, { status: 500 });
  }
}
