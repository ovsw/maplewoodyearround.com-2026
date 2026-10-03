import { siteName } from "./site-name";

export type WebsiteJsonLd = {
  "@context": "https://schema.org";
  "@graph": [
    {
      "@type": "Organization";
      "@id": string;
      name: string;
      url: string;
    },
    {
      "@type": "WebSite";
      "@id": string;
      name: string;
      url: string;
      publisher: {
        "@id": string;
      };
    },
  ];
};

export function createWebsiteJsonLd(siteUrl: string): WebsiteJsonLd {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const organizationId = `${normalizedSiteUrl}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        url: normalizedSiteUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${normalizedSiteUrl}/#website`,
        name: siteName,
        url: normalizedSiteUrl,
        publisher: {
          "@id": organizationId,
        },
      },
    ],
  };
}

export function serializeWebsiteJsonLd(value: WebsiteJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
