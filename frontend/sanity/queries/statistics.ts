import { groq } from "next-sanity";
import { contentActionsProjection, taglineProjection } from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const statisticsQuery = groq`
  _type == "statistics" => {
    anchorId,
    ${taglineProjection},
    title,
    description,
    text[]{${simpleRichTextQuery}},
    items[]{_key, value, label, accent, text[]{${simpleRichTextQuery}}},
    ${contentActionsProjection},
    image{${imageQuery}},
    "members": select(preschoolTeachers == true => *[
      _type == "staffMember" && visible != false && preschoolTeacher == true
      && (!defined(^.program) || program == ^.program)
      && coalesce(profileGroup, "roster") == "roster"
    ] | order(coalesce(order, 2147483647) asc, name asc, _id asc) {
      "_key": _id, "_type": "reference", "_ref": _id,
      "document": {
        _id, _type, name, role, yearRound, formerCamper,
        "yearsAtOrganization": yearsAtMaplewood,
        image{${imageQuery}}
      }
    })
  }
`;
