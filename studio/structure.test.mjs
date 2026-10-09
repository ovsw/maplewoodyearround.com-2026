import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { indexPageIds, structure } from "./structure.ts";

// A stand-in for Sanity's structure builder. Every builder call returns a
// chainable record of the calls made on it, so the test can read the menu
// without a running Studio.
function builder(kind, args) {
  const calls = [];
  const record = new Proxy(
    { kind, args, calls },
    {
      get(target, property) {
        if (property in target) return target[property];
        return (...callArgs) => {
          calls.push([property, callArgs]);
          return record;
        };
      },
    },
  );
  return record;
}

const S = new Proxy({}, { get: (_, kind) => (...args) => builder(kind, args) });

function last(record, method) {
  return record.calls.findLast(([name]) => name === method)?.[1];
}

// Turn the recorded builders into a plain tree of menu items.
function toItem(record) {
  if (record.kind === "divider") return { divider: true, children: [] };
  const child = last(record, "child")?.[0];
  const item = { title: last(record, "title")?.[0], children: [] };
  if (!child || typeof child === "function") return item;
  if (child.kind === "list") {
    item.children = last(child, "items")[0].map(toItem);
  } else if (child.kind === "documentTypeList") {
    item.type = child.args[0];
    item.filter = last(child, "filter")?.[0];
    item.params = last(child, "params")?.[0];
    item.openChild = last(child, "child")?.[0];
  } else if (child.kind === "editor") {
    item.type = last(child, "schemaType")[0];
    item.documentId = last(child, "documentId")[0];
  }
  return item;
}

const root = last(structure(S), "items")[0].map(toItem);

function find(items, ...titles) {
  const [title, ...rest] = titles;
  const item = items.find((candidate) => candidate.title === title);
  assert.ok(item, `menu item "${title}" exists`);
  return rest.length ? find(item.children, ...rest) : item;
}

function leaves(items) {
  return items.flatMap((item) => {
    if (item.divider) return [];
    return item.children.length ? leaves(item.children) : [item];
  });
}

const schema = JSON.parse(
  readFileSync(new URL("./schema.json", import.meta.url), "utf8"),
);
const documentTypes = schema.filter(({ type }) => type === "document");

// Document types editors never open from the menu.
const notInMenu = new Map([
  [
    "teamMember",
    "OVS starter type with no Maplewood records; staff use staffMember",
  ],
]);

test("every document type that editors edit is in the menu", () => {
  const inMenu = new Set(leaves(root).map((item) => item.type));
  const missing = documentTypes
    .map(({ name }) => name)
    .filter((name) => !/^(sanity|media)\./.test(name))
    .filter((name) => !notInMenu.has(name) && !inMenu.has(name));
  assert.deepEqual(missing, []);
});

test("the root menu follows the OVS starter shape", () => {
  assert.deepEqual(
    root.map((item) => (item.divider ? "---" : item.title)),
    [
      "Home Page",
      "---",
      "Pages",
      "Blog",
      "Summer Camp",
      "School Year",
      "Parent Dashboard",
      "Seasons",
      "Grades",
      "Leadership",
      "Job Opportunities",
      "FAQs",
      "Testimonials",
      "Redirects",
      "---",
      "Site Configuration",
    ],
  );
  const titles = (...path) =>
    find(root, ...path).children.map((item) =>
      item.divider ? "---" : item.title,
    );
  assert.deepEqual(titles("Blog"), [
    "Blog Index",
    "Blog Post Settings",
    "---",
    "Blog Posts",
    "Categories",
    "Authors",
  ]);
  assert.deepEqual(titles("Summer Camp"), [
    "Programs",
    "Facilities",
    "Activities",
    "Groups",
    "Staff Members",
    "Sample Schedules",
    "FAQs",
    "Testimonials",
    "Summer documents",
  ]);
  assert.deepEqual(titles("Summer Camp", "Facilities"), [
    "Index",
    "List",
    "Categories",
  ]);
  assert.deepEqual(titles("Summer Camp", "Activities"), [
    "Index",
    "List",
    "Categories",
  ]);
  assert.deepEqual(titles("School Year"), [
    "Programs",
    "Facilities",
    "Activities",
    "Staff Members",
    "Sample Schedules",
    "Play Center",
    "FAQs",
    "Testimonials",
  ]);
  assert.deepEqual(titles("School Year", "Facilities"), [
    "Index",
    "List",
    "Categories",
  ]);
  assert.deepEqual(titles("School Year", "Activities"), ["List"]);
  assert.deepEqual(titles("School Year", "Play Center"), [
    "Calendar",
    "Guests",
    "Characters",
    "Printable calendars",
  ]);
  assert.deepEqual(titles("FAQs"), [
    "All FAQs",
    "FAQs by category",
    "FAQ categories",
  ]);
  assert.deepEqual(titles("Site Configuration"), [
    "Navigation",
    "Footer",
    "Global Settings",
  ]);
});

test("each side's lists show only records of that side", () => {
  const hasSide = new Set(
    documentTypes
      .filter(({ attributes }) => "program" in attributes)
      .map(({ name }) => name),
  );
  for (const [title, side] of [
    ["Summer Camp", "summerCamp"],
    ["School Year", "schoolYear"],
  ]) {
    const lists = leaves(find(root, title).children).filter(
      (item) => item.filter !== undefined || hasSide.has(item.type),
    );
    for (const list of lists.filter((item) => !item.documentId)) {
      const where = `${title} › ${list.title}`;
      assert.match(list.filter, /program == \$side/, where);
      assert.equal(list.params.side, side, where);
    }
  }
  const staff = find(root, "Summer Camp", "Staff Members");
  assert.match(staff.filter, /profileGroup != "leadership"/);
  assert.match(find(root, "Leadership").filter, /profileGroup == "leadership"/);
});

test("Index items open the page that shows the list", () => {
  const index = (...path) => find(root, ...path, "Index");
  assert.deepEqual(
    [
      index("Summer Camp", "Facilities"),
      index("Summer Camp", "Activities"),
      index("School Year", "Facilities"),
    ].map(({ type, documentId }) => [type, documentId]),
    [
      ["page", indexPageIds.summerCampFacilities],
      ["page", indexPageIds.summerCampActivities],
      ["page", indexPageIds.schoolYearFacilities],
    ],
  );
});

test("FAQs by category lists the FAQs of each category they belong to", () => {
  const byCategory = find(root, "FAQs", "FAQs by category");
  assert.equal(byCategory.type, "faqCategory");
  const faqs = byCategory.openChild("category-a");
  assert.equal(faqs.args[0], "faq");
  // Matches any of an FAQ's categories, so an FAQ in two shows in both.
  assert.equal(
    last(faqs, "filter")[0],
    '_type == "faq" && $categoryId in categories[]._ref',
  );
  assert.deepEqual(last(faqs, "params")[0], { categoryId: "category-a" });
});
