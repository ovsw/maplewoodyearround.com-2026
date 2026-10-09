import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cardSliderQuery } from "./card-slider";
import { filterableCardsQuery } from "./filterable-cards";
import { PARENT_DASHBOARD_QUERY } from "./parent-dashboard";
import { SEASONS_QUERY } from "./season";
import { summerDocumentListQuery } from "./summer-document-list";
import { teamMembersQuery } from "./team-members";
import { quoteWallQuery } from "./quote-wall";

// Use the GROQ evaluator shipped with this workspace's Sanity installation.
const requireFromSanity = createRequire(
  realpathSync(
    path.resolve(__dirname, "../../../studio/node_modules/sanity/package.json"),
  ),
);
const { parse, evaluate } = requireFromSanity("groq-js");
type Fixture = Record<string, unknown>;
const ref = (_ref: string) => ({ _type: "reference", _ref });

async function project(
  fragment: string,
  section: Fixture,
  documents: Fixture[],
) {
  const result = await evaluate(
    parse(`*[_id == "fixture-page"][0]{blocks[]{${fragment}}}`),
    {
      dataset: [
        { _id: "fixture-page", _type: "page", blocks: [section] },
        ...documents,
      ],
    },
  );
  return (await result.get()).blocks[0];
}

describe("Maplewood collection projections", () => {
  it("shows the selected testimonials in their order, even when switched off", async () => {
    const quote = (_id: string, order: number) => ({
      _id,
      _type: "testimonial",
      name: _id,
      visible: true,
      order,
      body: [{ _type: "block", children: [{ _type: "span", text: _id }] }],
    });
    const section = await project(
      quoteWallQuery,
      {
        _type: "quoteWall",
        selectedTestimonials: [ref("second"), ref("hidden"), ref("first")],
      },
      [
        quote("first", 0),
        quote("second", 100),
        quote("unplaced", 1),
        { ...quote("hidden", 2), visible: false },
      ],
    );
    expect(
      section.testimonials.map(
        (item: Fixture) => (item.document as Fixture)._id,
      ),
    ).toEqual(["second", "hidden", "first"]);
    expect(section.testimonials[0].document.body).toHaveLength(1);
  });
  it("selects facilities by program and category and puts unset order first, as Webflow", async () => {
    const facility = (_id: string, extra: Fixture = {}) => ({
      _id,
      _type: "facility",
      title: _id,
      program: "schoolYear",
      categories: [ref("sports")],
      ...extra,
    });
    const section = await project(
      cardSliderQuery,
      {
        _type: "cardSlider",
        source: "facility",
        program: "schoolYear",
        facilityCategory: ref("sports"),
      },
      [
        facility("unset"),
        facility("second", { order: 2 }),
        facility("first", { order: 1 }),
        facility("hidden", { visible: false, order: 0 }),
        facility("summer", { program: "summerCamp" }),
        facility("arts", { categories: [ref("arts")] }),
        facility("wrong-type", { _type: "activity" }),
      ],
    );
    expect(section.items.map((item: Fixture) => item._id)).toEqual([
      "unset",
      "first",
      "second",
    ]);
  });

  it("resolves facility grades without inventing grades for unmapped facilities", async () => {
    const section = await project(
      filterableCardsQuery,
      {
        _type: "filterableCards",
        source: "facility",
        program: "schoolYear",
      },
      [
        {
          _id: "mapped",
          _type: "facility",
          title: "A",
          program: "schoolYear",
          grades: [ref("grade")],
        },
        {
          _id: "unmapped",
          _type: "facility",
          title: "B",
          program: "schoolYear",
        },
        {
          _id: "grade",
          _type: "grade",
          title: "Grade 2",
          slug: { current: "grade-2" },
        },
      ],
    );
    expect(section.items[0].grades).toEqual([
      { _id: "grade", title: "Grade 2", slug: { current: "grade-2" } },
    ]);
    expect(section.items[1].grades).toBeNull();
  });

  it("lists a Summer activity's grades in school order, not in the order they were picked", async () => {
    const grade = (_id: string, order: number) => ({
      _id,
      _type: "grade",
      title: _id,
      order,
    });
    const section = await project(
      filterableCardsQuery,
      {
        _type: "filterableCards",
        source: "summerActivity",
        program: "summerCamp",
      },
      [
        {
          _id: "activity",
          _type: "summerActivity",
          title: "Archery",
          grades: [ref("3rd"), ref("preschool"), ref("1st")],
        },
        grade("preschool", 0),
        grade("1st", 2),
        grade("3rd", 4),
      ],
    );
    const ids = (grades: Fixture[]) => grades.map((item) => item._id);
    expect(ids(section.items[0].grades)).toEqual(["preschool", "1st", "3rd"]);
  });

  describe("Summer activities by grade and category", () => {
    const summerActivity = (_id: string, extra: Fixture = {}) => ({
      _id,
      _type: "summerActivity",
      title: _id,
      category: ref("swimming"),
      grades: [ref("3rd")],
      ...extra,
    });
    const campGroup = (_id: string, grades: string[]) => ({
      _id,
      _type: "campGroup",
      title: _id,
      grades: grades.map(ref),
    });
    const thirdGradeGroups = ["Mermaids", "Musketeers", "Unicorns", "Vikings"];
    const documents = [
      summerActivity("frog-water-slide", { title: "Frog Water Slide", order: 2 }),
      summerActivity("canoeing", { title: "Canoeing", order: 1 }),
      summerActivity("archery", { category: ref("sports") }),
      summerActivity("kickball", { grades: [ref("4th")] }),
      summerActivity("hidden", { visible: false }),
      // The old shared type is School Year only now.
      { _id: "old", _type: "activity", program: "summerCamp", category: ref("swimming") },
      ...thirdGradeGroups.map((title) => campGroup(title, ["3rd"])),
      campGroup("Knights", ["4th"]),
      { _id: "swimming", _type: "activityCategory", title: "Swimming" },
      { _id: "sports", _type: "activityCategory", title: "Sports" },
      { _id: "3rd", _type: "grade", title: "3rd Grade", order: 4 },
      { _id: "4th", _type: "grade", title: "4th Grade", order: 5 },
    ];
    const items = async (filters: Fixture) =>
      (
        await project(
          cardSliderQuery,
          { _type: "cardSlider", source: "summerActivity", program: "summerCamp", ...filters },
          documents,
        )
      ).items.map((item: Fixture) => item._id);

    it("selects by category and grade, in list order", async () => {
      expect(
        await items({ activityCategory: ref("swimming"), grade: ref("3rd") }),
      ).toEqual(["canoeing", "frog-water-slide"]);
      expect(await items({ activityCategory: ref("sports") })).toEqual(["archery"]);
      expect(await items({ grade: ref("4th") })).toEqual(["kickball"]);
    });

    it("shows an activity for every Camp group in its grades", async () => {
      for (const title of thirdGradeGroups) {
        const group = documents.find((document) => document._id === title) as {
          grades: { _ref: string }[];
        };
        for (const { _ref } of group.grades)
          expect(await items({ grade: ref(_ref) }), title).toContain("frog-water-slide");
      }
      expect(await items({ grade: ref("4th") })).not.toContain("frog-water-slide");
    });

    it("returns the category and grades for the Website filters", async () => {
      const section = await project(
        filterableCardsQuery,
        { _type: "filterableCards", source: "summerActivity", program: "summerCamp" },
        documents,
      );
      const frog = section.items.find((item: Fixture) => item._id === "frog-water-slide");
      expect(frog.category).toEqual({ _id: "swimming", title: "Swimming", slug: null });
      expect(frog.grades).toEqual([{ _id: "3rd", title: "3rd Grade", slug: null }]);
    });

    it("shows no Summer activities in a School Year section", async () => {
      expect(await items({ program: "schoolYear" })).toEqual([]);
    });
  });

  describe("School Year activities by Program", () => {
    const schoolYearActivity = (_id: string, extra: Fixture = {}) => ({
      _id,
      _type: "schoolYearActivity",
      title: _id,
      programs: [ref("indoor-play-center")],
      location: "Indoor",
      ...extra,
    });
    const documents = [
      schoolYearActivity("reptiles", {
        programs: [ref("indoor-play-center"), ref("birthday-parties")],
        order: 2,
      }),
      schoolYearActivity("bounce-house", { order: 1 }),
      schoolYearActivity("zip-line", { location: "Outdoor" }),
      schoolYearActivity("tumbling", { programs: [ref("gymnastics")] }),
      schoolYearActivity("hidden", { visible: false }),
      schoolYearActivity("spidey-heroes", { programs: [], location: "Special" }),
      // Old shared records and Summer activities never show here.
      { _id: "old", _type: "activity", program: "schoolYear", programs: [ref("indoor-play-center")] },
      { _id: "frog", _type: "summerActivity", title: "Frog", programs: [ref("indoor-play-center")] },
      { _id: "indoor-play-center", _type: "programOffering", title: "Indoor Play Center" },
      { _id: "birthday-parties", _type: "programOffering", title: "Birthday Parties" },
      { _id: "gymnastics", _type: "programOffering", title: "Gymnastics Class" },
    ];
    const items = async (filters: Fixture) =>
      (
        await project(
          cardSliderQuery,
          { _type: "cardSlider", source: "schoolYearActivity", program: "schoolYear", ...filters },
          documents,
        )
      ).items.map((item: Fixture) => item._id);

    it("shows a Program the School Year activities that name it, in list order", async () => {
      expect(
        await items({ programOffering: ref("indoor-play-center"), location: "Indoor" }),
      ).toEqual(["bounce-house", "reptiles"]);
      expect(await items({ programOffering: ref("birthday-parties") })).toEqual(["reptiles"]);
      expect(await items({ programOffering: ref("gymnastics") })).toEqual(["tumbling"]);
    });

    it("selects by location alone, including activities without a Program", async () => {
      expect(await items({ location: "Special" })).toEqual(["spidey-heroes"]);
    });

    it("shows no School Year activities in a Summer Camp section", async () => {
      expect(await items({ program: "summerCamp" })).toEqual([]);
    });

    it("returns the Programs of each activity", async () => {
      const section = await project(
        filterableCardsQuery,
        {
          _type: "filterableCards",
          source: "schoolYearActivity",
          program: "schoolYear",
          programOffering: ref("birthday-parties"),
        },
        documents,
      );
      expect(section.items).toHaveLength(1);
      expect(section.items[0].programs.map((item: Fixture) => item._id)).toEqual([
        "indoor-play-center",
        "birthday-parties",
      ]);
    });
  });

  it("includes Playground guests in School Year without a synthetic program field", async () => {
    const documents = [
      { _id: "guest", _type: "playgroundGuest", title: "Guest" },
    ];
    const section = {
      _type: "cardSlider",
      source: "playgroundGuest",
      program: "schoolYear",
    };
    expect(
      (await project(cardSliderQuery, section, documents)).items,
    ).toHaveLength(1);
    expect(
      (
        await project(
          cardSliderQuery,
          { ...section, program: "summerCamp" },
          documents,
        )
      ).items,
    ).toHaveLength(0);
  });
});

describe("Maplewood destination and staff projections", () => {
  it("keeps leadership separate from the default roster and applies tour and preschool filters", async () => {
    const staff = (_id: string, extra: Fixture = {}) => ({
      _id,
      _type: "staffMember",
      name: _id,
      program: "schoolYear",
      ...extra,
    });
    const documents = [
      staff("roster"),
      staff("guide", { preschoolTeacher: true, givesTours: true }),
      staff("teacher", { preschoolTeacher: true }),
      staff("leadership", { profileGroup: "leadership" }),
      staff("hidden", { visible: false }),
      staff("summer", { program: "summerCamp" }),
    ];
    const section = { _type: "teamMembers", program: "schoolYear" };
    const ids = (result: { members: { _ref: string }[] }) =>
      result.members.map((member) => member._ref);
    expect(ids(await project(teamMembersQuery, section, documents))).toEqual([
      "guide",
      "roster",
      "teacher",
    ]);
    expect(
      ids(
        await project(
          teamMembersQuery,
          { ...section, profileGroup: "leadership" },
          documents,
        ),
      ),
    ).toEqual(["leadership"]);
    expect(
      ids(
        await project(
          teamMembersQuery,
          { ...section, preschoolOnly: true, tourGuidesOnly: true },
          documents,
        ),
      ),
    ).toEqual(["guide"]);
  });

  it("returns each tab's cards in order with file, page and external links", async () => {
    const card = (_key: string, destination?: Fixture) => ({
      _key,
      _type: "dashboardCard",
      title: _key,
      link: { _type: "contentAction", label: "Visit Page", destination },
    });
    const result = await evaluate(parse(PARENT_DASHBOARD_QUERY), {
      dataset: [
        {
          _id: "parentDashboard",
          _type: "parentDashboard",
          title: "Parent Dashboard",
          schoolYearCards: [
            card("external", {
              kind: "external",
              external: "https://example.test/forms",
            }),
          ],
          summerCampCards: [
            card("file", { kind: "file", file: { asset: ref("pdf") } }),
            card("internal", {
              kind: "internal",
              internal: ref("parentDashboard"),
            }),
            card("missing"),
          ],
        },
        {
          _id: "pdf",
          _type: "sanity.fileAsset",
          url: "https://cdn.sanity.io/files/example.pdf",
        },
      ],
    });
    const dashboard = await result.get();
    const hrefs = (cards: Array<{ link: { destination: { href: string } | null } }>) =>
      cards.map((item) => item.link.destination?.href ?? null);
    expect(hrefs(dashboard.schoolYearCards)).toEqual([
      "https://example.test/forms",
    ]);
    expect(hrefs(dashboard.summerCampCards)).toEqual([
      "https://cdn.sanity.io/files/example.pdf",
      "/parent-dashboard",
      null,
    ]);
  });
});

describe("summer document visibility", () => {
  it.each(["schedule", "welcomeLetter"])(
    "returns only %s PDFs for visible or ungrouped entries",
    async (kind) => {
      const entry = (
        _key: string,
        entryKind: string,
        group?: string,
        asset = "pdf",
      ) => ({
        _key,
        title: _key,
        kind: entryKind,
        group: group ? ref(group) : undefined,
        file: { asset: ref(asset) },
      });
      const section = await project(
        summerDocumentListQuery,
        {
          _type: "summerDocumentList",
          kind,
          documents: ref("documents"),
        },
        [
          {
            _id: "documents",
            _type: "summerDocuments",
            gradeGroups: [
              {
                _key: "grade",
                grade: ref("grade"),
                heading: "Grades 2 & 3",
                entries: [
                  entry("schedule", "schedule", "visible"),
                  entry("welcome", "welcomeLetter", "visible"),
                  entry("hidden", kind, "hidden"),
                  entry("unresolved", kind, "missing"),
                  entry("ungrouped", kind),
                  entry("missing-file", kind, "visible", "missing-file"),
                ],
              },
            ],
          },
          { _id: "grade", _type: "grade", title: "Grade 2" },
          { _id: "visible", _type: "campGroup", title: "Visible" },
          {
            _id: "hidden",
            _type: "campGroup",
            title: "Hidden",
            visible: false,
          },
          {
            _id: "pdf",
            _type: "sanity.fileAsset",
            url: "https://cdn.sanity.io/files/example.pdf",
          },
        ],
      );
      expect(
        section.documents.gradeGroups[0].entries.map(
          (item: Fixture) => item._key,
        ),
      ).toEqual([kind === "schedule" ? "schedule" : "welcome", "ungrouped"]);
      expect(section.documents.gradeGroups[0].heading).toBe("Grades 2 & 3");
    },
  );
});

describe("Current and next Season", () => {
  const season = (
    _id: string,
    program: string,
    startDate?: string,
    endDate?: string,
  ) => ({ _id, _type: "season", title: _id, program, startDate, endDate });
  const dated = [
    season("summer-2027", "summerCamp", "2027-06-21", "2027-08-13"),
    season("summer-2028", "summerCamp", "2028-06-19", "2028-08-11"),
    season("school-year-2026", "schoolYear", "2026-09-08", "2027-06-11"),
    season("school-year-2027", "schoolYear", "2027-09-07", "2028-06-09"),
  ];

  async function seasonsOn(today: string, dataset: Fixture[] = dated) {
    const result = await evaluate(parse(SEASONS_QUERY), {
      dataset,
      params: { today },
    });
    const seasons = await result.get();
    const ids = (side: { current: Fixture | null; next: Fixture | null }) => [
      side.current?._id ?? null,
      side.next?._id ?? null,
    ];
    return {
      summerCamp: ids(seasons.summerCamp),
      schoolYear: ids(seasons.schoolYear),
      seasons,
    };
  }

  it("gives the current and next Season of each side", async () => {
    const result = await seasonsOn("2027-07-04");
    expect(result.summerCamp).toEqual(["summer-2027", "summer-2028"]);
    expect(result.schoolYear).toEqual([null, "school-year-2027"]);
    expect(result.seasons.summerCamp.current).toEqual({
      _id: "summer-2027",
      title: "summer-2027",
      slug: null,
      program: "summerCamp",
      startDate: "2027-06-21",
      endDate: "2027-08-13",
    });
  });

  it("counts the first and last day as part of the Season", async () => {
    expect((await seasonsOn("2027-06-21")).summerCamp[0]).toBe("summer-2027");
    expect((await seasonsOn("2027-08-13")).summerCamp[0]).toBe("summer-2027");
  });

  it("gives no current Season and the right next Season in a gap", async () => {
    const result = await seasonsOn("2027-08-30");
    expect(result.summerCamp).toEqual([null, "summer-2028"]);
    expect(result.schoolYear).toEqual([null, "school-year-2027"]);
  });

  it("gives the first Season as next before every Season starts", async () => {
    const result = await seasonsOn("2026-01-15");
    expect(result.summerCamp).toEqual([null, "summer-2027"]);
    expect(result.schoolYear).toEqual([null, "school-year-2026"]);
  });

  it("gives empty values after the last Season ends", async () => {
    const result = await seasonsOn("2028-09-01");
    expect(result.summerCamp).toEqual([null, null]);
    expect(result.schoolYear).toEqual([null, null]);
  });

  it("gives empty values when no Season has dates", async () => {
    const result = await seasonsOn("2027-07-04", [
      season("summer-camp", "summerCamp"),
      season("school-year", "schoolYear", "2027-09-07"),
    ]);
    expect(result.seasons).toEqual({
      summerCamp: { current: null, next: null },
      schoolYear: { current: null, next: null },
    });
  });
});
