import { defineField } from "sanity";
import { getSeoTitleWarnings } from "../../../../shared/seo-title";
import { studioSiteName } from "../../../site-name";
import { SeoDescriptionInput } from "../../inputs/seo-description-input";
import { SeoTitleInput } from "../../inputs/seo-title-input";

export default defineField({
  name: "meta",
  title: "Meta",
  type: "object",
  group: "seo",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "SEO title override",
      description:
        `Optional. Titles without a pipe get “| ${studioSiteName}” automatically. Titles containing a pipe are used as written.`,
      components: { input: SeoTitleInput },
      validation: (rule) =>
        rule
          .custom((value, context) => {
            const fallbackTitle =
              typeof context.document?.title === "string"
                ? context.document.title
                : undefined;
            const warnings = getSeoTitleWarnings({
              fallbackTitle,
              overrideTitle: value,
              siteName: studioSiteName,
            });

            return warnings.length ? warnings.join(" ") : true;
          })
          .warning(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "SEO description override",
      description:
        "Optional. Used for search results and shared links. When empty, the content description is used, then the site-wide description from Global Settings.",
      components: { input: SeoDescriptionInput },
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Social sharing image override",
      description:
        "Optional. The image shown when this page is shared on social networks and in messages. Leave empty to use the Generated sharing card. Page Builder and hero photos are not used. Shared links show this image at 1200 × 630, so set the crop and hotspot to keep the important part visible.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          description:
            "Optional. Describes the image for people who cannot see it. When empty, the page title is used.",
        }),
      ],
    }),
  ],
});
