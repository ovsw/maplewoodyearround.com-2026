import {
  defineLocations,
  defineDocuments,
} from "sanity/presentation";
import type { PresentationPluginOptions } from "sanity/presentation";
import { ROOT_SLUG_FILTER } from "../../shared/root-slug-filter.ts";
import {
  getPresentationPath,
  resolveCategoryPath,
  resolveContentPath,
} from "./routes.ts";

export { resolveContentPath } from "./routes.ts";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    parentDashboard: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({ locations: [{ title: doc?.title || "Parent dashboard", href: "/parent-dashboard" }] }),
    }),
    summerDocuments: defineLocations({
      select: { title: "seasonLabel" },
      resolve: (doc) => ({ locations: [
        { title: (doc?.title || "Summer") + " group schedules", href: "/summer-camp/summer-group-schedules" },
        { title: (doc?.title || "Summer") + " welcome letters", href: "/summer-camp/summer-camp-welcome-letters" },
      ] }),
    }),
    page: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => {
        const href = resolveContentPath(doc?.slug);
        return {
          locations: href
            ? [{ title: doc?.title || "Untitled", href }]
            : [],
        };
      },
    }),
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: getPresentationPath("post", doc?.slug) ?? "/news",
          },
          { title: "News", href: "/news" },
        ],
      }),
    }),
    category: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => {
        const href = resolveCategoryPath(doc?.slug);
        return {
          locations: href
            ? [{ title: doc?.title || "Untitled Category", href }]
            : [],
        };
      },
    }),
    blogIndex: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "News", href: "/news" }],
      }),
    }),
    homePage: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Home Page", href: "/" }],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    { route: "/parent-dashboard", filter: `_id == "parentDashboard"` },
    {
      route: "/news",
      filter: `_id == "blogIndex"`,
    },
    {
      route: "/",
      filter: `_id == 'homePage' && _type == 'homePage'`,
    },
    {
      route: "/blog/category/:slug",
      filter: `_type == 'category' && ${ROOT_SLUG_FILTER}`,
    },
    {
      route: "/post/:slug",
      filter: `_type == 'post' && ${ROOT_SLUG_FILTER}`,
    },
    {
      route: "/:slug(.+)",
      filter: `_type == 'page' && ${ROOT_SLUG_FILTER}`,
    },
  ]),
};
