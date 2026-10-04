import { groq } from "next-sanity";
import { contentDestinationProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const parentDashboardSectionQuery = groq`
  _type == "parentDashboardSection" => {
    title,
    description,
"dashboard": *[_type == "parentDashboard" && _id == "parentDashboard"][0]{_id, title, intro, schoolYearLabel, summerCampLabel},
    "cards": *[_type == "dashboardCard" && visible != false] | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
      _id, title, text, colorTheme, showImage, showIcon, iconName, linkText,
      image{${imageQuery}}, seasons[]->{_id, title, program},
      destination${contentDestinationProjection}
    }[defined(destination.href) && destination.href != "" && destination.href != "#"]
  }
`;
