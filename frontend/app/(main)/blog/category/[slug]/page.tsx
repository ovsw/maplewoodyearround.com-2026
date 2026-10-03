import { CategoryArchiveRoute } from "../_components/category-archive-route";
import { getCategoryStaticParams } from "@/lib/blog-index";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@/sanity/lib/live";
import { generateCategoryMetadata } from "@/sanity/lib/metadata";
import { fetchSeoSettings } from "@/sanity/lib/seo-settings";
import {
  CATEGORY_STATIC_PARAMS_QUERY,
  CATEGORY_QUERY,
  type CategoryArchive,
  type CategoryStaticParam,
} from "@/sanity/queries/category";
import { draftMode } from "next/headers";

type Props = { params: Promise<{ slug: string }> };

export const instant = false;

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: CATEGORY_STATIC_PARAMS_QUERY,
  });
  return getCategoryStaticParams(data as unknown as CategoryStaticParam[]);
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [{ data: category }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: CATEGORY_QUERY,
      params: { slug },
      perspective: "published",
    }) as Promise<{ data: CategoryArchive | null }>,
    fetchSeoSettings(),
  ]);
  if (!category) return {};
  return generateCategoryMetadata({ category, page: 1, settings });
}

export default async function CategoryPage({ params }: Props) {
  const [{ slug }, { isEnabled }] = await Promise.all([params, draftMode()]);
  if (isEnabled) return <DynamicCategoryPage slug={slug} />;
  return <CategoryArchiveRoute currentPage={1} perspective="published" slug={slug} stega={false} />;
}

async function DynamicCategoryPage({ slug }: { slug: string }) {
  const options = await getDynamicFetchOptions();
  return <CategoryArchiveRoute currentPage={1} slug={slug} {...options} />;
}
