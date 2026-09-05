import { randomUUID } from "crypto";

/** Reads the presence session id from a cookie value, generating a new
 * one if it's missing or malformed. Callers are responsible for writing
 * the returned id back onto the response when `isNew` is true.
 *
 * Server-only (uses Node's `crypto`) — kept out of lib/presence.ts so
 * that file stays safe to import from client components. */
export function resolvePresenceSessionId(cookieValue: string | undefined): {
  sessionId: string;
  isNew: boolean;
} {
  if (cookieValue && /^[a-f0-9-]{36}$/i.test(cookieValue)) {
    return { sessionId: cookieValue, isNew: false };
  }
  return { sessionId: randomUUID(), isNew: true };
}
