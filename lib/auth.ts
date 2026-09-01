import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "confession_admin";

/**
 * We don't store sessions anywhere. Instead the cookie's value IS proof of
 * login: it's an HMAC of a fixed string, keyed with ADMIN_SECRET. Only
 * someone who already knows ADMIN_SECRET (i.e. our own login route, after
 * checking ADMIN_PASSWORD) can produce a valid value.
 */
function expectedToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET is not set. Add it to your environment variables."
    );
  }
  return createHmac("sha256", secret).update("confession-wall-admin").digest("hex");
}

export function checkAdminPassword(password: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getAdminCookieValue(): string {
  return expectedToken();
}

/** For use in server components / route handlers reading the incoming request cookies. */
export function isAdminFromCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(expectedToken());
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Convenience for server components (app router) using next/headers. */
export function isAdmin(): boolean {
  const jar = cookies();
  const value = jar.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminFromCookieValue(value);
}
