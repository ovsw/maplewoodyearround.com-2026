import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const statisticsQuery = groq`
  _type == "statistics" => {
    title,
    description,
items[]{_key, value, label}
  }
`;
