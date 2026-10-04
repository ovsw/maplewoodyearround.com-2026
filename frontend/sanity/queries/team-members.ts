import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const teamMembersQuery = groq`
  _type == "teamMembers" => {
    presentation, eyebrow, title,
    richText[]{${bodyQuery}},
    "members": *[
      _type == "staffMember" && visible != false
      && (!defined(^.program) || program == ^.program)
      && coalesce(profileGroup, "roster") == coalesce(^.profileGroup, "roster")
      && (^.preschoolOnly != true || preschoolTeacher == true)
      && (^.tourGuidesOnly != true || givesTours == true)
    ] | order(coalesce(order, 2147483647) asc, name asc, _id asc) {
      "_key": _id, "_type": "reference", "_ref": _id,
      "document": {
        _id, _type, name, role, training, yearRound, formerCamper,
        "yearsAtOrganization": yearsAtMaplewood,
        "shortBio": pt::text(bio), email, phone, "sortOrder": order,
        image{${imageQuery}}, bio[]{${bodyQuery}}
      }
    }
  }
`;
