import { siteName } from "./site-name";

export type WebsiteJsonLd = {
  "@context": "https://schema.org";
  "@graph": [
    {
      "@type": "Organization";
      "@id": string;
      name: string;
      url: string;
      description?: string;
      logo?: string;
      email?: string;
      telephone?: string;
      address?: string;
      sameAs?: string[];
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

/** Organization facts from Global Settings, as the live site's FluidSEO sent them. */
export type OrganizationDetails = {
  description?: string | null;
  logo?: string | null;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
  sameAs?: Array<string | null | undefined> | null;
};

function presentFields(details: OrganizationDetails) {
  const sameAs = details.sameAs?.filter((url): url is string => Boolean(url?.trim()));
  return Object.fromEntries(
    Object.entries({ ...details, sameAs: sameAs?.length ? sameAs : undefined })
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => value),
  );
}

export function createWebsiteJsonLd(
  siteUrl: string,
  organization: OrganizationDetails = {},
): WebsiteJsonLd {
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
        ...presentFields(organization),
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
