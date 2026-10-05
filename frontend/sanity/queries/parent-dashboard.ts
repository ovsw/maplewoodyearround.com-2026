import { defineQuery } from "next-sanity";
import { imageQuery } from "./shared/image";
import { contentDestinationProjection, iconProjection, taglineProjection } from "./shared/maplewood";
import { metaQuery } from "./shared/meta";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

const dashboardCardsProjection = `{
  _key, title, text, accent, ${iconProjection},
  image{${imageQuery}},
  link{label, destination${contentDestinationProjection}}
}`;

export const PARENT_DASHBOARD_QUERY = defineQuery(`
  *[_id == "parentDashboard" && _type == "parentDashboard"][0]{
    _id,
    _type,
    ${taglineProjection},
    title,
    intro,
    "description": intro,
    tabsPrompt[]{${simpleRichTextQuery}},
    schoolYearLabel,
    summerCampLabel,
    "schoolYearCards": schoolYearCards[]${dashboardCardsProjection},
    "summerCampCards": summerCampCards[]${dashboardCardsProjection},
    ${metaQuery},
  }
`);
