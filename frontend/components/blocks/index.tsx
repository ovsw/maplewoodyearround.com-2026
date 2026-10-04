import {
  type Block,
  hasEditorBackground,
  isEditorBackground,
  resolveSectionBands,
  resolveSectionBoundaries,
} from "@/components/blocks/section-boundaries";
import { type LivePerspective } from "next-sanity/live";
import { createDataAttribute, stegaClean } from "next-sanity";
import LatestArticles from "@/components/blocks/latest-articles";
import FaqAccordion from "@/components/blocks/faq-accordion";
import StoryFeature from "@/components/blocks/story-feature";
import TeamMembers from "@/components/blocks/team-members";
import RichTextBlock from "@/components/blocks/rich-text-block";
import CtaBanner from "@/components/blocks/cta-banner";
import BenefitCards from "@/components/blocks/benefit-cards";
import Hero from "@/components/blocks/hero";
import HomeHero from "@/components/blocks/home-hero";
import ImageCollageFeature from "@/components/blocks/image-collage-feature";
import FeatureCards from "@/components/blocks/feature-cards";
import StackedFeatureRows from "@/components/blocks/stacked-feature-rows";
import InnerHero from "@/components/blocks/inner-hero";
import StackedTimeline from "@/components/blocks/stacked-timeline";
import BigImageList from "@/components/blocks/big-image-list";
import LargeSlides from "@/components/blocks/large-slides";
import HeadingImage from "@/components/blocks/heading-image";
import QuoteWall from "@/components/blocks/quote-wall";
import FaqHub from "@/components/blocks/faq-hub";
import VideoHero from "@/components/blocks/video-hero";
import VideoZoomGrid from "@/components/blocks/video-zoom-grid";
import ScrollPanels from "@/components/blocks/scroll-panels";
import BusMap from "@/components/blocks/bus-map";
import ImageReveal from "@/components/blocks/image-reveal";
import DirectorIntro from "@/components/blocks/director-intro";
import ProgramCards from "@/components/blocks/program-cards";
import ElectiveCards from "@/components/blocks/elective-cards";
import HistoryStory from "@/components/blocks/history-story";
import RateTable from "@/components/blocks/rate-table";
import PricingCards from "@/components/blocks/pricing-cards";
import CardSlider from "@/components/blocks/card-slider";
import Statistics from "@/components/blocks/statistics";
import FilterableCards from "@/components/blocks/filterable-cards";
import InstructionSteps from "@/components/blocks/instruction-steps";
import EmbedSection from "@/components/blocks/embed-section";
import ContactDetailsSection from "@/components/blocks/contact-details-section";
import JobList from "@/components/blocks/job-list";
import ParentDashboardSection from "@/components/blocks/parent-dashboard-section";
import SummerDocumentList from "@/components/blocks/summer-document-list";
import TabbedHero from "@/components/blocks/tabbed-hero";
// page-builder-generator:component-imports
import { dataset, projectId } from "@/sanity/lib/env";
import type { BlogListing } from "@/lib/blog-index";

type BlockEditingProps = {
  dataAttribute?: (path: string) => string | undefined;
  memberDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
  testimonialDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
  /** Edit targets on the collection records a section lists, such as facilities. */
  itemDataAttribute?: (
    documentId: string,
    documentType: string,
    path: string,
  ) => string | undefined;
};

/** Page data a route hands to one section type. */
type BlockPageDataProps = {
  blogListing?: BlogListing;
};

const serverFieldEditingBlockTypes = new Set<Block["_type"]>([
  "latestArticles",
  "faqAccordion",
  "storyFeature",
  "teamMembers",
  "richTextBlock",
  "ctaBanner",
  "benefitCards",
  "hero",
  "homeHero",
  "imageCollageFeature",
  "featureCards",
  "stackedFeatureRows",
  "innerHero",
  "stackedTimeline",
  "bigImageList",
  "largeSlides",
  "headingImage",
  "quoteWall",
  "faqHub",
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
  // page-builder-generator:editing-types
]);

const componentMap: Partial<{
  [K in Block["_type"]]: React.ComponentType<
    Extract<Block, { _type: K }> & BlockEditingProps
  >;
}> = {
  latestArticles: LatestArticles,
  faqAccordion: FaqAccordion,
  storyFeature: StoryFeature,
  teamMembers: TeamMembers,
  richTextBlock: RichTextBlock,
  ctaBanner: CtaBanner,
  benefitCards: BenefitCards,
  hero: Hero,
  homeHero: HomeHero,
  imageCollageFeature: ImageCollageFeature,
  featureCards: FeatureCards,
  stackedFeatureRows: StackedFeatureRows,
  innerHero: InnerHero,
  stackedTimeline: StackedTimeline,
  bigImageList: BigImageList,
  largeSlides: LargeSlides,
  headingImage: HeadingImage,
  quoteWall: QuoteWall,
  faqHub: FaqHub,
  videoHero: VideoHero,
  videoZoomGrid: VideoZoomGrid,
  scrollPanels: ScrollPanels,
  busMap: BusMap,
  imageReveal: ImageReveal,
  directorIntro: DirectorIntro,
  programCards: ProgramCards,
  electiveCards: ElectiveCards,
  historyStory: HistoryStory,
  rateTable: RateTable,
  pricingCards: PricingCards,
  cardSlider: CardSlider,
  statistics: Statistics,
  filterableCards: FilterableCards,
  instructionSteps: InstructionSteps,
  embedSection: EmbedSection,
  contactDetailsSection: ContactDetailsSection,
  jobList: JobList,
  parentDashboardSection: ParentDashboardSection,
  summerDocumentList: SummerDocumentList,
  tabbedHero: TabbedHero,
  // page-builder-generator:component-map
};

export default function Blocks({
  blocks,
  blogListing,
  documentId,
  documentType = "page",
  stega,
}: {
  blocks: Block[];
  /** The Blog page's post list, rendered by its Latest Posts section. */
  blogListing?: BlogListing;
  documentId: string;
  documentType?: "blogIndex" | "homePage" | "page";
  perspective: LivePerspective;
  stega: boolean;
}) {
  // A stored block whose type has no renderer (a removed section type) is
  // skipped. Drop it before resolving boundaries so its neighbours meet
  // as if it were not there and the trait table is never read for it.
  const sections = (blocks ?? []).filter(
    (block) => block._type in componentMap,
  );
  const boundaries = resolveSectionBoundaries(sections);
  const bands = resolveSectionBands(boundaries);

  const wrappers = sections.map((block, index) => {
    const Component = componentMap[block._type] as React.ComponentType<
      Block & BlockEditingProps & BlockPageDataProps
    >;

    const blockPath = `blocks[_key=="${block._key}"]`;
    const dataSanity = stega
      ? createDataAttribute({
          baseUrl:
            process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
          dataset,
          id: documentId,
          path: blockPath,
          projectId,
          type: documentType,
        }).toString()
      : undefined;
    const dataAttribute = stega
      ? (path: string) =>
          createDataAttribute({
            baseUrl:
              process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3333",
            dataset,
            id: documentId,
            path: `${blockPath}.${path}`,
            projectId,
            type: documentType,
          }).toString()
      : undefined;
    const boundary = boundaries[index];
    // Fixed-background sections (heroes, night sections) render their own
    // colour and the query does not project `background` for them; every
    // other section receives the resolved editor background.
    const themedBlock: Block =
      hasEditorBackground(block) && isEditorBackground(boundary.background)
        ? { ...block, background: boundary.background }
        : block;
    const editingProps: BlockEditingProps =
      block._type === "teamMembers"
        ? {
            dataAttribute,
            memberDataAttribute: stega
              ? (memberId: string, path: string) =>
                  createDataAttribute({
                    baseUrl:
                      process.env.NEXT_PUBLIC_STUDIO_URL ||
                      "http://localhost:3333",
                    dataset,
                    id: memberId,
                    path,
                    projectId,
                    type: "staffMember",
                  }).toString()
              : undefined,
          }
        : block._type === "quoteWall"
          ? {
              dataAttribute,
              testimonialDataAttribute: stega
                ? (testimonialId: string, path: string) =>
                    createDataAttribute({
                      baseUrl:
                        process.env.NEXT_PUBLIC_STUDIO_URL ||
                        "http://localhost:3333",
                      dataset,
                      id: testimonialId,
                      path,
                      projectId,
                      type: "testimonial",
                    }).toString()
                : undefined,
            }
          : block._type === "cardSlider" || block._type === "programCards"
            ? {
                dataAttribute,
                itemDataAttribute: stega
                  ? (itemId: string, itemType: string, path: string) =>
                      createDataAttribute({
                        baseUrl:
                          process.env.NEXT_PUBLIC_STUDIO_URL ||
                          "http://localhost:3333",
                        dataset,
                        id: itemId,
                        path,
                        projectId,
                        type: itemType,
                      }).toString()
                  : undefined,
              }
            : serverFieldEditingBlockTypes.has(block._type)
              ? { dataAttribute }
              : {};
    const pageDataProps: BlockPageDataProps =
      block._type === "latestArticles" && blogListing ? { blogListing } : {};

    return (
      <div
        data-sanity={dataSanity}
        // Source anchors such as #bus-map let links jump to a section.
        id={"anchorId" in block ? stegaClean(block.anchorId) || undefined : undefined}
        data-seam-top={boundary.seamTop ? "" : undefined}
        data-seam-bottom={boundary.seamBottom ? "" : undefined}
        data-mirror={boundary.mirror ? "" : undefined}
        data-tuck={boundary.tuck ? "" : undefined}
        data-tuck-below={boundary.tuckBelow ? "" : undefined}
        key={block._key}
      >
        <Component {...themedBlock} {...editingProps} {...pageDataProps} />
      </div>
    );
  });

  // A band is a run of sections joined by seams: one continuous surface.
  // The stylesheet paints the surface texture on the band, so the texture
  // does not restart at every seam.
  return (
    <>
      {bands.map((band) => (
        <div
          data-band={band.background}
          data-band-tuck={band.tuck ? "" : undefined}
          key={sections[band.start]._key}
        >
          {wrappers.slice(band.start, band.end)}
        </div>
      ))}
    </>
  );
}
