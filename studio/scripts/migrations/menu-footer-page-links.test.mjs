import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration, { sitePath } from "./menu-footer-page-links.mjs";

const nav = (external, extra = {}) => ({ _type: "navigationDestination", kind: "external", external, openInNewTab: false, ...extra });
const foot = (external, extra = {}) => ({ _type: "footerDestination", kind: "external", external, openInNewTab: false, ...extra });
const ref = (id) => ({ _type: "reference", _ref: id });

const pages = [
  { _id: "homePage", _type: "homePage", _rev: "p0" },
  { _id: "parentDashboard", _type: "parentDashboard", _rev: "p1" },
  { _id: "wf-page-summer", _type: "page", _rev: "p2", slug: { current: "summer-camp" } },
  { _id: "wf-page-play", _type: "page", _rev: "p3", slug: { current: "school-year/programs/indoor-outdoor-play-center" } },
  { _id: "wf-page-contact", _type: "page", _rev: "p4", slug: { current: "contact" } },
  { _id: "drafts.wf-page-new", _type: "page", _rev: "p5", slug: { current: "new-page" } },
];

const navigation = {
  _id: "navigation",
  _type: "navigation",
  _rev: "n1",
  items: [
    { _key: "a", _type: "navigationLink", label: "Play Center", destination: nav("/school-year/programs/indoor-outdoor-play-center") },
    {
      _key: "b",
      _type: "navigationGroup",
      label: "Summer Camp",
      destination: nav("/summer-camp/"),
      links: [
        { _key: "b1", _type: "navigationChildLink", label: "Programs", destination: { _type: "navigationDestination", kind: "internal", internal: ref("wf-page-summer") } },
        { _key: "b2", _type: "navigationChildLink", label: "Gift Card", destination: nav("https://example.com/shop?id=1", { openInNewTab: true }) },
        { _key: "b3", _type: "navigationChildLink", label: "Draft only", destination: nav("/new-page") },
        { _key: "b4", _type: "navigationChildLink", label: "Gone", destination: nav("/old-page") },
      ],
    },
    { _key: "c", _type: "navigationGroup", label: "About Us", links: [] },
  ],
  actions: [{ _key: "d", _type: "navigationAction", label: "Parent Dashboard", destination: nav("/parent-dashboard") }],
};

const footer = {
  _id: "footer",
  _type: "footer",
  _rev: "f1",
  columns: [{ _key: "c", _type: "footerColumn", heading: "About", links: [{ _key: "l", _type: "footerLink", label: "Contact", destination: foot("/contact") }] }],
  legalLinks: [{ _key: "h", _type: "footerLink", label: "Home", destination: foot("/") }],
};

const plan = planMigration(migration, [...pages, navigation, footer]);
const created = (id) => plan.created.find((document) => document._id === id);

test("the menu and footer get drafts; the published versions do not change", () => {
  assert.deepEqual(plan.changed, []);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(plan.created.map((document) => document._id).sort(), ["drafts.footer", "drafts.navigation"]);
  assert.equal(created("drafts.navigation")._rev, undefined);
});

test("a typed path of a page becomes a link to that page", () => {
  const draft = created("drafts.navigation");
  assert.deepEqual(draft.items[0].destination, {
    _type: "navigationDestination",
    kind: "internal",
    internal: ref("wf-page-play"),
    openInNewTab: false,
  });
  assert.deepEqual(draft.items[1].destination.internal, ref("wf-page-summer"), "a trailing slash still matches");
  assert.deepEqual(draft.actions[0].destination.internal, ref("parentDashboard"));
  const links = created("drafts.footer");
  assert.deepEqual(links.columns[0].links[0].destination.internal, ref("wf-page-contact"));
  assert.deepEqual(links.legalLinks[0].destination.internal, ref("homePage"));
  assert.equal(links.legalLinks[0].label, "Home");
});

test("other websites, unpublished pages and unknown paths stay typed", () => {
  const [, gift, draftOnly, gone] = created("drafts.navigation").items[1].links;
  assert.deepEqual(gift.destination, nav("https://example.com/shop?id=1", { openInNewTab: true }));
  assert.deepEqual(draftOnly.destination, nav("/new-page"));
  assert.deepEqual(gone.destination, nav("/old-page"));
  assert.ok(plan.notes.some((line) => line.includes("/new-page, /old-page")));
});

test("an existing draft changes in place and keeps its own edits", () => {
  const draft = { ...navigation, _id: "drafts.navigation", _rev: "n2", actions: [] };
  const run = planMigration(migration, [...pages, navigation, draft, footer]);
  const change = run.changed.find((item) => item.before._id === "drafts.navigation");
  assert.deepEqual(change.after.actions, []);
  assert.deepEqual(change.after.items[0].destination.internal, ref("wf-page-play"));
  assert.equal(run.changed.some((item) => item.before._id === "navigation"), false);
});

test("a second run changes nothing", () => {
  assert.equal(isEmpty(planMigration(migration, [...pages, navigation, footer, ...plan.created])), true);
});

test("only plain paths of this site count", () => {
  assert.equal(sitePath("/summer-camp/"), "/summer-camp");
  assert.equal(sitePath("/"), "/");
  assert.equal(sitePath("//example.com"), null);
  assert.equal(sitePath("/contact#map"), null);
  assert.equal(sitePath("mailto:a@b.c"), null);
});
