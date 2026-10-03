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
    ${"" /* page-builder-generator:query-spreads */}
  }
`;
