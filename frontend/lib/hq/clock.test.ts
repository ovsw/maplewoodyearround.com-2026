// @vitest-environment node
// The test clock is honoured only on the local database outside Vercel.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { campHqNow } from "./clock";

const FIXED = "2027-07-06T14:00:00.000Z";
let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "camp-hq-clock-"));
  file = path.join(dir, "clock.txt");
  writeFileSync(file, `${FIXED}\n`);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function isRealTime(time: Date) {
  return Math.abs(time.getTime() - Date.now()) < 60_000;
}

describe("campHqNow", () => {
  it("is the real time without a test clock", () => {
    expect(isRealTime(campHqNow({}))).toBe(true);
  });

  it("reads the test clock on the local database", () => {
    expect(campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: file }).toISOString()).toBe(FIXED);
    expect(
      campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: file, CAMP_HQ_DATABASE: "local" }).toISOString(),
    ).toBe(FIXED);
  });

  it("ignores the test clock on Vercel and on Neon", () => {
    expect(isRealTime(campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: file, VERCEL: "1" }))).toBe(true);
    expect(isRealTime(campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: file, CAMP_HQ_DATABASE: "neon" }))).toBe(
      true,
    );
  });

  it("falls back to the real time when the file is missing or unreadable", () => {
    expect(isRealTime(campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: path.join(dir, "none.txt") }))).toBe(true);
    writeFileSync(file, "not a time");
    expect(isRealTime(campHqNow({ CAMP_HQ_TEST_CLOCK_FILE: file }))).toBe(true);
  });
});
