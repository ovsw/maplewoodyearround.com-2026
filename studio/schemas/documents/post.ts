import { defineArrayMember, defineField, defineType } from "sanity";
import { FileText } from "lucide-react";
import meta from "../blocks/shared/meta";
import { postPath } from "../../../shared/content-routes.ts";
import { uniqueRoutedSlug } from "../validation/routed-slug";

export default defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: FileText,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      description: "The title used to identify this content.",
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().max(96),
    }),
    defineField({
      description:
        "The unique URL name. Use lowercase words separated by hyphens.",
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(uniqueRoutedSlug),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "array",
      group: "content",
      description:
        "A short Portable Text summary used on article listings and in metadata.",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
            annotations: [],
          },
        }),
      ],
    }),
    defineField({
      description: "Choose the author shown with this article.",
      name: "author",
      title: "Author",
      type: "reference",
      group: "settings",
      to: { type: "author" },
    }),
    defineField({
      description: "The original publication date used to order articles.",
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      group: "settings",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      description:
        "The image shown with this item. Set the crop and focal point.",
      name: "image",
      title: "Image",
      type: "image",
      group: "settings",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          description: "Describe the image for people who cannot see it.",
          name: "alt",
          type: "string",
          title: "Alternative Text",
        }),
        defineField({
          description: "Optional text shown below the image.",
          name: "caption",
          type: "string",
          title: "Caption",
        }),
      ],
    }),
    defineField({
      description: "Choose the topic used to group this article.",
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "settings",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      description: "The full article text and images.",
      name: "body",
      title: "Body",
      type: "richTextContent",
      group: "content",
    }),
    meta,
  ],

  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      media: "image",
    },
    prepare({ title, slug, media }) {
      return {
        title,
        subtitle: postPath(slug) ?? undefined,
        media,
      };
    },
  },
});
