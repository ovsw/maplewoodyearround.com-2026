import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { onePlayCenterDayPerDate } from "./play-center-day-date.ts";

// Use the GROQ evaluator shipped with the Studio's Sanity installation.
const { parse, evaluate } = createRequire(
  createRequire(import.meta.url).resolve("sanity/package.json"),
)("groq-js");

const day = (_id, date, title = _id) => ({ _id, _type: "playgroundEvent", title, date });
const october3 = day("october-3", "2026-10-03T00:00:00.000Z", "Video Game Man");

async function validate(document, dataset = [october3]) {
  return onePlayCenterDayPerDate(document.date, {
    document,
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query, params) =>
          (await evaluate(parse(query), { dataset, params })).get(),
      }),
    }),
  });
}

test("blocks a second Play Center day on a calendar day already used, even at another time", async () => {
  assert.equal(
    await validate(day("drafts.new", "2026-10-03T15:30:00.000Z")),
    "Video Game Man is already the Play Center day for 2026-10-03. Each calendar day has one Play Center day.",
  );
});

test("allows the next calendar day", async () => {
  assert.equal(await validate(day("drafts.new", "2026-10-04T00:00:00.000Z")), true);
});

test("leaves a missing date to the required rule", async () => {
  assert.equal(await validate(day("drafts.new", undefined)), true);
});

test("does not compare a day with its own published, draft or release copies", async () => {
  const dataset = [october3, { ...october3, _id: "versions.rAbC123.october-3" }];
  for (const _id of ["october-3", "drafts.october-3", "versions.rXyZ789.october-3"])
    assert.equal(await validate({ ...october3, _id, date: "2026-10-03T09:00:00.000Z" }, dataset), true);
});

test("catches a day that exists only as a draft", async () => {
  assert.match(
    await validate(day("drafts.new", "2026-10-05T00:00:00.000Z"), [
      day("drafts.october-5", "2026-10-05T00:00:00.000Z", "Red Heeler"),
    ]),
    /^Red Heeler is already the Play Center day for 2026-10-05/,
  );
});
