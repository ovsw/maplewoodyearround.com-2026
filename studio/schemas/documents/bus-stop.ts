import { Bus } from "lucide-react";
import { defineField, defineType } from "sanity";
import { AddressPinScope, AddressSearchInput, PinInput } from "../inputs/address-pin-input";
import { nearCamp } from "../validation/near-camp";

/** The Studio list and the Website sort stops by town, then by name. */
export const busStopOrdering = [
  { field: "town", direction: "asc" as const },
  { field: "name", direction: "asc" as const },
];

export default defineType({
  name: "busStop",
  title: "Bus stop",
  type: "document",
  icon: Bus,
  description:
    "A summer bus pick-up and drop-off location, shown on the bus map.",
  // Lets the address field place and move the pin (see address-pin.ts).
  components: { input: AddressPinScope },
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description:
        "The name parents see in bold, for example a corner such as \"Bay Rd & Fairfield Dr\" or a place such as \"Gilmore Hall\".",
      validation: (rule) => rule.required().error("Give the stop a name."),
    }),
    defineField({
      name: "town",
      title: "Town",
      type: "string",
      description:
        "Groups and sorts the stops, for example \"Easton\" or \"North Easton\".",
      validation: (rule) => rule.required().error("Give the stop a town."),
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
      description:
        "Shown to parents exactly as typed, under the name, for example \"Easton, MA 02356\". Type it and pick a Google suggestion to place the pin. You can edit the text after picking.",
      components: { input: AddressSearchInput },
    }),
    defineField({
      name: "location",
      title: "Pin",
      type: "geopoint",
      description:
        "The latitude and longitude of the pin. A stop without a pin stays off the map.",
      components: { input: PinInput },
      validation: (rule) => rule.custom(nearCamp).warning(),
    }),
    defineField({
      name: "shownOnMap",
      title: "Shown on map",
      type: "boolean",
      description:
        "Switch off to hide the stop for a season without deleting it.",
      initialValue: true,
    }),
  ],
  orderings: [
    { title: "Town, then name", name: "townThenName", by: busStopOrdering },
  ],
  preview: {
    select: { title: "name", subtitle: "town", shown: "shownOnMap" },
    prepare: ({ title, subtitle, shown }) => ({
      title,
      subtitle: shown === false ? `${subtitle ?? ""} (hidden)`.trim() : subtitle,
    }),
  },
});
