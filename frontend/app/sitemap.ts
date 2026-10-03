import { MetadataRoute } from "next";
import { groq } from "next-sanity";
import { isIndexableCategory } from "@/lib/blog-index";
import { getDynamicFetchOptions, sanityFetchMetadata } from "@/sanity/lib/live";
import { publishedPostFilter } from "@/sanity/queries/blog-post-listing";

const VIEWABLE_TYPES = ["homePage", "page", "post", "blogIndex", "category"] as const;

const urlQuery = `
  'url': select(
    _id == "homePage" && _type == "homePage" => $baseUrl + "/",
    _id == "blogIndex" => $baseUrl + "/blog",
    _type == "post" => $baseUrl + "/blog/" + array::join(string::split(slug.current, "/")[@ != ""], "/"),
    _type == "category" => $baseUrl + "/blog/category/" + array::join(string::split(slug.current, "/")[@ != ""], "/"),
    $baseUrl + "/" + array::join(string::split(slug.current, "/")[@ != ""], "/")
  )
`;

/** A single query that fetches all documents with a viewable url/page */
const SITEMAP_QUERY = groq`
  *[
    _type in $viewableTypes
    && meta.noindex != true
    && (
      (_type != "category" && (defined(slug.current) || _id in ["homePage", "blogIndex"]))
      || (_type == "category" && defined(slug.current))
    )
  ] {
    _type,
    ${urlQuery},
    description,
    "metaNoindex": meta.noindex,
    "publishedPostCount": select(
      _type == "category" => count(*[${publishedPostFilter} && category._ref == ^._id]),
      0
    ),
    "lastModified": select(_type == "category" => null, _updatedAt),
    "changeFrequency": select(_type in ["homePage", "page", "blogIndex"] => "daily", "weekly"),
    "priority": select(
      _id == "homePage" && _type == "homePage" => 1,
      _id == "blogIndex" => 0.7,
      _type == "category" => 0.6,
      _type == "page" => 0.5,
      0.7
    )
  } | order(priority desc, url asc)
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { perspective } = await getDynamicFetchOptions();
  const { data } = await sanityFetchMetadata({
    query: SITEMAP_QUERY,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL!,
      viewableTypes: [...VIEWABLE_TYPES],
    },
    perspective,
  });

  return (((data as Array<MetadataRoute.Sitemap[number] & {
      _type: string;
      description?: string | null;
      lastModified?: string | null;
      metaNoindex?: boolean | null;
      publishedPostCount?: number;
    }>) || [])
    .filter((entry) =>
      entry._type !== "category" ||
      isIndexableCategory({
        description: entry.description,
        metaNoindex: entry.metaNoindex,
        publishedPostCount: entry.publishedPostCount || 0,
      }),
    )
    .map((entry) => {
      const sitemapEntry: Record<string, unknown> = { ...entry };
      const lastModified = sitemapEntry.lastModified;
      delete sitemapEntry._type;
      delete sitemapEntry.description;
      delete sitemapEntry.metaNoindex;
      delete sitemapEntry.publishedPostCount;
      delete sitemapEntry.lastModified;
      return lastModified ? { ...sitemapEntry, lastModified } : sitemapEntry;
    }) as unknown as MetadataRoute.Sitemap);
}
