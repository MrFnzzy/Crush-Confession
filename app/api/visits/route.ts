import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VISIT_COOKIE = "unspoken_visit_session";

export async function POST() {
  const cookieStore = cookies();
  if (cookieStore.get(VISIT_COOKIE)) {
    return NextResponse.json({ counted: false });
  }

  try {
    await prisma.visit.create({ data: {} });

    const response = NextResponse.json({ counted: true });
    response.cookies.set(VISIT_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Visit tracking failed:", error);
    return NextResponse.json({ error: "Visit could not be recorded." }, { status: 503 });
  }
}
