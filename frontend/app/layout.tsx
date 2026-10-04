import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { siteName } from "@/lib/site-name";
import { Toaster } from "@/components/ui/sonner";
import { Lato, Halant, Poppins } from "next/font/google";
import { Suspense } from "react";
import { SiteAnalyticsLoader } from "@/components/site-analytics-loader";

import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const halant = Halant({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-halant",
  display: "swap",
  preload: false,
});

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
    <html
      lang="en"
      className={`${lato.variable} ${poppins.variable} ${halant.variable}`}
    >
      <body>
        {children}
        <Toaster position="top-center" richColors />
        <Suspense fallback={null}>
          <SiteAnalyticsLoader />
        </Suspense>
      </body>
    </html>
  );
}
