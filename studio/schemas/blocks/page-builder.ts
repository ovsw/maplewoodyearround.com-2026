import { defineField } from "sanity";

export const contentPageBuilderBlockTypes = [
  "richTextBlock",
  "benefitCards",
  "storyFeature",
  "imageCollageFeature",
  "featureCards",
  "stackedFeatureRows",
  "latestArticles",
  "faqAccordion",
  "teamMembers",
  "ctaBanner",
  "stackedTimeline",
  "bigImageList",
  "largeSlides",
  "headingImage",
  "quoteWall",
  "videoHero",
  "videoZoomGrid",
  "scrollPanels",
  "busMap",
  "imageReveal",
  "directorIntro",
  "programCards",
  "electiveCards",
  "historyStory",
  "rateTable",
  "pricingCards",
  "cardSlider",
  "statistics",
  "filterableCards",
  "instructionSteps",
  "embedSection",
  "contactDetailsSection",
  "jobList",
  "parentDashboardSection",
  "summerDocumentList",
  "tabbedHero",
  "iconCards",
  "registrationCards",
  // page-builder-generator:content-types
] as const;

const generalOnlyPageBuilderBlockTypes = [
  "faqHub",
  // page-builder-generator:general-types
] as const;

const homeOnlyPageBuilderBlockTypes = [
  "homeHero",
  // page-builder-generator:home-types
] as const;

export const generalPageBuilderBlockTypes = [
  "hero",
  "innerHero",
  ...generalOnlyPageBuilderBlockTypes,
  ...contentPageBuilderBlockTypes,
] as const;

export const pageBuilderBlockTypes = generalPageBuilderBlockTypes;
export const blogIndexPageBuilderBlockTypes = [
  "hero",
  "innerHero",
  ...contentPageBuilderBlockTypes,
] as const;
export const homePagePageBuilderBlockTypes = [
  "hero",
  ...homeOnlyPageBuilderBlockTypes,
  ...contentPageBuilderBlockTypes,
] as const;

type PageBuilderBlockType =
  | (typeof generalPageBuilderBlockTypes)[number]
  | (typeof homePagePageBuilderBlockTypes)[number];

const pageBuilderPreviewBlockTypes = new Set<PageBuilderBlockType>([
  // page-builder-generator:preview-types
]);

export function getPageBuilderPreviewImageUrl(schemaTypeName: string) {
  return pageBuilderPreviewBlockTypes.has(
    schemaTypeName as PageBuilderBlockType,
  )
    ? `/static/images/preview/${schemaTypeName}.jpg`
    : undefined;
}

/** Every block type that opens a page. One per page, always first. */
export const heroBlockTypes = new Set([
  "hero",
  "homeHero",
  "innerHero",
  "videoHero",
  "tabbedHero",
  "directorIntro",
]);

/**
 * Every block type that lists FAQs. One per page, hub or curated, so the
 * FAQPage structured data never lists a question twice.
 */
export const faqBlockTypes = new Set(["faqAccordion", "faqHub"]);

export function validateBlocks(
  blocks: Array<{ _type?: string; background?: string; program?: string }> | undefined,
): true | string {
  const heroTypes = heroBlockTypes;
  const heroIndexes = (blocks ?? []).flatMap((block, index) =>
    heroTypes.has(block?._type ?? "") ? [index] : [],
  );
  if (heroIndexes.length > 1) return "Add no more than one Hero section";
  if (heroIndexes.length === 1 && heroIndexes[0] !== 0) {
    return "The Hero section must be the first section";
  }
  const faqs = blocks?.filter((block) => faqBlockTypes.has(block?._type ?? "")) ?? [];
  const separatePrograms = faqs.length === 2 && faqs.every((block) => block._type === "faqAccordion") &&
    faqs.some((block) => block.program === "summerCamp") && faqs.some((block) => block.program === "schoolYear");
  if (faqs.length > 1 && !separatePrograms) return "Add no more than one FAQ section";
  const teamCount =
    blocks?.filter((block) => block?._type === "teamMembers").length ?? 0;
  if (teamCount > 1) return "Add no more than one Team Members section";
  return true;
}

/** The Blog page lists its posts through exactly one Latest Posts section. */
export function validateBlogIndexBlocks(
  blocks: Array<{ _type?: string; background?: string }> | undefined,
): true | string {
  const pageResult = validateBlocks(blocks);
  if (pageResult !== true) return pageResult;
  const listingCount =
    blocks?.filter((block) => block?._type === "latestArticles").length ?? 0;
  return listingCount === 1
    ? true
    : "Add exactly one Latest Posts section. It lists the blog posts on this page.";
}

function createBlocksField(
  blockTypes: readonly PageBuilderBlockType[],
  validate: typeof validateBlocks = validateBlocks,
) {
  const groups: {
    name: string;
    title: string;
    of: PageBuilderBlockType[];
  }[] = [
    {
      name: "hero",
      title: "Hero",
      of: blockTypes.filter((type) => heroBlockTypes.has(type)),
    },
    {
      name: "cta",
      title: "CTA",
      of: ["ctaBanner"],
    },
    {
      name: "image-rich",
      title: "Image Rich",
      of: [
        "headingImage",
        "storyFeature",
        "imageCollageFeature",
        "featureCards",
        "bigImageList",
        "largeSlides",
        "latestArticles",
        "teamMembers",
      ],
    },
    {
      name: "text-lists",
      title: "Text & Lists",
      of: [
        "richTextBlock",
        "benefitCards",
        "stackedFeatureRows",
        "faqAccordion",
        "faqHub",
        "stackedTimeline",
      ],
    },
    {
      name: "people-quotes",
      title: "People & Quotes",
      of: ["teamMembers", "quoteWall"],
    },
  ];

  return defineField({
    name: "blocks",
    title: "Page sections",
    description: "Sections in display order. Put one hero first.",
    type: "array",
    group: "content",
    of: blockTypes.map((type) => ({ type })),
    validation: (rule) => rule.custom(validate),
    options: {
      insertMenu: {
        groups: groups
          .map((group) => ({
            ...group,
            of: group.of.filter((type) => blockTypes.includes(type)),
          }))
          .filter((group) => group.of.length > 0),
        views: [
          { name: "list" as const },
          ...(pageBuilderPreviewBlockTypes.size
            ? [
                {
                  name: "grid" as const,
                  previewImageUrl: getPageBuilderPreviewImageUrl,
                },
              ]
            : []),
        ],
      },
    },
  });
}

export const blocksField = createBlocksField(generalPageBuilderBlockTypes);
export const blogIndexBlocksField = createBlocksField(
  blogIndexPageBuilderBlockTypes,
  validateBlogIndexBlocks,
);
export const homePageBlocksField = createBlocksField(
  homePagePageBuilderBlockTypes,
);
