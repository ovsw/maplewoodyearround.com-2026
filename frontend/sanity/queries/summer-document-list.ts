import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const summerDocumentListQuery = groq`
  _type == "summerDocumentList" => {
    title,
    description,
    kind,
    "documents": documents->{
      _id, seasonLabel,
      gradeGroups[]{_key, heading, grade->{_id, title}, entries[
        kind == ^.^.^.kind
        && (!defined(group._ref) || (defined(group->_id) && group->visible != false))
      ]{
        _key, title, kind, group->{_id, title}, "fileUrl": coalesce(file.asset->url + "/" + file.asset->originalFilename, file.asset->url)
      }[defined(fileUrl)]}
    }
  }
`;
