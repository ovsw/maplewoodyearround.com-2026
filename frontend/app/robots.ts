import { MetadataRoute } from "next";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Same rules as the Webflow site: no URLs with a query string.
        ...(isProduction ? { allow: "/", disallow: "/*?" } : { disallow: "/" }),
      },
    ],
    sitemap: [`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`],
  };
}
