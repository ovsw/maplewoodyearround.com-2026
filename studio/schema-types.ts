// documents
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import author from "./schemas/documents/author";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import faqCategory from "./schemas/documents/faq-category";
import testimonial from "./schemas/documents/testimonial";
import navigation, {
  navigationSchemaTypes,
} from "./schemas/documents/navigation";
import settings, {
  settingsSchemaTypes,
} from "./schemas/documents/settings";
import teamMember from "./schemas/documents/team-member";
import blogIndex from "./schemas/documents/blog-index";
import blogPostSettings from "./schemas/documents/blog-post-settings";
import homePage from "./schemas/documents/home-page";
import footer, { footerSchemaTypes } from "./schemas/documents/footer";
import redirect from "./schemas/documents/redirect";

// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import link from "./schemas/blocks/shared/link";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import { sectionBackground } from "./schemas/blocks/shared/section-background";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import customUrl from "./schemas/blocks/shared/custom-url";
import customLink from "./schemas/blocks/shared/custom-link";
import button from "./schemas/blocks/shared/button";
import buttonLink from "./schemas/blocks/shared/button-link";
import richTextContent from "./schemas/blocks/shared/rich-text-content";
import simpleRichText from "./schemas/blocks/shared/simple-rich-text";
import minimalRichText from "./schemas/blocks/shared/minimal-rich-text";
import {
  blogPostSidebar,
  blogPostSidebarAction,
} from "./schemas/blocks/shared/blog-post-sidebar";
// Schema UI objects
import hero from "./schemas/blocks/hero";
import latestArticles from "./schemas/blocks/latest-articles";
import faqAccordion from "./schemas/blocks/faq-accordion";
import storyFeature from "./schemas/blocks/story-feature";
import teamMembers from "./schemas/blocks/team-members";
import richTextBlock from "./schemas/blocks/rich-text-block";
import ctaBanner from "./schemas/blocks/cta-banner";
import benefitCards from "./schemas/blocks/benefit-cards";
import homeHero from "./schemas/blocks/home-hero";
import imageCollageFeature from "./schemas/blocks/image-collage-feature";
import featureCards from "./schemas/blocks/feature-cards";
import stackedFeatureRows from "./schemas/blocks/stacked-feature-rows";
import innerHero from "./schemas/blocks/inner-hero";
import stackedTimeline from "./schemas/blocks/stacked-timeline";
import bigImageList from "./schemas/blocks/big-image-list";
import largeSlides from "./schemas/blocks/large-slides";
import headingImage from "./schemas/blocks/heading-image";
import quoteWall from "./schemas/blocks/quote-wall";
import faqHub from "./schemas/blocks/faq-hub";
// page-builder-generator:block-imports

export const schemaTypes = [
  // documents
  page,
  post,
  author,
  category,
  faq,
  faqCategory,
  testimonial,
  navigation,
  ...navigationSchemaTypes,
  settings,
  ...settingsSchemaTypes,
  teamMember,
  blogIndex,
  blogPostSettings,
  homePage,
  footer,
  redirect,
  ...footerSchemaTypes,
  // shared objects
  blockContent,
  link,
  colorVariant,
  sectionBackground,
  buttonVariant,
  customUrl,
  customLink,
  button,
  buttonLink,
  richTextContent,
  simpleRichText,
  minimalRichText,
  blogPostSidebarAction,
  blogPostSidebar,
  // blocks
  hero,
  latestArticles,
  faqAccordion,
  storyFeature,
  teamMembers,
  richTextBlock,
  ctaBanner,
  benefitCards,
  homeHero,
  imageCollageFeature,
  featureCards,
  stackedFeatureRows,
  innerHero,
  stackedTimeline,
  bigImageList,
  largeSlides,
  headingImage,
  quoteWall,
  faqHub,
  // page-builder-generator:block-types
];
