/**
 * A confession can attach a GIF picked from the GIF library in the
 * composer. We only ever accept a URL, never a file upload, so all we can
 * validate server-side is that it looks like a real GIF served from a
 * provider we trust (Giphy, Tenor, or Klipy's media CDNs). This keeps the
 * field from being used to smuggle in an arbitrary/unsafe URL.
 *
 * Klipy serves gif files from static.klipy.com; the `endsWith` check
 * below matches that (and any other klipy.com subdomain) via "klipy.com".
 */
const ALLOWED_GIF_HOSTS = [
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "i.giphy.com",
  "media.tenor.com",
  "c.tenor.com",
  "tenor.com",
  "klipy.com",
];

export function isAllowedGifUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0 || url.length > 500) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_GIF_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}
