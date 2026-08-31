import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.visit.create({ data: {} });
  return new NextResponse(null, { status: 204 });
}
