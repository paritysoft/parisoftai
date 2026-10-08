import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, jetbrainsMono, manrope } from "./fonts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ParitySoft AI | Mobile App & Software Development", template: "%s | ParitySoft AI" },
  applicationName: "ParitySoft AI",
};

export const viewport: Viewport = {
  themeColor: "#090F1E",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
