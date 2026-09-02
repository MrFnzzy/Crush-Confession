/** How often the client is expected to send a heartbeat. Keep in sync
 * with the interval in components/PresenceTracker.tsx. */
export const PRESENCE_HEARTBEAT_MS = 20_000;

/** A session counts as "live" if its last heartbeat was within this
 * window. Set to a couple of missed beats' worth of slack so a slow
 * network blip doesn't make someone flicker off the count. */
export const PRESENCE_WINDOW_MS = 45_000;

export const PRESENCE_COOKIE = "unspoken_presence_session";
