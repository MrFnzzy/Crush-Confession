import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import VisitTracker from "@/components/VisitTracker";
import PresenceTracker from "@/components/PresenceTracker";
import LiveAnnouncer from "@/components/LiveAnnouncer";
import LiveBackgroundMusic from "@/components/LiveBackgroundMusic";
import PollPopup from "@/components/PollPopup";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "unspoken — say the thing", template: "%s · unspoken" },
  description: "A loud little corner for the thoughts you were too scared to send.",
  applicationName: "unspoken",
  openGraph: {
    title: "unspoken — say the thing",
    description: "Anonymous confessions. Real feelings. Zero awkward DMs.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body className="min-h-screen overflow-x-hidden font-body">
        <VisitTracker />
        <PresenceTracker />
        <LiveAnnouncer />
        <LiveBackgroundMusic />
        <PollPopup />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
