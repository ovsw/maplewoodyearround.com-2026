import { defineQuery } from "next-sanity";
import { internalReferenceHref } from "./shared/internal-href";

const destinationProjection = `{
  openInNewTab,
  "href": select(
    kind == "internal" => select(
      internal->_id == "blogIndex" || internal->_type == "blogIndex" => "/news",
      ${internalReferenceHref}
    ),
    kind == "file" => coalesce(file.asset->url + "/" + file.asset->originalFilename, file.asset->url),
    kind == "external" => external
  )
}`;

export const NAVIGATION_QUERY = defineQuery(`
  *[_type == "navigation" && _id == "navigation"][0]{
    _id,
    items[]{
      _key,
      _type == "navigationLink" => {
        "kind": "link",
        label,
        accent,
        icon{name, svg},
        destination${destinationProjection}
      },
      _type == "navigationGroup" => {
        "kind": "group",
        label,
        destination${destinationProjection},
        links[]{
          _key,
          label,
          description,
          // Legacy documents store the icon as a bare string name; surface it
          // as {name, svg: null} so the link survives until the doc is re-saved.
          "icon": select(
            defined(icon.name) => icon{ name, svg },
            defined(icon) => { "name": icon, "svg": null }
          ),
          destination${destinationProjection}
        }
      }
    },
    actions[]{
      _key,
      label,
      destination${destinationProjection}
    }
  }
`);
