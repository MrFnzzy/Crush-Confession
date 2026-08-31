import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const confession = await prisma.confession.findUnique({ where: { id } });
  if (!confession || confession.isDeleted) {
    return NextResponse.json({ error: "Confession not found." }, { status: 404 });
  }

  await prisma.confession.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({ ok: true });
}
