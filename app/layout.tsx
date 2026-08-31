import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

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
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "unspoken — say the thing you never said",
    template: "%s · unspoken",
  },
  description:
    "Write an anonymous confession to your crush and watch it land on the wall for everyone to read — and maybe, to answer.",
  applicationName: "unspoken",
  openGraph: {
    title: "unspoken — say the thing you never said",
    description:
      "Write an anonymous confession to your crush and watch it land on the wall.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1B1029",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`}
    >
      <body className="font-body min-h-screen overflow-x-hidden">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
