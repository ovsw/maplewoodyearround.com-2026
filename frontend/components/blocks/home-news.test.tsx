import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import HomeNews from "./home-news";

type Props = ComponentProps<typeof HomeNews>;
const posts = Array.from({ length: 6 }, (_, index) => ({
  _id: `post-${index}`,
  title: `News ${index}`,
  slug: { _type: "slug" as const, current: `news-${index}` },
  publishedAt: null,
  excerpt: "News summary",
  image: null,
  author: null,
  category: {
    _id: "school",
    title: "School-Year",
    slug: null,
    color: "#54e3ff",
  },
}));
const props: Props = {
  _type: "latestArticles",
  _key: "news",
  background: null,
  title: "News",
  eyebrow: null,
  description: null,
  selectedArticles: posts,
  articles: [],
  limit: 4,
  featuredFirst: true,
  buttons: null,
  fallbackImage: null,
};

describe("Home news", () => {
  it.each([1, 3, 6])(
    "shows %i posts total, including the featured post",
    (limit) => {
      render(<HomeNews {...props} limit={limit} />);
      expect(screen.getAllByRole("article")).toHaveLength(limit);
      expect(screen.getAllByRole("link")[0]).toHaveAttribute(
        "href",
        "/post/news-0",
      );
    },
  );
  it("uses the same limit for the newest-post fallback and the stored category color", () => {
    render(
      <HomeNews {...props} selectedArticles={[]} articles={posts} limit={2} />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByText("School-Year")[0]).toHaveStyle({
      backgroundColor: "#54e3ff",
    });
  });
});
