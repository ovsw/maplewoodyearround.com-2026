import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cardSliderQuery } from "./card-slider";
import { filterableCardsQuery } from "./filterable-cards";
import { parentDashboardSectionQuery } from "./parent-dashboard-section";
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
  it("shows only the selected source testimonials, in their source order", async () => {
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
    ).toEqual(["second", "first"]);
    expect(section.testimonials[0].document.body).toHaveLength(1);
  });
  it("selects facilities by program and category and puts unset order last", async () => {
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
      "first",
      "second",
      "unset",
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

  it("retains activity group grades and program references while filtering the selected category", async () => {
    const section = await project(
      filterableCardsQuery,
      {
        _type: "filterableCards",
        source: "activity",
        program: "summerCamp",
        activityCategory: ref("category"),
        programOffering: ref("program"),
      },
      [
        {
          _id: "activity",
          _type: "activity",
          program: "summerCamp",
          category: ref("category"),
          groups: [ref("group")],
          programs: [ref("program")],
        },
        {
          _id: "other",
          _type: "activity",
          program: "summerCamp",
          category: ref("other-category"),
          programs: [ref("program")],
        },
        {
          _id: "other-program",
          _type: "activity",
          program: "summerCamp",
          category: ref("category"),
          programs: [ref("other-program")],
        },
        { _id: "category", _type: "activityCategory", title: "Sports" },
        {
          _id: "group",
          _type: "campGroup",
          title: "Group",
          grades: [ref("grade")],
        },
        { _id: "grade", _type: "grade", title: "Grade 2" },
        { _id: "program", _type: "programOffering", title: "Full day" },
      ],
    );
    expect(section.items).toHaveLength(1);
    expect(section.items[0].groups[0].grades[0]._id).toBe("grade");
    expect(section.items[0].programs[0]._id).toBe("program");
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

  it("returns usable dashboard links and season programs, excluding placeholder destinations", async () => {
    const card = (_id: string, destination?: Fixture, extra: Fixture = {}) => ({
      _id,
      _type: "dashboardCard",
      title: _id,
      seasons: [ref("season")],
      destination,
      ...extra,
    });
    const section = await project(
      parentDashboardSectionQuery,
      { _type: "parentDashboardSection" },
      [
        card("external", {
          kind: "external",
          external: "https://example.test/forms",
        }),
        card("file", { kind: "file", file: { asset: ref("pdf") } }),
        card("internal", { kind: "internal", internal: ref("dashboard") }),
        card("empty", { kind: "external", external: "" }),
        card("placeholder", { kind: "external", external: "#" }),
        card("missing"),
        card("unresolved", { kind: "internal", internal: ref("missing") }),
        card(
          "hidden",
          { kind: "external", external: "https://example.test" },
          { visible: false },
        ),
        { _id: "dashboard", _type: "parentDashboard" },
        {
          _id: "pdf",
          _type: "sanity.fileAsset",
          url: "https://cdn.sanity.io/files/example.pdf",
        },
        {
          _id: "season",
          _type: "season",
          title: "Summer",
          program: "summerCamp",
        },
      ],
    );
    expect(section.cards.map((item: Fixture) => item._id)).toEqual([
      "external",
      "file",
      "internal",
    ]);
    expect(
      section.cards.map(
        (item: { destination: { href: string } }) => item.destination.href,
      ),
    ).toEqual([
      "https://example.test/forms",
      "https://cdn.sanity.io/files/example.pdf",
      "/parent-dashboard",
    ]);
    expect(section.cards[0].seasons[0].program).toBe("summerCamp");
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
