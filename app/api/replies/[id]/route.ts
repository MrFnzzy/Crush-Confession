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
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  await prisma.reply.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
