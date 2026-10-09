// documents
import staffMember from "./schemas/documents/staff-member";
import activity from "./schemas/documents/activity";
import summerActivity from "./schemas/documents/summer-activity";
import facility from "./schemas/documents/facility";
import programOffering from "./schemas/documents/program-offering";
import {
  activityCategory,
  facilityCategory,
  grade,
  season,
} from "./schemas/documents/maplewood-categories";
import campGroup from "./schemas/documents/camp-group";
import sampleSchedule from "./schemas/documents/sample-schedule";
import jobOpportunity from "./schemas/documents/job-opportunity";
import {
  playgroundCharacter,
  playgroundGuest,
  playgroundEvent,
  playgroundCalendar,
} from "./schemas/documents/playground";
import parentDashboard, {
  summerDocuments,
} from "./schemas/documents/parent-dashboard";
import contentDestination from "./schemas/blocks/shared/content-destination";
import {
  breadcrumb,
  contentAction,
  contentCard,
  featureItem,
  tagline,
} from "./schemas/blocks/shared/maplewood-fields";
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
import settings, { settingsSchemaTypes } from "./schemas/documents/settings";
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
import basicRichText from "./schemas/blocks/shared/basic-rich-text";
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
import videoHero from "./schemas/blocks/video-hero";
import videoZoomGrid from "./schemas/blocks/video-zoom-grid";
import scrollPanels from "./schemas/blocks/scroll-panels";
import busMap from "./schemas/blocks/bus-map";
import imageReveal from "./schemas/blocks/image-reveal";
import directorIntro from "./schemas/blocks/director-intro";
import programCards from "./schemas/blocks/program-cards";
import electiveCards from "./schemas/blocks/elective-cards";
import historyStory from "./schemas/blocks/history-story";
import rateTable from "./schemas/blocks/rate-table";
import pricingCards from "./schemas/blocks/pricing-cards";
import cardSlider from "./schemas/blocks/card-slider";
import statistics from "./schemas/blocks/statistics";
import filterableCards from "./schemas/blocks/filterable-cards";
import instructionSteps from "./schemas/blocks/instruction-steps";
import embedSection from "./schemas/blocks/embed-section";
import contactDetailsSection from "./schemas/blocks/contact-details-section";
import jobList from "./schemas/blocks/job-list";
import summerDocumentList from "./schemas/blocks/summer-document-list";
import tabbedHero from "./schemas/blocks/tabbed-hero";
import iconCards from "./schemas/blocks/icon-cards";
import registrationCards from "./schemas/blocks/registration-cards";
// page-builder-generator:block-imports

export const schemaTypes = [
  staffMember,
  activity,
  summerActivity,
  facility,
  programOffering,
  activityCategory,
  facilityCategory,
  grade,
  season,
  campGroup,
  sampleSchedule,
  jobOpportunity,
  playgroundCharacter,
  playgroundGuest,
  playgroundEvent,
  playgroundCalendar,
  parentDashboard,
  summerDocuments,
  contentDestination,
  contentAction,
  contentCard,
  tagline,
  featureItem,
  breadcrumb,
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
  basicRichText,
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
  videoHero,
  videoZoomGrid,
  scrollPanels,
  busMap,
  imageReveal,
  directorIntro,
  programCards,
  electiveCards,
  historyStory,
  rateTable,
  pricingCards,
  cardSlider,
  statistics,
  filterableCards,
  instructionSteps,
  embedSection,
  contactDetailsSection,
  jobList,
  summerDocumentList,
  tabbedHero,
  iconCards,
  registrationCards,
  // page-builder-generator:block-types
];
