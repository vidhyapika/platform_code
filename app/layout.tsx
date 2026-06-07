import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero-section.png",
        width: 1200,
        height: 630,
        alt: "Vidhyapika learning platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/hero-section.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/vidhyapika_favicon/favicon.ico" },
      { url: "/vidhyapika_favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/vidhyapika_favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/vidhyapika_favicon/apple-touch-icon.png",
  },
  manifest: "/vidhyapika_favicon/site.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
