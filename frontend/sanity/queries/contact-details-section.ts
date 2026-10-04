import { groq } from "next-sanity";
import { contentActionsProjection } from "./shared/maplewood";

// @sanity-typegen-ignore
export const contactDetailsSectionQuery = groq`
  _type == "contactDetailsSection" => {
    title,
    description,
"contact": *[_type == "settings" && _id == "settings"][0].contact{email, phone, fax, addressLines}, ${contentActionsProjection}
  }
`;
