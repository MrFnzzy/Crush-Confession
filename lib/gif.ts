/**
 * A confession can attach a GIF picked from the GIF library in the
 * composer. We only ever accept a URL, never a file upload, so all we can
 * validate server-side is that it looks like a real GIF served from a
 * provider we trust (Giphy, Tenor, or Klipy's media CDNs). This keeps the
 * field from being used to smuggle in an arbitrary/unsafe URL.
 *
 * NOTE on "klipy.com": Klipy's exact media-CDN hostname isn't nailed down
 * in their public docs the way Giphy/Tenor's are. The `endsWith` check
 * below already covers any subdomain (media.klipy.com, cdn.klipy.com,
 * etc). Once you've got a real Klipy API key and pull a gif in the
 * picker, check the actual `previewUrl`/`url` host in devtools and
 * tighten this to that exact hostname if it differs.
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
