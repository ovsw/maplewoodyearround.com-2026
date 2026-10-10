import { internalReferenceHref } from "./internal-href";
import { imageQuery } from "./image";
import { richTextContentQuery } from "./rich-text-content";
import { fileUrl } from "./file-url";

export const contentDestinationProjection = `{
  kind, openInNewTab,
  "href": select(
    kind == "internal" => select(
      internal->_type == "parentDashboard" => "/parent-dashboard",
      internal->_type == "blogIndex" => "/news",
      ${internalReferenceHref}
    ),
    kind == "external" => external,
    kind == "file" => ${fileUrl}
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
    _type in ["summerActivity", "schoolYearActivity", "facility", "playgroundCharacter", "playgroundGuest", "playgroundEvent", "playgroundCalendar"]
    && _type == ^.source
    && visible != false
    // Activities and Play Center records belong to one side and store none.
    && (!defined(^.program) || program == ^.program
      || (_type == "summerActivity" && ^.program == "summerCamp")
      || ((_type == "schoolYearActivity" || _type match "playground*") && ^.program == "schoolYear"))
    && (!defined(^.location) || location == ^.location)
    && (!defined(^.programOffering._ref) || ^.programOffering._ref in programs[]._ref)
    && (!defined(^.facilityCategory._ref) || ^.facilityCategory._ref in categories[]._ref)
    && (!defined(^.activityCategory._ref) || category._ref == ^.activityCategory._ref)
    && (!defined(^.grade._ref) || ^.grade._ref in grades[]._ref)
  ]
  // Calendar days run by date. Webflow lists sorted by order show records
  // without an order number first.
  | order(date asc, defined(order) asc, order asc, title asc, _id asc) {
    _id, _type, title, slug, description, program, location,
    availability,
    image{${imageQuery}},
    category->{_id, title, slug},
    categories[]->{_id, title, slug},
    "grades": grades[]-> | order(order asc) {_id, title, slug},
    programs[]->{_id, title, slug},
    time, subtitle, personName, companyName,
    destination${contentDestinationProjection},
    date, dayLabel, hasGuest, customDay,
    agenda[]{${richTextContentQuery}},
    guest->{_id, title, time, subtitle, personName, companyName, image{${imageQuery}}, destination${contentDestinationProjection}},
    character->{_id, title, image{${imageQuery}}},
    outdoorActivity->{_id, title, slug, description, image{${imageQuery}}},
    "fileUrl": ${fileUrl}, effectiveFrom
  }
`;

// A Sample schedule's slots in their order. A slot names its activity when
// it is about one.
export const sampleScheduleProjection = `sampleSchedule->{
  _id, _type, title,
  slots[]{
    _key, time, label, description,
    image{${imageQuery}},
    activity->{_id, _type, title, slug}
  }
}`;

export const taglineProjection = `tagline{label, program, text}`;

// Imported and picked icons both store their artwork with the content.
export const iconProjection = `icon{name, svg}`;

