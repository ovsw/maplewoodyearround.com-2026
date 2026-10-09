import { defineQuery } from "next-sanity";
import { pageBuilderQuery } from "./page-builder";
import { metaQuery } from "./shared/meta";
import { sharingCardQuery } from "./shared/sharing-card";

export const HOME_PAGE_QUERY = defineQuery(`
  *[_id == "homePage" && _type == "homePage"][0]{
    _id,
    _type,
    title,
    description,
    ${pageBuilderQuery},
    ${metaQuery},
    ${sharingCardQuery},
  }
`);
