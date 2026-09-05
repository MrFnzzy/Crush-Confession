import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const DEFAULT_SHUTDOWN_MESSAGE = "we're taking a quick break. back soon.";
const SITE_SETTINGS_TAG = "site-settings";

export type SiteSettingsData = {
  shutdown: boolean;
  shutdownMessage: string;
};

const DEFAULTS: SiteSettingsData = {
  shutdown: false,
  shutdownMessage: DEFAULT_SHUTDOWN_MESSAGE,
};

// Wrapped in Next.js's Data Cache with no time-based revalidate — it only
// ever refreshes when an admin flips the switch (setSiteSettings below
// calls revalidateTag). That means every visitor page load and API call
// reads this from Next's cache, not from Postgres: turning this feature
// on adds no extra database compute or network transfer to normal
// traffic, only to the rare moment an admin actually toggles it.
const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsData> => {
    try {
      const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
      if (!row) return DEFAULTS;
      return {
        shutdown: row.shutdown,
        shutdownMessage: row.shutdownMessage || DEFAULT_SHUTDOWN_MESSAGE,
      };
    } catch (err) {
      // If the DB is unreachable, fail open (site stays live) rather than
      // accidentally locking everyone out because of an unrelated outage.
      console.error("Failed to load site settings, defaulting to live:", err);
      return DEFAULTS;
    }
  },
  ["site-settings"],
  { tags: [SITE_SETTINGS_TAG] }
);

export async function getSiteSettings(): Promise<SiteSettingsData> {
  return getCachedSiteSettings();
}

export async function setSiteSettings(data: SiteSettingsData): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  revalidateTag(SITE_SETTINGS_TAG);
}
