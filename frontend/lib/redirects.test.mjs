import assert from "node:assert/strict";
import test from "node:test";

import { compileNextRedirects } from "./redirects.mjs";

test("compiles permanent and temporary redirects without ending slashes", () => {
  assert.deepEqual(
    compileNextRedirects([
      {
        source: { current: "/old/" },
        destination: { current: "/new/" },
        permanent: "true",
        status: "active",
      },
      {
        source: { current: "/temp" },
        destination: { current: "/later" },
        permanent: "false",
        status: "active",
      },
    ]),
    [
      { source: "/old", destination: "/new", statusCode: 301 },
      { source: "/temp", destination: "/later", statusCode: 302 },
    ],
  );
});

test("allows shared destinations, ignores inactive records, and deduplicates retries", () => {
  assert.deepEqual(
    compileNextRedirects([
      { source: "/one", destination: "/target", permanent: true },
      { source: "/two", destination: "/target", permanent: true },
      { source: "/off", destination: "/target", permanent: true, status: "inactive" },
      { source: "/one/", destination: "/target/", permanent: "true" },
    ]),
    [
      { source: "/one", destination: "/target", statusCode: 301 },
      { source: "/two", destination: "/target", statusCode: 301 },
    ],
  );
});

test("rejects conflicting sources, self redirects, chains, and cycles", () => {
  assert.throws(
    () =>
      compileNextRedirects([
        { source: "/old", destination: "/one", permanent: true },
        { source: "/old/", destination: "/two", permanent: true },
      ]),
    /Conflicting redirects share the source \/old/,
  );
  assert.throws(
    () => compileNextRedirects([{ source: "/same", destination: "/same/" }]),
    /source and destination are the same/,
  );
  assert.throws(
    () =>
      compileNextRedirects([
        { source: "/a", destination: "/b" },
        { source: "/b", destination: "/c" },
      ]),
    /chain or cycle/,
  );
  assert.throws(
    () =>
      compileNextRedirects([
        { source: "/a", destination: "/b" },
        { source: "/b", destination: "/a" },
      ]),
    /chain or cycle/,
  );
});

test("rejects unsafe paths and application-owned sources", () => {
  for (const source of [
    "https://example.com/old",
    "/bad\\source",
    "/old?preview=true",
    "/api/draft-mode/enable",
    "/blog/2",
    "/contact/thanks",
  ]) {
    assert.throws(
      () => compileNextRedirects([{ source, destination: "/target" }]),
      /missing a valid internal|reserved by the application/,
      source,
    );
  }
  assert.throws(
    () => compileNextRedirects([{ source: "/source", destination: "/bad#target" }]),
    /missing a valid internal/,
  );
});
