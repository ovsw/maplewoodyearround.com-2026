import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const teamMembersQuery = groq`
  _type == "teamMembers" => {
    presentation,
    eyebrow,
    title,
    richText[]{
      ${bodyQuery}
    },
    members[]{
      _key,
      _type,
      "_ref": _ref,
      "document": @->{
        _id,
        _type,
        name,
        role,
        yearsAtOrganization,
        shortBio,
        email,
        phone,
        sortOrder,
        image {
          ${imageQuery}
        },
        bio[]{
          ${bodyQuery}
        }
      }
    }
  }
`;
