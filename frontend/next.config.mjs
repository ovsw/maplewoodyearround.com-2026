import { createClient } from "@sanity/client";
import { sanity } from "next-sanity/live/cache-life";

import { compileNextRedirects } from "./lib/redirects.mjs";
import { REDIRECTS_QUERY } from "./sanity/queries/redirects.ts";

function requiredEnvironmentValue(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  cacheLife: { default: sanity },
  async redirects() {
    const client = createClient({
      projectId: requiredEnvironmentValue("NEXT_PUBLIC_SANITY_PROJECT_ID"),
      dataset: requiredEnvironmentValue("NEXT_PUBLIC_SANITY_DATASET"),
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-31",
      perspective: "published",
      token: process.env.SANITY_API_READ_TOKEN,
      useCdn: false,
    });
    const redirects = await client.fetch(REDIRECTS_QUERY);
    return compileNextRedirects(redirects);
  },
  images: {
    qualities: [75, 100],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
