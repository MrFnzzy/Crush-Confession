import ShutdownScreen from "@/components/ShutdownScreen";
import ConfessForm from "@/components/ConfessForm";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function ConfessPage() {
  const { shutdown, shutdownMessage } = await getSiteSettings();
  if (shutdown) return <ShutdownScreen message={shutdownMessage} />;

  return <ConfessForm />;
}
