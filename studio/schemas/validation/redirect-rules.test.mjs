import assert from "node:assert/strict";
import test from "node:test";

import { getRedirectValidationIssues } from "./redirect-rules.ts";

function issues(current, redirects = [], liveRoutes = []) {
  return getRedirectValidationIssues({ current, redirects, liveRoutes });
}

test("allows many redirects to share a published destination", () => {
  assert.deepEqual(
    issues(
      { source: "/new-source", destination: "/target", status: "active" },
      [{ source: "/another", destination: "/target/", status: "active" }],
      [{ path: "/target", type: "page" }],
    ),
    { errors: {} },
  );
});

test("rejects duplicate active or inactive sources", () => {
  for (const status of ["active", "inactive"]) {
    assert.match(
      issues(
        { source: "/same/", destination: "/target", status: "active" },
        [{ source: "/same", destination: "/other", status }],
        [{ path: "/target", type: "page" }],
      ).errors.source,
      /already uses this source/,
    );
  }
});

test("rejects redirect chains in either direction", () => {
  assert.match(
    issues(
      { source: "/b", destination: "/c", status: "active" },
      [{ source: "/a", destination: "/b", status: "active" }],
      [{ path: "/c", type: "post" }],
    ).errors.source,
    /active redirect from \/a points here/,
  );
  assert.match(
    issues(
      { source: "/a", destination: "/b", status: "active" },
      [{ source: "/b", destination: "/c", status: "active" }],
    ).errors.destination,
    /create a chain/,
  );
});

test("rejects self redirects and sources that shadow published routes", () => {
  assert.match(
    issues({ source: "/same", destination: "/same/" }).errors.destination,
    /cannot be the same/,
  );
  assert.match(
    issues(
      { source: "/about", destination: "/target" },
      [],
      [{ path: "/about", type: "page" }],
    ).errors.source,
    /already used by a page/,
  );
});

test("reserves application routes but allows old post and category paths", () => {
  for (const source of [
    "/",
    "/blog",
    "/blog/2",
    "/blog/category",
    "/blog/category/news/2",
    "/api/draft-mode/enable",
    "/contact/thanks",
  ]) {
    assert.match(
      issues({ source, destination: "/target" }).errors.source,
      /reserved/,
      source,
    );
  }

  assert.equal(
    issues(
      { source: "/blog/old-post", destination: "/target" },
      [],
      [{ path: "/target", type: "page" }],
    ).errors.source,
    undefined,
  );
});

test("recognizes category routes as valid destinations", () => {
  assert.deepEqual(
    issues(
      {
        source: "/legacy-category",
        destination: "/blog/category/news",
        status: "active",
      },
      [],
      [{ path: "/blog/category/news", type: "category" }],
    ),
    { errors: {} },
  );
});

test("rejects missing destinations and unsafe paths", () => {
  assert.match(
    issues({ source: "/old", destination: "/missing" }).errors.destination,
    /non-existent or non-published/,
  );

  for (const source of ["old", "/bad\\source", "/old?preview=true"]) {
    assert.match(
      issues({ source, destination: "/target" }).errors.source,
      /internal path/,
    );
  }
  for (const destination of [
    "https://example.com",
    "/bad\\target",
    "/target#section",
  ]) {
    assert.match(
      issues({ source: "/source", destination }).errors.destination,
      /internal path/,
    );
  }
});
