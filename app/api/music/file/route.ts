import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unlike /api/music (which just returns small JSON metadata), this route
// streams the actual audio bytes with a real Content-Type and a long,
// immutable Cache-Control header. The caller includes the track's
// updatedAt timestamp as ?v=..., so the URL itself changes whenever the
// admin uploads a new track — that's what makes "immutable, cache
// forever" safe: an old cached URL simply stops being requested once the
// track changes, no manual invalidation needed.
//
// This is what actually saves bandwidth: previously the full file was
// re-downloaded as base64 JSON on every page load with caching disabled.
// Now a visitor's browser (and Vercel's edge network) only fetches the
// bytes once per track version, no matter how many times they reload or
// how many tabs they open.
export async function GET(req: NextRequest) {
  try {
    const music = await prisma.backgroundMusic.findUnique({ where: { id: 1 } });
    if (!music) return new NextResponse(null, { status: 404 });

    const bytes = Buffer.from(music.data, "base64");
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": music.mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Failed to stream background music:", err);
    return new NextResponse(null, { status: 500 });
  }
}
