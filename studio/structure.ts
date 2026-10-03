import {
  Files,
  BookMarked,
  FileText,
  User,
  ListCollapse,
  Filter,
  FolderTree,
  Quote,
  Menu,
  Settings,
  Settings2,
  PanelBottom,
  Tag,
  House,
  TrendingUpDown,
  PanelRight,
} from "lucide-react";
import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Home Page")
        .icon(House)
        .child(
          S.editor()
            .id("homePage")
            .schemaType("homePage")
            .documentId("homePage")
        ),
      S.divider(),
      S.listItem()
        .title("Pages")
        .icon(Files)
        .schemaType("page")
        .child(
          S.documentTypeList("page")
            .title("Pages")
            .defaultOrdering([{ field: "title", direction: "asc" }])
        ),
      S.listItem()
        .title("Blog")
        .icon(BookMarked)
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Blog Index")
                .icon(BookMarked)
                .child(
                  S.editor()
                    .id("blogIndex")
                    .schemaType("blogIndex")
                    .documentId("blogIndex")
                ),
              S.listItem()
                .title("Blog Post Settings")
                .icon(PanelRight)
                .child(
                  S.editor()
                    .id("blogPostSettings")
                    .schemaType("blogPostSettings")
                    .documentId("blogPostSettings")
                ),
              S.divider(),
              S.listItem()
                .title("Blog Posts")
                .icon(FileText)
                .schemaType("post")
                .child(
                  S.documentTypeList("post")
                    .title("Blog Posts")
                    .defaultOrdering([
                      { field: "_createdAt", direction: "desc" },
                    ])
                ),
              S.listItem()
                .title("Categories")
                .icon(Tag)
                .schemaType("category")
                .child(
                  S.documentTypeList("category")
                    .title("Categories")
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .title("Authors")
                .icon(User)
                .schemaType("author")
                .child(
                  S.documentTypeList("author")
                    .title("Authors")
                    .defaultOrdering([{ field: "name", direction: "asc" }])
                ),
            ])
        ),
      S.listItem()
        .title("FAQs")
        .icon(ListCollapse)
        .child(
          S.list()
            .title("FAQs")
            .items([
              S.listItem()
                .title("All FAQs")
                .icon(ListCollapse)
                .schemaType("faq")
                .child(
                  S.documentTypeList("faq")
                    .title("All FAQs")
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .title("FAQs by category")
                .icon(Filter)
                .child(
                  S.documentTypeList("faqCategory")
                    .title("FAQs by category")
                    .defaultOrdering([{ field: "order", direction: "asc" }])
                    .child((categoryId) =>
                      S.documentList()
                        .title("FAQs")
                        .schemaType("faq")
                        .filter('_type == "faq" && category._ref == $categoryId')
                        .params({ categoryId })
                        .defaultOrdering([
                          { field: "order", direction: "asc" },
                          { field: "title", direction: "asc" },
                        ])
                    )
                ),
              S.divider(),
              S.listItem()
                .title("FAQ categories")
                .icon(FolderTree)
                .schemaType("faqCategory")
                .child(
                  S.documentTypeList("faqCategory")
                    .title("FAQ categories")
                    .defaultOrdering([{ field: "order", direction: "asc" }])
                ),
            ])
        ),
      S.listItem()
        .title("Testimonials")
        .icon(Quote)
        .schemaType("testimonial")
        .child(
          S.documentTypeList("testimonial")
            .title("Testimonials")
            .defaultOrdering([{ field: "name", direction: "asc" }])
        ),
      S.listItem()
        .title("Redirects")
        .icon(TrendingUpDown)
        .schemaType("redirect")
        .child(
          S.documentTypeList("redirect")
            .title("Redirects")
            .defaultOrdering([{ field: "source.current", direction: "asc" }])
        ),
      S.divider(),
      S.listItem()
        .title("Site Configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site Configuration")
            .items([
              S.listItem()
                .title("Navigation")
                .icon(Menu)
                .child(
                  S.editor()
                    .id("navigation")
                    .schemaType("navigation")
                    .documentId("navigation")
                ),
              S.listItem()
                .title("Footer")
                .icon(PanelBottom)
                .child(
                  S.editor()
                    .id("footer")
                    .schemaType("footer")
                    .documentId("footer")
                ),
              S.listItem()
                .title("Global Settings")
                .icon(Settings)
                .child(
                  S.editor()
                    .id("settings")
                    .schemaType("settings")
                    .documentId("settings")
                ),
            ])
        ),
    ]);
