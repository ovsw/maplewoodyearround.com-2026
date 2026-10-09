import {
  Award,
  Backpack,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Drama,
  FileStack,
  FileText,
  Files,
  FolderTree,
  Globe2,
  GraduationCap,
  House,
  IdCard,
  LayoutDashboard,
  ListTree,
  MapPinned,
  Menu,
  MessageCircleQuestion,
  Newspaper,
  Palette,
  PanelBottom,
  PanelRight,
  PartyPopper,
  PenLine,
  Printer,
  Quote,
  Settings,
  Shapes,
  Signpost,
  Sun,
  Tags,
  ToyBrick,
  Users,
  Volleyball,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  ListBuilder,
  StructureBuilder,
  StructureResolver,
} from "sanity/structure";

// The menu follows the OVS starter (Home Page, Pages, Blog, FAQs,
// Testimonials, Redirects, Site Configuration, with its two dividers) and adds
// the Maplewood sides and lists in between.

type Icon = ComponentType;
type Side = "summerCamp" | "schoolYear";
type Ordering = { field: string; direction: "asc" | "desc" }[];

// The page records that show a list on the Website. They keep the ids the
// Webflow import gave them.
export const indexPageIds = {
  summerCampFacilities: "wf-page-9bc327644db7254e",
  summerCampActivities: "wf-page-22ce4c4e131eb3dc",
  schoolYearFacilities: "wf-page-73092e06d6363de2",
};

const byOrder: Ordering = [
  { field: "order", direction: "asc" },
  { field: "title", direction: "asc" },
];
const byName: Ordering = [
  { field: "order", direction: "asc" },
  { field: "name", direction: "asc" },
];
const byTitle: Ordering = [{ field: "title", direction: "asc" }];

function documents(
  S: StructureBuilder,
  type: string,
  title: string,
  icon: Icon,
  options: {
    filter?: string;
    params?: Record<string, string>;
    ordering?: Ordering;
  } = {},
) {
  const { filter, params, ordering } = options;
  let list = S.documentTypeList(type).title(title);
  if (filter) list = list.filter(filter).params(params ?? {});
  if (ordering) list = list.defaultOrdering(ordering);
  return S.listItem().title(title).icon(icon).schemaType(type).child(list);
}

// A list of one side's records. Leadership staff have no side and stay out.
function sideDocuments(
  S: StructureBuilder,
  side: Side,
  type: string,
  title: string,
  icon: Icon,
  ordering: Ordering = byOrder,
) {
  const leadership =
    type === "staffMember" ? ' && profileGroup != "leadership"' : "";
  return documents(S, type, title, icon, {
    filter: `_type == $type && program == $side${leadership}`,
    params: { type, side },
    ordering,
  });
}

function editor(
  S: StructureBuilder,
  type: string,
  id: string,
  title: string,
  icon: Icon,
) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .child(S.editor().id(id).schemaType(type).documentId(id));
}

function singleton(
  S: StructureBuilder,
  type: string,
  title: string,
  icon: Icon,
) {
  return editor(S, type, type, title, icon);
}

function group(
  S: StructureBuilder,
  title: string,
  icon: Icon,
  items: Parameters<ListBuilder["items"]>[0],
) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .child(S.list().title(title).items(items));
}

function indexPage(S: StructureBuilder, pageId: string) {
  return editor(S, "page", pageId, "Index", FileText);
}

function facilities(S: StructureBuilder, side: Side, indexPageId: string) {
  return group(S, "Facilities", MapPinned, [
    indexPage(S, indexPageId),
    sideDocuments(S, side, "facility", "List", MapPinned),
    sideDocuments(S, side, "facilityCategory", "Categories", Tags),
  ]);
}

function summerCamp(S: StructureBuilder) {
  const side = "summerCamp";
  return group(S, "Summer Camp", Sun, [
    sideDocuments(S, side, "programOffering", "Programs", Shapes),
    facilities(S, side, indexPageIds.summerCampFacilities),
    group(S, "Activities", Volleyball, [
      indexPage(S, indexPageIds.summerCampActivities),
      sideDocuments(S, side, "activity", "List", Volleyball),
      // Activity categories are Summer Camp only and have no side field.
      documents(S, "activityCategory", "Categories", Tags, {
        ordering: byOrder,
      }),
    ]),
    documents(S, "campGroup", "Groups", Users, { ordering: byOrder }),
    sideDocuments(S, side, "staffMember", "Staff Members", IdCard, byName),
    sideDocuments(S, side, "sampleSchedule", "Sample Schedules", CalendarClock),
    sideDocuments(S, side, "faq", "FAQs", MessageCircleQuestion),
    sideDocuments(S, side, "testimonial", "Testimonials", Quote),
    // Stays here until #52 moves the PDFs onto the camp groups.
    documents(S, "summerDocuments", "Summer documents", FileStack),
  ]);
}

function schoolYear(S: StructureBuilder) {
  const side = "schoolYear";
  return group(S, "School Year", GraduationCap, [
    sideDocuments(S, side, "programOffering", "Programs", Shapes),
    facilities(S, side, indexPageIds.schoolYearFacilities),
    group(S, "Activities", Palette, [
      sideDocuments(S, side, "activity", "List", Palette),
    ]),
    sideDocuments(S, side, "staffMember", "Staff Members", IdCard, byName),
    sideDocuments(S, side, "sampleSchedule", "Sample Schedules", CalendarClock),
    // Play Center records are School Year only and have no side field.
    group(S, "Play Center", ToyBrick, [
      documents(S, "playgroundEvent", "Calendar", CalendarDays, {
        ordering: [{ field: "date", direction: "desc" }],
      }),
      documents(S, "playgroundGuest", "Guests", PartyPopper, {
        ordering: byTitle,
      }),
      documents(S, "playgroundCharacter", "Characters", Drama, {
        ordering: byOrder,
      }),
      documents(S, "playgroundCalendar", "Printable calendars", Printer, {
        ordering: [{ field: "effectiveFrom", direction: "desc" }],
      }),
    ]),
    sideDocuments(S, side, "faq", "FAQs", MessageCircleQuestion),
    sideDocuments(S, side, "testimonial", "Testimonials", Quote),
  ]);
}

function faqs(S: StructureBuilder) {
  return group(S, "FAQs", MessageCircleQuestion, [
    documents(S, "faq", "All FAQs", MessageCircleQuestion, {
      ordering: byTitle,
    }),
    S.listItem()
      .title("FAQs by category")
      .icon(ListTree)
      .child(
        S.documentTypeList("faqCategory")
          .title("FAQs by category")
          .defaultOrdering(byOrder)
          // An FAQ shows under every category it has.
          .child((categoryId) =>
            S.documentTypeList("faq")
              .title("FAQs")
              .filter('_type == "faq" && $categoryId in categories[]._ref')
              .params({ categoryId })
              .defaultOrdering(byOrder),
          ),
      ),
    documents(S, "faqCategory", "FAQ categories", FolderTree, {
      ordering: byOrder,
    }),
  ]);
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      singleton(S, "homePage", "Home Page", House),
      S.divider(),
      documents(S, "page", "Pages", Files, { ordering: byTitle }),
      group(S, "Blog", Newspaper, [
        singleton(S, "blogIndex", "Blog Index", Newspaper),
        singleton(S, "blogPostSettings", "Blog Post Settings", PanelRight),
        S.divider(),
        documents(S, "post", "Blog Posts", FileText, {
          ordering: [{ field: "_createdAt", direction: "desc" }],
        }),
        documents(S, "category", "Categories", Tags, { ordering: byTitle }),
        documents(S, "author", "Authors", PenLine, {
          ordering: [{ field: "name", direction: "asc" }],
        }),
      ]),
      summerCamp(S),
      schoolYear(S),
      singleton(S, "parentDashboard", "Parent Dashboard", LayoutDashboard),
      documents(S, "season", "Seasons", CalendarRange, {
        ordering: [{ field: "startDate", direction: "desc" }],
      }),
      documents(S, "grade", "Grades", Backpack, { ordering: byOrder }),
      documents(S, "staffMember", "Leadership", Award, {
        filter: '_type == "staffMember" && profileGroup == "leadership"',
        ordering: byName,
      }),
      documents(S, "jobOpportunity", "Job Opportunities", BriefcaseBusiness, {
        ordering: byOrder,
      }),
      faqs(S),
      documents(S, "testimonial", "Testimonials", Quote, {
        ordering: [{ field: "name", direction: "asc" }],
      }),
      documents(S, "redirect", "Redirects", Signpost, {
        ordering: [{ field: "source.current", direction: "asc" }],
      }),
      S.divider(),
      group(S, "Site Configuration", Settings, [
        singleton(S, "navigation", "Navigation", Menu),
        singleton(S, "footer", "Footer", PanelBottom),
        singleton(S, "settings", "Global Settings", Globe2),
      ]),
    ]);
