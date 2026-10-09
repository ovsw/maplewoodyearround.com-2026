import {
  BLOG_INDEX_QUERY_RESULT,
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  PARENT_DASHBOARD_QUERY_RESULT,
  POST_QUERY_RESULT,
  SEO_SETTINGS_QUERY_RESULT,
} from "@/sanity.types";
import {
  getCategoryArchivePath,
  getBlogCanonicalPath,
  getBlogPageDescription,
  getBlogPageTitle,
  isIndexableCategory,
} from "@/lib/blog-index";
import type { CategoryArchive } from "@/sanity/queries/category";
import { buildPostOgImageUrl, isValidOgSlug } from "@/lib/post-og-image";
import { siteName } from "@/lib/site-name";
import {
  buildPageOgImageUrl,
  getPageOgImageTitle,
  type PageOgImageTarget,
} from "@/lib/page-og-image";
import {
  SHARING_IMAGE_HEIGHT,
  SHARING_IMAGE_WIDTH,
  sharingImageUrl,
} from "@/sanity/lib/image";
import { resolveSeoTitle } from "../../../shared/seo-title";
import { resolveSeoDescription } from "../../../shared/seo-description";
const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type SharingImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

type UploadedSharingImage = {
  alt?: string | null;
  asset?: { _id?: string | null; mimeType?: string | null } | null;
} | null | undefined;

function sharingImage(url: string, title: string, alt = `${title} | ${siteName}`) {
  return {
    url,
    width: SHARING_IMAGE_WIDTH,
    height: SHARING_IMAGE_HEIGHT,
    alt,
  };
}

function staticSafetyImage() {
  return sharingImage(
    `${siteOrigin}/images/og-placeholder.svg`,
    "Helpful website content",
  );
}

/** An uploaded image is usable only while its asset still resolves. */
function uploadedSharingImage(
  image: UploadedSharingImage,
  title: string,
): SharingImage | null {
  if (!image?.asset?._id) return null;

  return {
    url: sharingImageUrl(image as Parameters<typeof sharingImageUrl>[0]),
    width: SHARING_IMAGE_WIDTH,
    height: SHARING_IMAGE_HEIGHT,
    // Older images predate the alt field, so the final title describes them.
    alt: image.alt?.trim() || title,
  };
}

/**
 * One precedence rule for every route: Social sharing image override →
 * Generated sharing card → Site sharing image → static safety image.
 */
function resolveSharingImage({
  generated,
  override,
  settings,
  title,
}: {
  generated: SharingImage | null;
  override: UploadedSharingImage;
  settings: SEO_SETTINGS_QUERY_RESULT | undefined;
  title: string;
}) {
  return (
    uploadedSharingImage(override, title) ||
    generated ||
    uploadedSharingImage(settings?.seoImage, title) ||
    staticSafetyImage()
  );
}

function resolveDescription({
  contentDescription,
  page = 1,
  seoDescription,
  settings,
}: {
  contentDescription?: string | null;
  page?: number;
  seoDescription?: string | null;
  settings: SEO_SETTINGS_QUERY_RESULT | undefined;
}) {
  const { description } = resolveSeoDescription({
    contentDescription,
    seoDescription,
    siteDescription: settings?.seoDescription,
  });
  // Archive pagination wording applies after the base description is chosen.
  return getBlogPageDescription(description, page);
}

function resolveArchiveTitles({
  contentTitle,
  fallbackTitle,
  overrideTitle,
  page,
}: {
  contentTitle?: string | null;
  fallbackTitle: string;
  overrideTitle?: string | null;
  page: number;
}) {
  const baseTitleResolution = resolveSeoTitle({
    fallbackTitle: contentTitle || fallbackTitle,
    overrideTitle,
    siteName,
  });
  const pageTitleResolution = resolveSeoTitle({
    fallbackTitle: getBlogPageTitle(baseTitleResolution.pageTitle, page),
    ...(overrideTitle?.includes("|")
      ? { overrideTitle: getBlogPageTitle(baseTitleResolution.finalTitle, page) }
      : {}),
    siteName,
  });
  const cardTitle = getBlogPageTitle(
    getPageOgImageTitle(contentTitle || overrideTitle || fallbackTitle),
    page,
  );

  return { cardTitle, pageTitleResolution };
}

export function generatePageMetadata({
  page,
  path,
  settings,
}: {
  page:
    | HOME_PAGE_QUERY_RESULT
    | PAGE_QUERY_RESULT
    | POST_QUERY_RESULT
    | PARENT_DASHBOARD_QUERY_RESULT;
  path: string;
  settings?: SEO_SETTINGS_QUERY_RESULT;
}) {
  const isPost = page?._type === "post";
  const isHomepage = page?._type === "homePage";
  const seoTitle = resolveSeoTitle({
    fallbackTitle: page?.title,
    isHomepage,
    overrideTitle: page?.meta?.title,
    siteName,
  });
  const postTitle = isPost ? page.title?.trim() : undefined;
  // Slugs the signed OG routes cannot represent fall through to the generic
  // sharing image instead of turning the page request into a server error.
  const postImage =
    isPost && postTitle && page.publishedAt && isValidOgSlug(page.slug?.current || "")
      ? buildPostOgImageUrl({
          origin: siteOrigin,
          photo: page.sharingPhoto,
          publishedAt: page.publishedAt,
          slug: page.slug?.current || "",
          title: postTitle,
        })
      : null;
  const rawPageTitle =
    isHomepage
      ? page.title || seoTitle.pageTitle
      : page?._type === "page"
        ? page.title || page.meta?.title
        : undefined;
  const pageTitle = rawPageTitle
    ? getPageOgImageTitle(rawPageTitle)
    : undefined;
  const pageSlug = path.replace(/^\/+|\/+$/g, "");
  const pageTarget: PageOgImageTarget | null =
    page?._type === "homePage"
      ? { kind: "home" }
      : page?._type === "page" && path !== "/" && isValidOgSlug(pageSlug)
        ? { kind: "page", slug: pageSlug }
        : null;
  const pageImage =
    pageTitle && pageTarget
      ? buildPageOgImageUrl({
          origin: siteOrigin,
          breadcrumbs:
            page && "sharingBreadcrumbs" in page ? page.sharingBreadcrumbs : null,
          photo: page && "sharingPhoto" in page ? page.sharingPhoto : null,
          target: pageTarget,
          title: pageTitle,
        })
      : null;
  // The generated card uses the visible content title. Its alt text uses the
  // final social title, including any complete suffix supplied by the editor.
  const image = resolveSharingImage({
    generated:
      postImage && postTitle
        ? sharingImage(postImage, postTitle)
        : pageImage && pageTitle
          ? sharingImage(pageImage, pageTitle, seoTitle.finalTitle)
          : null,
    override: page?.meta?.image,
    settings,
    title: seoTitle.finalTitle,
  });
  const description = resolveDescription({
    contentDescription: isPost ? page.excerpt : page?.description,
    seoDescription: page?.meta?.description,
    settings,
  });

  return {
    title: seoTitle.metadataTitle,
    description,
    openGraph: {
      title: seoTitle.openGraphTitle,
      description,
      images: [image],
      locale: "en_US",
      type: isPost ? "article" : "website",
      ...(isPost && page.publishedAt
        ? { publishedTime: page.publishedAt }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle.twitterTitle,
      description,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : page?.meta?.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL + path,
    },
  };
}

export function generateBlogIndexMetadata({
  blogIndex,
  page,
  settings,
}: {
  blogIndex: BLOG_INDEX_QUERY_RESULT;
  page: number;
  settings?: SEO_SETTINGS_QUERY_RESULT;
}) {
  const { cardTitle, pageTitleResolution } = resolveArchiveTitles({
    contentTitle: blogIndex?.title,
    fallbackTitle: "Blog",
    overrideTitle: blogIndex?.meta?.title,
    page,
  });
  const description = resolveDescription({
    contentDescription: blogIndex?.description,
    page,
    seoDescription: blogIndex?.meta?.description,
    settings,
  });
  const image = resolveSharingImage({
    generated: sharingImage(
      buildPageOgImageUrl({
        origin: siteOrigin,
        target: { kind: "blog", page },
        title: cardTitle,
      }),
      cardTitle,
      pageTitleResolution.finalTitle,
    ),
    override: blogIndex?.meta?.image,
    settings,
    title: pageTitleResolution.finalTitle,
  });

  return {
    title: pageTitleResolution.metadataTitle,
    description,
    openGraph: {
      title: pageTitleResolution.openGraphTitle,
      description,
      images: [image],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitleResolution.twitterTitle,
      description,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : blogIndex?.meta?.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical:
        process.env.NEXT_PUBLIC_SITE_URL + getBlogCanonicalPath(page),
    },
  };
}

export function generateCategoryMetadata({
  category,
  page,
  settings,
}: {
  category: CategoryArchive;
  page: number;
  settings?: SEO_SETTINGS_QUERY_RESULT;
}) {
  const { cardTitle, pageTitleResolution } = resolveArchiveTitles({
    contentTitle: category.title,
    fallbackTitle: "Blog category",
    overrideTitle: category.meta?.title,
    page,
  });
  const description = resolveDescription({
    contentDescription: category.description,
    page,
    seoDescription: category.meta?.description,
    settings,
  });
  const slug = category.slug?.current || "";
  const image = resolveSharingImage({
    generated:
      isValidOgSlug(slug) && !slug.includes("/")
        ? sharingImage(
            buildPageOgImageUrl({
              origin: siteOrigin,
              target: { kind: "category", page, slug },
              title: cardTitle,
            }),
            cardTitle,
            pageTitleResolution.finalTitle,
          )
        : null,
    override: category.meta?.image,
    settings,
    title: pageTitleResolution.finalTitle,
  });
  const isIndexable = isIndexableCategory({
    description: category.description,
    metaNoindex: category.meta?.noindex,
    publishedPostCount: category.publishedPostCount,
  });

  return {
    title: pageTitleResolution.metadataTitle,
    description,
    openGraph: {
      title: pageTitleResolution.openGraphTitle,
      description,
      images: [image],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitleResolution.twitterTitle,
      description,
      images: [image],
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : isIndexable
        ? "index, follow"
        : "noindex, follow",
    alternates: {
      canonical:
        process.env.NEXT_PUBLIC_SITE_URL +
        getBlogCanonicalPath(page, getCategoryArchivePath(slug)),
    },
  };
}
