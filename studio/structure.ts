import type { StructureBuilder, StructureResolver } from "sanity/structure";

function documents(
  S: StructureBuilder,
  type: string,
  title: string,
  filter?: string,
  params: Record<string, string> = {},
) {
  const list = S.documentTypeList(type).title(title);
  return S.listItem()
    .title(title)
    .schemaType(type)
    .child(filter ? list.filter(filter).params(params) : list);
}

function singleton(S: StructureBuilder, type: string, title: string) {
  return S.listItem()
    .title(title)
    .child(S.editor().id(type).schemaType(type).documentId(type));
}

function programContent(S: StructureBuilder, program: string, title: string) {
  return S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items([
          documents(
            S,
            "page",
            "Pages",
            '_type == "page" && (slug.current match $path || slug.current match $slashPath)',
            {
              path: program === "summerCamp" ? "summer-camp*" : "school-year*",
              slashPath:
                program === "summerCamp" ? "/summer-camp*" : "/school-year*",
            },
          ),
          ...[
            ["programOffering", "Programs"],
            ["activity", "Activities"],
            ["facility", "Facilities"],
            ["facilityCategory", "Facility categories"],
            ["staffMember", "Staff"],
            ["sampleSchedule", "Sample schedules"],
            ["faq", "FAQs"],
            ["testimonial", "Testimonials"],
          ].map(([type, label]) =>
            documents(S, type, label, "_type == $type && program == $program", {
              type,
              program,
            }),
          ),
          ...(program === "summerCamp"
            ? [
                documents(S, "activityCategory", "Activity categories"),
                documents(S, "campGroup", "Camp groups"),
                documents(S, "grade", "Grades"),
              ]
            : [
                documents(S, "playgroundEvent", "Playground calendar days"),
                documents(S, "playgroundCalendar", "Playground calendar PDFs"),
                documents(S, "playgroundCharacter", "Playground characters"),
                documents(S, "playgroundGuest", "Playground guests"),
              ]),
        ]),
    );
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Maplewood")
    .items([
      programContent(S, "summerCamp", "Summer Camp"),
      programContent(S, "schoolYear", "School Year"),
      S.listItem()
        .title("Parents")
        .child(
          S.list()
            .title("Parents")
            .items([
              singleton(S, "parentDashboard", "Parent dashboard"),
              documents(S, "summerDocuments", "Summer documents"),
              documents(S, "season", "Seasons"),
            ]),
        ),
      S.listItem()
        .title("About")
        .child(
          S.list()
            .title("About")
            .items([
              singleton(S, "homePage", "Home page"),
              documents(S, "page", "All pages"),
              documents(
                S,
                "staffMember",
                "Leadership",
                '_type == "staffMember" && profileGroup == "leadership"',
              ),
              documents(S, "jobOpportunity", "Job opportunities"),
              documents(S, "faqCategory", "FAQ categories"),
            ]),
        ),
      S.listItem()
        .title("News")
        .child(
          S.list()
            .title("News")
            .items([
              singleton(S, "blogIndex", "News page"),
              documents(S, "post", "News posts"),
              documents(S, "category", "News categories"),
              documents(S, "author", "Authors"),
              singleton(S, "blogPostSettings", "News post settings"),
            ]),
        ),
      S.listItem()
        .title("Site settings")
        .child(
          S.list()
            .title("Site settings")
            .items([
              singleton(S, "settings", "Site identity, contact and analytics"),
              singleton(S, "navigation", "Navigation"),
              singleton(S, "footer", "Footer and newsletter"),
              documents(S, "redirect", "Redirects"),
            ]),
        ),
    ]);
