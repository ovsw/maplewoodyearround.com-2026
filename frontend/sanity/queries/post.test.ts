import { describe, expect, it } from "vitest";
import { publishedPostFilter } from "./blog-post-listing";
import { POST_QUERY, PUBLISHED_POST_QUERY } from "./post";
import { ROOT_SLUG_FILTER } from "../../../shared/root-slug-filter";

describe("post route queries", () => {
  it("requires a publish date on the published route", () => {
    expect(PUBLISHED_POST_QUERY).toContain(publishedPostFilter);
    expect(PUBLISHED_POST_QUERY).toContain(ROOT_SLUG_FILTER);
  });

  it("still allows draft-only posts on the draft route", () => {
    expect(POST_QUERY).toContain('_type == "post"');
    expect(POST_QUERY).toContain(ROOT_SLUG_FILTER);
    expect(POST_QUERY).not.toContain(publishedPostFilter);
  });
});
