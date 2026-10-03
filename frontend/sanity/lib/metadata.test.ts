import type {
  BLOG_INDEX_QUERY_RESULT,
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  POST_QUERY_RESULT,
  SEO_SETTINGS_QUERY_RESULT,
} from "@/sanity.types";
import type { CategoryArchive } from "@/sanity/queries/category";
import { describe, expect, it } from "vitest";
import { verifyPostOgImageSignature } from "@/lib/post-og-image";
import { verifyOgImageSignature } from "@/lib/post-og-image";
import {
  generateBlogIndexMetadata,
  generateCategoryMetadata,
  generatePageMetadata,
} from "./metadata";

const siteImageAsset = {
  _id: "image-site1234-2400x1600-jpg",
  url: "https://cdn.sanity.io/images/test-project/test/site1234-2400x1600.jpg",
  mimeType: "image/jpeg",
};

const siteSettings = {
  seoDescription: "Summer camp in Ontario.",
  seoImage: { asset: siteImageAsset },
} as unknown as SEO_SETTINGS_QUERY_RESULT;

function withMeta<T extends { meta?: object | null }>(doc: T, meta: object) {
  return { ...doc, meta: { ...doc.meta, ...meta } } as unknown as T;
}

const post = {
  _id: "post-1",
  _type: "post",
  _updatedAt: "2026-08-15T12:00:00Z",
  publishedAt: "2026-08-10T12:00:00Z",
  slug: { _type: "slug", current: "market-trends" },
  title: "Why Market Trends Change",
  meta: {
    title: "Market trends",
    description: "A practical method rate explanation.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<POST_QUERY_RESULT>;

const page = {
  _id: "page-1",
  _type: "page",
  _updatedAt: "2026-08-15T12:00:00Z",
  slug: "about",
  title: "About",
  meta: {
    title: "About | About Example Company",
    description: "About Example Company.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<PAGE_QUERY_RESULT>;

const homePage = {
  _id: "homePage",
  _type: "homePage",
  title: "Home",
  meta: {
    title: "Example Knowledge Base | Example Company",
    description: "A practical resource library.",
    noindex: false,
  },
} as unknown as NonNullable<HOME_PAGE_QUERY_RESULT>;

const blogIndex = {
  _id: "blogIndex",
  _type: "blogIndex",
  title: "Insights Blog",
  description: "Practical method guidance.",
  meta: {
    title: "Method Advice | Example Company",
    description: "Practical method guidance.",
    image: null,
    noindex: false,
  },
} as unknown as NonNullable<BLOG_INDEX_QUERY_RESULT>;

const category = {
  _id: "category-1",
  _type: "category",
  title: "Categories",
  slug: { current: "categories" },
  description: "Compare service options.",
  publishedPostCount: 4,
  meta: {
    title: "Resource Guides | Example Company",
    description: "Compare service options.",
    image: null,
    noindex: false,
  },
} satisfies CategoryArchive;

describe("generatePageMetadata", () => {
  it("uses one signed generated card for post Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page: post, path: "/blog/market-trends" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph.type).toBe("article");
    expect(metadata.title).toBe("Market trends");
    expect(metadata.openGraph.title).toBe(
      "Market trends | Example Company",
    );
    expect(metadata.openGraph).toHaveProperty(
      "publishedTime",
      post.publishedAt,
    );
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alt: `${post.title} | Example Company`,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Market trends | Example Company",
      images: [image],
    });
    expect(
      verifyPostOgImageSignature({
        identity: {
          slug: "market-trends",
          revision: url.searchParams.get("rev") || "",
          version: url.searchParams.get("v") || "",
        },
        secret: process.env.OG_IMAGE_SECRET || "",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
  });

  it("uses a signed generated card for ordinary page Open Graph and Twitter metadata", () => {
    const metadata = generatePageMetadata({ page, path: "/about" });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(metadata.openGraph).toMatchObject({
      title: "About | About Example Company",
      type: "website",
      images: [
        { width: 1200, height: 630, alt: "About | About Example Company" },
      ],
    });
    expect(url.pathname).toBe("/api/og/page/page/about");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "About | About Example Company",
      images: [image],
    });
    expect(
      verifyOgImageSignature({
        identity: {
          key: "page:about",
          revision: url.searchParams.get("rev") || "",
          version: url.searchParams.get("v") || "",
        },
        secret: process.env.OG_IMAGE_SECRET || "",
        signature: url.searchParams.get("sig") || "",
      }),
    ).toBe(true);
    expect(metadata.title).toEqual({
      absolute: "About | About Example Company",
    });
  });

  it("falls back to the content title when the override is missing", () => {
    const pageWithoutOverride = {
      ...page,
      meta: { ...page.meta, title: null },
    } as NonNullable<PAGE_QUERY_RESULT>;
    const metadata = generatePageMetadata({
      page: pageWithoutOverride,
      path: "/about/",
    });

    expect(metadata.title).toBe("About");
    expect(metadata.openGraph.title).toBe(
      "About | Example Company",
    );
  });

  it("prefers an editor-selected sharing image, formatted to 1200 × 630", () => {
    const pageWithImage = {
      ...page,
      meta: {
        ...page.meta,
        image: {
          asset: {
            _id: "image-social1234-1600x900-jpg",
            url: "https://cdn.sanity.io/images/test-project/test/social1234-1600x900.jpg",
            mimeType: "image/jpeg",
            metadata: { dimensions: { width: 1600, height: 900 } },
          },
          crop: { top: 0.1, bottom: 0.1, left: 0, right: 0.2 },
          hotspot: { x: 0.3, y: 0.5, width: 0.2, height: 0.2 },
        },
      },
    } as unknown as NonNullable<PAGE_QUERY_RESULT>;

    const metadata = generatePageMetadata({
      page: pageWithImage,
      path: "/about",
      settings: siteSettings,
    });
    const image = metadata.openGraph.images[0];
    const url = new URL(image.url);

    expect(url.origin + url.pathname).toBe(
      "https://cdn.sanity.io/images/test-project/test/social1234-1600x900.jpg",
    );
    expect(url.searchParams.get("w")).toBe("1200");
    expect(url.searchParams.get("h")).toBe("630");
    // The saved crop and hotspot choose the visible region.
    expect(url.searchParams.get("rect")).toBeTruthy();
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alt: "About | About Example Company",
    });
    expect(metadata.twitter.images).toEqual([image]);
  });

  it("uses the override's own alt text when it has one", () => {
    const metadata = generatePageMetadata({
      page: withMeta(page, {
        image: { alt: "Campers on the dock", asset: siteImageAsset },
      }),
      path: "/about",
    });

    expect(metadata.openGraph.images[0].alt).toBe("Campers on the dock");
  });

  it("ignores an override whose asset no longer resolves", () => {
    const metadata = generatePageMetadata({
      page: withMeta(page, { image: { asset: null } }),
      path: "/about",
      settings: siteSettings,
    });

    expect(new URL(metadata.openGraph.images[0].url).pathname).toBe(
      "/api/og/page/page/about",
    );
  });

  it("uses the Site sharing image when no generated card is available", () => {
    const metadata = generatePageMetadata({
      page: { ...page, title: "" } as NonNullable<PAGE_QUERY_RESULT>,
      path: "/not//valid",
      settings: siteSettings,
    });
    const image = metadata.openGraph.images[0];

    expect(image.url).toContain("site1234-2400x1600.jpg");
    expect(image).toMatchObject({ width: 1200, height: 630 });
    expect(metadata.twitter.images).toEqual([image]);
  });

  it("uses the static safety image when nothing else is usable", () => {
    const metadata = generatePageMetadata({
      page: { ...page, title: "" } as NonNullable<PAGE_QUERY_RESULT>,
      path: "/not//valid",
      settings: { seoDescription: null, seoImage: { asset: null } } as never,
    });

    expect(metadata.openGraph.images[0].url).toBe(
      "https://example.test/images/og-placeholder.svg",
    );
  });

  it("uses one absolute, branded homepage title", () => {
    const metadata = generatePageMetadata({ page: homePage, path: "/" });

    expect(metadata.title).toEqual({
      absolute: "Example Knowledge Base | Example Company",
    });
    expect(metadata.openGraph.title).toBe(
      "Example Knowledge Base | Example Company",
    );
    expect(metadata.twitter.title).toBe(
      "Example Knowledge Base | Example Company",
    );
    expect(metadata.openGraph.images[0].alt).toBe(
      "Example Knowledge Base | Example Company",
    );
  });
});

describe("generateBlogIndexMetadata", () => {
  it("derives a unique branded title for pagination", () => {
    const metadata = generateBlogIndexMetadata({ blogIndex, page: 2 });
    const title = "Method Advice | Example Company - Page 2";

    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.openGraph.title).toBe(title);
    expect(metadata.openGraph.images[0].alt).toBe(title);
    expect(metadata.twitter.title).toBe(title);
  });
});

describe("generateCategoryMetadata", () => {
  it.each([
    [1, "Resource Guides | Example Company"],
    [2, "Resource Guides | Example Company - Page 2"],
  ])("derives the category title for page %i", (pageNumber, pageTitle) => {
    const metadata = generateCategoryMetadata({ category, page: pageNumber });

    expect(metadata.title).toEqual({ absolute: pageTitle });
    expect(metadata.openGraph.title).toBe(pageTitle);
    expect(metadata.openGraph.images[0].alt).toBe(pageTitle);
    expect(metadata.twitter.title).toBe(pageTitle);
  });
});

describe("description resolution", () => {
  function descriptions(metadata: {
    description?: string;
    openGraph: { description?: string };
    twitter: { description?: string };
  }) {
    return [
      metadata.description,
      metadata.openGraph.description,
      metadata.twitter.description,
    ];
  }

  it("uses the SEO description for search, Open Graph, and Twitter", () => {
    const metadata = generatePageMetadata({ page, path: "/about", settings: siteSettings });

    expect(descriptions(metadata)).toEqual(Array(3).fill("About Example Company."));
  });

  it("falls back to the page description when the SEO description is blank", () => {
    const metadata = generatePageMetadata({
      page: {
        ...withMeta(page, { description: "   " }),
        description: "Our camp story.",
      } as NonNullable<PAGE_QUERY_RESULT>,
      path: "/about",
      settings: siteSettings,
    });

    expect(descriptions(metadata)).toEqual(Array(3).fill("Our camp story."));
  });

  it("falls back to the post summary text", () => {
    const metadata = generatePageMetadata({
      page: {
        ...withMeta(post, { description: null }),
        excerpt: "A short summary.",
      } as NonNullable<POST_QUERY_RESULT>,
      path: "/blog/market-trends",
      settings: siteSettings,
    });

    expect(descriptions(metadata)).toEqual(Array(3).fill("A short summary."));
  });

  it("falls back to the site-wide description, then to none", () => {
    const bare = withMeta(homePage, { description: "" });

    expect(
      descriptions(generatePageMetadata({ page: bare, path: "/", settings: siteSettings })),
    ).toEqual(Array(3).fill("Summer camp in Ontario."));
    expect(
      descriptions(generatePageMetadata({ page: bare, path: "/", settings: null })),
    ).toEqual([undefined, undefined, undefined]);
  });

  it("adds archive pagination wording after choosing the base description", () => {
    const listing = withMeta(
      { ...blogIndex, description: " " } as NonNullable<BLOG_INDEX_QUERY_RESULT>,
      { description: null },
    );
    const metadata = generateBlogIndexMetadata({
      blogIndex: listing,
      page: 2,
      settings: siteSettings,
    });

    expect(descriptions(metadata)).toEqual(
      Array(3).fill("Summer camp in Ontario. Page 2."),
    );
    expect(metadata.alternates.canonical).toBe("https://example.test/blog/2");
  });

  it("uses category description fallbacks with pagination", () => {
    const metadata = generateCategoryMetadata({
      category: { ...category, meta: { ...category.meta, description: null } },
      page: 2,
      settings: siteSettings,
    });

    expect(descriptions(metadata)).toEqual(
      Array(3).fill("Compare service options. Page 2."),
    );
  });
});

describe("listing sharing images", () => {
  const override = { image: { asset: siteImageAsset } };

  it("applies the override to the blog index and category listings", () => {
    const blog = generateBlogIndexMetadata({
      blogIndex: withMeta(blogIndex, override),
      page: 1,
    });
    const archive = generateCategoryMetadata({
      category: withMeta(category, override),
      page: 1,
    });

    for (const metadata of [blog, archive]) {
      expect(metadata.openGraph.images[0].url).toContain("site1234-2400x1600.jpg");
      expect(metadata.twitter.images).toEqual(metadata.openGraph.images);
    }
  });

  it("keeps generated cards for listings without an override", () => {
    const metadata = generateCategoryMetadata({ category, page: 2, settings: siteSettings });

    expect(new URL(metadata.openGraph.images[0].url).pathname).toBe(
      "/api/og/page/category/categories/2",
    );
    expect(metadata.alternates.canonical).toBe(
      "https://example.test/blog/category/categories/2",
    );
  });

  it("uses the Site sharing image for a category slug the card route cannot serve", () => {
    const metadata = generateCategoryMetadata({
      category: { ...category, slug: { current: "a/b" } },
      page: 1,
      settings: siteSettings,
    });

    expect(metadata.openGraph.images[0].url).toContain("site1234-2400x1600.jpg");
  });
});
