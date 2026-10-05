import { benefitCardsQuery } from "./benefit-cards";
import { ctaBannerQuery } from "./cta-banner";
import { faqAccordionQuery } from "./faq-accordion";
import { latestArticlesQuery } from "./latest-articles";
import { richTextBlockQuery } from "./rich-text-block";
import { storyFeatureQuery } from "./story-feature";
import { teamMembersQuery } from "./team-members";
import { heroQuery } from "./hero";
import { homeHeroQuery } from "./home-hero";
import { imageCollageFeatureQuery } from "./image-collage-feature";
import { featureCardsQuery } from "./feature-cards";
import { stackedFeatureRowsQuery } from "./stacked-feature-rows";
import { innerHeroQuery } from "./inner-hero";
import { stackedTimelineQuery } from "./stacked-timeline";
import { bigImageListQuery } from "./big-image-list";
import { largeSlidesQuery } from "./large-slides";
import { headingImageQuery } from "./heading-image";
import { quoteWallQuery } from "./quote-wall";
import { faqHubQuery } from "./faq-hub";
import { videoHeroQuery } from "./video-hero";
import { videoZoomGridQuery } from "./video-zoom-grid";
import { scrollPanelsQuery } from "./scroll-panels";
import { busMapQuery } from "./bus-map";
import { imageRevealQuery } from "./image-reveal";
import { directorIntroQuery } from "./director-intro";
import { programCardsQuery } from "./program-cards";
import { electiveCardsQuery } from "./elective-cards";
import { historyStoryQuery } from "./history-story";
import { rateTableQuery } from "./rate-table";
import { pricingCardsQuery } from "./pricing-cards";
import { cardSliderQuery } from "./card-slider";
import { statisticsQuery } from "./statistics";
import { filterableCardsQuery } from "./filterable-cards";
import { instructionStepsQuery } from "./instruction-steps";
import { embedSectionQuery } from "./embed-section";
import { contactDetailsSectionQuery } from "./contact-details-section";
import { jobListQuery } from "./job-list";
import { parentDashboardSectionQuery } from "./parent-dashboard-section";
import { summerDocumentListQuery } from "./summer-document-list";
import { tabbedHeroQuery } from "./tabbed-hero";
import { iconCardsQuery } from "./icon-cards";
import { registrationCardsQuery } from "./registration-cards";
// page-builder-generator:query-imports

export const pageBuilderQuery = `
  blocks[]{
    _key,
    _type,
    !(_type in ["hero", "homeHero", "innerHero"]) => {background},
    ${latestArticlesQuery},
    ${faqAccordionQuery},
    ${storyFeatureQuery},
    ${teamMembersQuery},
    ${richTextBlockQuery},
    ${ctaBannerQuery},
    ${benefitCardsQuery},
    ${heroQuery},
    ${homeHeroQuery},
    ${imageCollageFeatureQuery},
    ${featureCardsQuery},
    ${stackedFeatureRowsQuery},
    ${innerHeroQuery},
    ${stackedTimelineQuery},
    ${bigImageListQuery},
    ${largeSlidesQuery},
    ${headingImageQuery},
    ${quoteWallQuery},
    ${faqHubQuery},
    ${videoHeroQuery},
    ${videoZoomGridQuery},
    ${scrollPanelsQuery},
    ${busMapQuery},
    ${imageRevealQuery},
    ${directorIntroQuery},
    ${programCardsQuery},
    ${electiveCardsQuery},
    ${historyStoryQuery},
    ${rateTableQuery},
    ${pricingCardsQuery},
    ${cardSliderQuery},
    ${statisticsQuery},
    ${filterableCardsQuery},
    ${instructionStepsQuery},
    ${embedSectionQuery},
    ${contactDetailsSectionQuery},
    ${jobListQuery},
    ${parentDashboardSectionQuery},
    ${summerDocumentListQuery},
    ${tabbedHeroQuery},
    ${iconCardsQuery},
    ${registrationCardsQuery},
    ${"" /* page-builder-generator:query-spreads */}
  }
`;
