import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { siteName } from "@/lib/site-name";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${siteName}`,
    default: siteName,
  },
  openGraph: {
    images: [
      {
        url: `${siteUrl}/images/og-placeholder.svg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
