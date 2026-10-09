import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { seasonPeriod } from "./season-period.ts";

// Use the GROQ evaluator shipped with the Studio's Sanity installation.
const { parse, evaluate } = createRequire(
  createRequire(import.meta.url).resolve("sanity/package.json"),
)("groq-js");

const season = (_id, program, startDate, endDate) => ({
  _id,
  _type: "season",
  title: _id,
  program,
  startDate,
  endDate,
});

const summer2027 = season("summer-2027", "summerCamp", "2027-06-21", "2027-08-13");
const schoolYear2027 = season("school-year-2027", "schoolYear", "2027-09-07", "2028-06-18");

async function validate(document, dataset = [summer2027, schoolYear2027]) {
  return seasonPeriod(document.endDate, {
    document,
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query, params) =>
          (await evaluate(parse(query), { dataset, params })).get(),
      }),
    }),
  });
}

test("blocks an end date before the start date", async () => {
  assert.equal(
    await validate(season("drafts.summer-2028", "summerCamp", "2028-08-01", "2028-06-01")),
    "The end date cannot be before the start date.",
  );
});

test("allows a one-day Season", async () => {
  assert.equal(
    await validate(season("drafts.open-day", "schoolYear", "2027-08-30", "2027-08-30")),
    true,
  );
});

test("leaves missing dates to the required rule", async () => {
  assert.equal(await validate(season("drafts.new", "summerCamp", undefined, undefined)), true);
  assert.equal(await validate(season("drafts.new", "summerCamp", "2027-07-01", undefined)), true);
});

test("blocks two Seasons of the same side that share a day", async () => {
  const result = await validate(
    season("drafts.summer-2027-copy", "summerCamp", "2027-08-13", "2027-08-20"),
  );
  assert.equal(
    result,
    "This Season overlaps summer-2027 (2027-06-21 to 2027-08-13). Two Seasons of the same side cannot share a day.",
  );
});

test("blocks a Season that contains another Season of the same side", async () => {
  assert.match(
    await validate(season("drafts.long", "summerCamp", "2027-01-01", "2027-12-31")),
    /overlaps summer-2027/,
  );
});

test("allows Seasons of the same side with a gap between them", async () => {
  assert.equal(
    await validate(season("drafts.summer-2028", "summerCamp", "2028-06-19", "2028-08-11")),
    true,
  );
  // The next day after the other Season ends: no shared day.
  assert.equal(
    await validate(season("drafts.late-summer", "summerCamp", "2027-08-14", "2027-08-31")),
    true,
  );
});

test("allows Seasons of different sides that overlap", async () => {
  assert.equal(
    await validate(season("drafts.school-year-2026", "schoolYear", "2026-09-08", "2027-06-25")),
    true,
  );
});

test("does not compare a Season with its own published, draft or release copies", async () => {
  const dataset = [summer2027, { ...summer2027, _id: "versions.rAbC123.summer-2027" }];
  for (const _id of ["summer-2027", "drafts.summer-2027", "versions.rXyZ789.summer-2027"]) {
    assert.equal(
      await validate({ ...summer2027, _id, endDate: "2027-08-20" }, dataset),
      true,
    );
  }
});

test("catches an overlap with another Season that exists only as a draft", async () => {
  const draftOnly = season("drafts.summer-2029", "summerCamp", "2029-06-18", "2029-08-10");
  assert.match(
    await validate(season("drafts.other", "summerCamp", "2029-08-01", "2029-08-31"), [draftOnly]),
    /overlaps drafts\.summer-2029/,
  );
});
