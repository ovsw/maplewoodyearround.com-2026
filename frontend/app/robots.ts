import { MetadataRoute } from "next";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        ...(isProduction ? { allow: "/" } : { disallow: "/" }),
      },
    ],
    sitemap: [`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`],
  };
}
