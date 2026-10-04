import { internalReferenceHref } from "./internal-href";
import { imageQuery } from "./image";
import { richTextContentQuery } from "./rich-text-content";

export const contentDestinationProjection = `{
  kind, openInNewTab,
  "href": select(
    kind == "internal" => select(
      internal->_type == "parentDashboard" => "/parent-dashboard",
      internal->_type == "blogIndex" => "/news",
      ${internalReferenceHref}
    ),
    kind == "external" => external,
    kind == "file" => file.asset->url
  )
}`;

export const contentActionsProjection = `actions[]{
  _key, label, destination${contentDestinationProjection}
}`;

export const contentCardsProjection = `cards[]{
  _key, title, eyebrow, description, image{${imageQuery}}, mobileImage{${imageQuery}},
  body[]{${richTextContentQuery}},
  ${contentActionsProjection}
}`;

export const sectionVideoProjection = `
  "videoMp4Url": videoMp4.asset->url,
  "videoWebmUrl": videoWebm.asset->url,
  poster{${imageQuery}}
`;

export const collectionItemsProjection = `
  "items": *[
    _type in ["activity", "facility", "sampleSchedule", "playgroundCharacter", "playgroundGuest", "playgroundEvent", "playgroundCalendar"]
    && _type == ^.source
    && visible != false
    && (!defined(^.program) || program == ^.program || (_type match "playground*" && ^.program == "schoolYear"))
    && (!defined(^.location) || location == ^.location)
    && (!defined(^.audience) || audience == ^.audience)
    && (!defined(^.programOffering._ref) || ^.programOffering._ref in programs[]._ref)
    && (!defined(^.facilityCategory._ref) || ^.facilityCategory._ref in categories[]._ref)
    && (!defined(^.activityCategory._ref) || category._ref == ^.activityCategory._ref)
  ] | order(coalesce(order, 2147483647) asc, title asc, _id asc) {
    _id, _type, title, slug, description, program, location, activity, audience,
    availability, gradeLabel, groupText, playgroundLabel,
    image{${imageQuery}},
    category->{_id, title, slug},
    categories[]->{_id, title, slug},
    grades[]->{_id, title, slug},
    groups[]->{_id, title, grades[]->{_id, title, slug}},
    programs[]->{_id, title, slug},
    time, subtitle, personName, companyName,
    destination${contentDestinationProjection},
    date, dayLabel, hasGuest, customDay,
    agenda[]{${richTextContentQuery}},
    guest->{_id, title, time, subtitle, personName, companyName, image{${imageQuery}}, destination${contentDestinationProjection}},
    character->{_id, title, image{${imageQuery}}},
    "fileUrl": file.asset->url, effectiveFrom
  }
`;

export const taglineProjection = `tagline{label, program, text}`;

// Imported and picked icons both store their artwork with the content.
export const iconProjection = `icon{name, svg}`;

