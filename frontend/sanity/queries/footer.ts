import { defineQuery } from "next-sanity";
import { imageQuery } from "./shared/image";

const destinationProjection = `{
  openInNewTab,
  "href": select(
    kind == "internal" => select(
      internal->_type == "parentDashboard" => "/parent-dashboard",
      internal->_id == "homePage" || internal->_type == "homePage" => "/",
      internal->_id == "blogIndex" || internal->_type == "blogIndex" => "/news",
      internal->_type == "post" && defined(internal->slug.current) => "/post/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/"),
      internal->_type == "category" && defined(internal->slug.current) => "/blog/category/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/"),
      defined(internal->slug.current) => "/" + array::join(string::split(internal->slug.current, "/")[@ != ""], "/")
    ),
    kind == "file" => file.asset->url,
    kind == "external" => external
  )
}`;

const linkProjection = `{
  _key,
  label,
  destination${destinationProjection}
}`;

export const FOOTER_QUERY = defineQuery(`
  *[_type == "footer" && _id == "footer"][0]{
    _id,
    eyebrow,
    heading,
    accent,
    newsletter{heading, description, successMessage, errorMessage},
    actions[]${linkProjection},
    logos[]{
      _key,
      alt,
      image{
        ${imageQuery}
      },
      destination${destinationProjection}
    },
    contactLinks[]{
      _key,
      icon,
      label,
      destination${destinationProjection}
    },
    columns[]{
      _key,
      heading,
      links[]${linkProjection}
    },
    "legalLinks": coalesce(legalLinks, compliance.legalLinks)[]${linkProjection},
    "copyrightStartYear": coalesce(copyrightStartYear, compliance.copyrightStartYear),
    "copyrightOwner": coalesce(copyrightOwner, compliance.copyrightOwner)
  }
`);
