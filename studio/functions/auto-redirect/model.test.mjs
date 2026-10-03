import assert from "node:assert/strict";
import test from "node:test";

import {
  autoRedirectId,
  planAutoRedirect,
  resolveFetchedRedirectDestination,
  shouldWriteAutoRedirect,
} from "./model.ts";

test("prevents writes during local Sanity Function tests", () => {
  assert.equal(shouldWriteAutoRedirect(true), false);
  assert.equal(shouldWriteAutoRedirect(false), true);
  assert.equal(shouldWriteAutoRedirect(undefined), true);
});

test("never falls back when a destination reference cannot resolve", () => {
  assert.equal(
    resolveFetchedRedirectDestination({
      destination: "/stale-path",
      destinationReference: { _ref: "missing-page", _type: "reference" },
    }),
    undefined,
  );
  assert.equal(
    resolveFetchedRedirectDestination({ destination: "/legacy-path/" }),
    "/legacy-path/",
  );
});

test("creates a canonical permanent redirect for a page rename", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "/old-page/",
        documentId: "page-id",
        documentType: "page",
        slug: "/new-page/",
      },
      liveRoutes: [],
      redirects: [],
    }),
    {
      action: "apply",
      create: true,
      destination: "/new-page",
      destinationDocumentId: "page-id",
      retire: [],
      retarget: [],
      source: "/old-page",
    },
  );
});

test("creates post and category redirects in their public namespaces", () => {
  const post = planAutoRedirect({
    event: {
      beforeSlug: "old-post",
      documentId: "post-id",
      documentType: "post",
      slug: "new-post",
    },
    liveRoutes: [],
    redirects: [],
  });
  const category = planAutoRedirect({
    event: {
      beforeSlug: "old-category",
      documentId: "category-id",
      documentType: "category",
      slug: "new-category",
    },
    liveRoutes: [],
    redirects: [],
  });

  assert.equal(post.action, "apply");
  assert.equal(post.source, "/blog/old-post");
  assert.equal(post.destination, "/blog/new-post");
  assert.equal(category.action, "apply");
  assert.equal(category.source, "/blog/category/old-category");
  assert.equal(category.destination, "/blog/category/new-category");
});

test("flattens incoming redirects after repeated renames", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "b",
        documentId: "page-id",
        documentType: "page",
        slug: "c",
      },
      liveRoutes: [],
      redirects: [
        {
          _id: "redirect-a",
          _rev: "rev-a",
          source: "/a",
          destination: "/b",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }),
    {
      action: "apply",
      create: true,
      destination: "/c",
      destinationDocumentId: "page-id",
      retire: [],
      retarget: [{ _id: "redirect-a", _rev: "rev-a" }],
      source: "/b",
    },
  );
});

test("retires the active redirect when a document reclaims an old slug", () => {
  assert.deepEqual(
    planAutoRedirect({
      event: {
        beforeSlug: "b",
        documentId: "page-id",
        documentType: "page",
        slug: "a",
      },
      liveRoutes: [],
      redirects: [
        {
          _id: "redirect-a",
          _rev: "rev-a",
          source: "/a",
          destination: "/a",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }),
    {
      action: "apply",
      create: true,
      destination: "/a",
      destinationDocumentId: "page-id",
      retire: [{ _id: "redirect-a", _rev: "rev-a" }],
      retarget: [],
      source: "/b",
    },
  );
});

test("repairs out-of-order rename delivery without creating a chain", () => {
  const plan = planAutoRedirect({
    event: {
      beforeSlug: "a",
      documentId: "page-id",
      documentType: "page",
      slug: "b",
    },
    liveRoutes: [],
    redirects: [
      {
        _id: "redirect-b",
        source: "/b",
        destination: "/c",
        destinationReference: { _ref: "page-id" },
        status: "active",
      },
    ],
  });

  assert.equal(plan.action, "apply");
  assert.equal(plan.source, "/a");
  assert.equal(plan.destination, "/c");
});

test("does not flatten redirects that cannot prove the same destination document", () => {
  const event = {
    beforeSlug: "b",
    documentId: "page-id",
    documentType: "page",
    slug: "c",
  };

  for (const redirect of [
    { _id: "path-only", source: "/a", destination: "/b", status: "active" },
    {
      _id: "other-document",
      source: "/a",
      destination: "/b",
      destinationReference: { _ref: "other-page" },
      status: "active",
    },
  ]) {
    assert.match(
      planAutoRedirect({ event, liveRoutes: [], redirects: [redirect] }).reason,
      /cannot be verified/,
    );
  }
});

test("does not follow an out-of-order redirect for another document", () => {
  const plan = planAutoRedirect({
    event: {
      beforeSlug: "a",
      documentId: "page-id",
      documentType: "page",
      slug: "b",
    },
    liveRoutes: [],
    redirects: [
      {
        _id: "redirect-b",
        source: "/b",
        destination: "/c",
        destinationReference: { _ref: "other-page" },
        status: "active",
      },
    ],
  });

  assert.equal(plan.action, "skip");
  assert.match(plan.reason, /targets another document/);
});

test("is idempotent when Sanity redelivers the same publish event", () => {
  const event = {
    beforeSlug: "old",
    documentId: "page-id",
    documentType: "page",
    slug: "new",
  };
  const first = planAutoRedirect({ event, liveRoutes: [], redirects: [] });
  assert.equal(first.action, "apply");

  const id = autoRedirectId(first.source);
  const retry = planAutoRedirect({
    event,
    liveRoutes: [],
    redirects: [
      {
        _id: id,
        source: first.source,
        destination: first.destination,
        status: "active",
      },
    ],
  });

  assert.equal(retry.action, "apply");
  assert.equal(retry.create, false);
  assert.equal(autoRedirectId(first.source), id);
});

test("blocks inactive-source conflicts, live routes, and redirect cycles", () => {
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "old",
        documentId: "page-id",
        documentType: "page",
        slug: "new",
      },
      liveRoutes: [],
      redirects: [
        {
          source: "/old",
          destination: "/elsewhere",
          status: "inactive",
        },
      ],
    }).reason,
    /inactive redirect already uses/,
  );
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "old",
        documentId: "page-id",
        documentType: "page",
        slug: "new",
      },
      liveRoutes: [{ _id: "other-page", path: "/old" }],
      redirects: [],
    }).reason,
    /Route collision/,
  );
  assert.match(
    planAutoRedirect({
      event: {
        beforeSlug: "c",
        documentId: "page-id",
        documentType: "page",
        slug: "b",
      },
      liveRoutes: [],
      redirects: [
        {
          source: "/b",
          destination: "/c",
          destinationReference: { _ref: "page-id" },
          status: "active",
        },
      ],
    }).reason,
    /cycle/,
  );
});

test("rejects reserved, unsafe, unsupported, and first-publish events", () => {
  for (const event of [
    {
      beforeSlug: "blog",
      documentId: "page-id",
      documentType: "page",
      slug: "new",
    },
    {
      beforeSlug: "bad\\path",
      documentId: "page-id",
      documentType: "page",
      slug: "new",
    },
    { beforeSlug: "old", documentType: "author", slug: "new" },
    { documentId: "page-id", documentType: "page", slug: "new" },
  ]) {
    assert.equal(
      planAutoRedirect({ event, liveRoutes: [], redirects: [] }).action,
      "skip",
    );
  }
});
