import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import CtaBanner from "./cta-banner";
import BenefitCards from "./benefit-cards";
import FaqAccordion from "./faq-accordion";
import FeatureCards, {
  getFeatureCardColumnCount,
  getFeatureCardImageUrl,
} from "./feature-cards";
import Hero from "./hero";
import { getHotspotPosition } from "./image-collage-feature";
import RichTextBlock from "./rich-text-block";
import StoryFeature from "./story-feature";
import TeamMembers from "./team-members";

const paragraph = (key: string, text: string) => ({
  _key: key,
  _type: "block",
  children: [
    { _key: `${key}-span`, _type: "span", marks: [], text },
  ],
  markDefs: [],
  style: "normal",
});

const featureCardImage = (alt: string) => ({
  _type: "image" as const,
  alt,
  asset: {
    _id: "image-33e53adba6e57186d5b20d1f531bdb8f6c6f1472-1600x900-jpg",
    mimeType: "image/jpeg",
    metadata: null,
    url: "https://cdn.sanity.io/images/h6k9z4h5/production/33e53adba6e57186d5b20d1f531bdb8f6c6f1472-1600x900.jpg",
  },
});

describe("core Page Builder sections", () => {
  it("chooses feature-card columns from each row's card count", () => {
    expect(getFeatureCardColumnCount(2)).toBe(2);
    expect(getFeatureCardColumnCount(3)).toBe(3);
    expect(getFeatureCardColumnCount(4)).toBe(4);
    expect(getFeatureCardColumnCount(4, false)).toBe(2);
    expect(getFeatureCardColumnCount(5)).toBe(3);
    expect(getFeatureCardColumnCount(6)).toBe(3);
  });

  it("continues feature-card numbering across rows", () => {
    const card = (key: string, title: string) => ({
      _key: key,
      _type: "featureCardItem" as const,
      image: featureCardImage(title),
      link: {
        href: `/${key}`,
        openInNewTab: false,
        text: `Explore ${title}`,
      },
      text: `${title} details`,
      title,
    });
    const featureCards = {
      _key: "programs",
      _type: "featureCards",
      description: "Choose the program that fits.",
      eyebrow: "02 · Programs",
      groups: [
        {
          _key: "specialty",
          _type: "featureCardGroup",
          cards: [
            card("gymnastics", "Gymnastics"),
            card("trampoline", "Trampoline"),
          ],
          description: null,
          heading: "Specialty Programs",
        },
        {
          _key: "general",
          _type: "featureCardGroup",
          cards: [
            card("general-program", "General Program"),
            card("leadership", "Youth Leadership"),
          ],
          description: null,
          heading: "General & Leadership",
        },
      ],
      title: [paragraph("program-title", "Choose their adventure.")],
    } as unknown as ComponentProps<typeof FeatureCards>;

    render(<FeatureCards {...featureCards} />);

    for (const number of ["01", "02", "03", "04"]) {
      expect(screen.getByText(number)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: "General & Leadership" }),
    ).toBeInTheDocument();
  });

  it("lays out and numbers only complete feature cards", () => {
    const completeCard = (key: string, title: string) => ({
      _key: key,
      _type: "featureCardItem" as const,
      image: featureCardImage(title),
      link: {
        href: `/${key}`,
        openInNewTab: false,
        text: `Explore ${title}`,
      },
      text: `${title} details`,
      title,
    });
    const incompleteLinkCard = {
      ...completeCard("unfinished", "Unfinished"),
      link: null,
    };
    const missingImageCard = {
      ...completeCard("missing-image", "Missing image"),
      image: null,
    };
    const missingAltCard = {
      ...completeCard("missing-alt", "Missing alt"),
      image: featureCardImage("   "),
    };
    const featureCards = {
      _key: "draft-programs",
      _type: "featureCards",
      description: null,
      eyebrow: null,
      groups: [
        {
          _key: "draft-group",
          _type: "featureCardGroup",
          cards: [
            completeCard("first", "First"),
            incompleteLinkCard,
            missingImageCard,
            missingAltCard,
            completeCard("second", "Second"),
          ],
          description: null,
          heading: "Draft group",
          singleRowUpToFour: true,
        },
        {
          _key: "next-group",
          _type: "featureCardGroup",
          cards: [
            completeCard("third", "Third"),
            completeCard("fourth", "Fourth"),
          ],
          description: null,
          heading: "Next group",
          singleRowUpToFour: true,
        },
      ],
      title: [paragraph("draft-programs-title", "Draft programs")],
      dataAttribute: (path: string) => `feature-cards:${path}`,
    } as unknown as ComponentProps<typeof FeatureCards>;

    render(<FeatureCards {...featureCards} />);

    expect(screen.queryByText("Unfinished")).not.toBeInTheDocument();
    expect(screen.queryByText("Missing image")).not.toBeInTheDocument();
    expect(screen.queryByText("Missing alt")).not.toBeInTheDocument();
    expect(screen.queryByText("05")).not.toBeInTheDocument();
    for (const number of ["01", "02", "03", "04"]) {
      expect(screen.getByText(number)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Second" })).toHaveAttribute(
      "data-sanity",
      'feature-cards:groups[_key=="draft-group"].cards[_key=="second"].title',
    );
  });

  it("skips groups reduced to fewer than two complete cards", () => {
    const card = (key: string, title: string) => ({
      _key: key,
      _type: "featureCardItem" as const,
      image: featureCardImage(title),
      link: {
        href: `/${key}`,
        openInNewTab: false,
        text: `Explore ${title}`,
      },
      text: `${title} details`,
      title,
    });
    const featureCards = {
      _key: "minimum-cards",
      _type: "featureCards",
      description: null,
      eyebrow: null,
      groups: [
        {
          _key: "too-small",
          _type: "featureCardGroup",
          cards: [
            card("only", "Only"),
            { ...card("draft", "Draft"), image: null },
          ],
          description: null,
          heading: "Too small",
          singleRowUpToFour: true,
        },
        {
          _key: "complete",
          _type: "featureCardGroup",
          cards: [
            card("first-valid", "First valid"),
            card("second-valid", "Second valid"),
          ],
          description: null,
          heading: "Complete group",
          singleRowUpToFour: true,
        },
      ],
      title: [paragraph("minimum-cards-title", "Minimum cards")],
    } as unknown as ComponentProps<typeof FeatureCards>;

    render(<FeatureCards {...featureCards} />);

    expect(
      screen.queryByRole("heading", { name: "Too small" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Complete group" }),
    ).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
  });

  it("renders nothing when no group has two complete cards", () => {
    const featureCards = {
      _key: "empty-feature-cards",
      _type: "featureCards",
      description: "This chrome should not render.",
      eyebrow: "Programs",
      groups: [
        {
          _key: "incomplete-group",
          _type: "featureCardGroup",
          cards: [
            {
              _key: "only-card",
              _type: "featureCardItem",
              image: featureCardImage("Only card"),
              link: {
                href: "/only-card",
                openInNewTab: false,
                text: "Explore Only card",
              },
              text: "Only card details",
              title: "Only card",
            },
          ],
          description: null,
          heading: "Incomplete group",
          singleRowUpToFour: true,
        },
      ],
      title: [paragraph("empty-feature-cards-title", "Empty feature cards")],
    } as unknown as ComponentProps<typeof FeatureCards>;

    const { container } = render(<FeatureCards {...featureCards} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("requests a 16:9 crop for feature-card images", () => {
    const imageUrl = new URL(
      getFeatureCardImageUrl({
        _type: "image",
        asset: {
          _ref: "image-33e53adba6e57186d5b20d1f531bdb8f6c6f1472-1600x900-jpg",
          _type: "reference",
        },
      }),
    );

    expect(imageUrl.searchParams.get("w")).toBe("1600");
    expect(imageUrl.searchParams.get("h")).toBe("900");
    expect(imageUrl.searchParams.get("fit")).toBe("crop");
  });

  it("positions collage images around their hotspot after applying the editor crop", () => {
    expect(
      getHotspotPosition({
        _type: "image",
        alt: "",
        asset: null,
        crop: {
          _type: "sanity.imageCrop",
          bottom: 0.1,
          left: 0.2,
          right: 0.1,
          top: 0.1,
        },
        hotspot: {
          _type: "sanity.imageHotspot",
          height: 0.2,
          width: 0.2,
          x: 0.55,
          y: 0.5,
        },
      }),
    ).toBe("50% 50%");
  });

  it("renders the page header with its accent phrase and safe action", () => {
    const hero = {
      _key: "hero",
      _type: "hero",
      body: [paragraph("hero-body", "A useful supporting message.")],
      buttons: [
        {
          _key: "work",
          _type: "button",
          href: "/work",
          openInNewTab: false,
          text: "See our work",
          variant: "default",
        },
      ],
      eyebrow: "Example location",
      image: null,
      title: [
        {
          _key: "hero-title",
          _type: "block",
          children: [
            {
              _key: "hero-title-text",
              _type: "span",
              marks: [],
              text: "Life on ",
            },
            {
              _key: "hero-title-accent",
              _type: "span",
              marks: ["em"],
              text: "the island.",
            },
          ],
          markDefs: [],
          style: "normal",
        },
      ],
    } as unknown as ComponentProps<typeof Hero>;
    render(
      <Hero {...hero} />,
    );

    expect(
      screen.getByRole("heading", { name: "Life on the island." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See our work" })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("renders inline links in the page header copy", () => {
    const hero = {
      _key: "hero",
      _type: "hero",
      body: [
        {
          ...paragraph("hero-body", "Learn more"),
          children: [
            {
              _key: "hero-body-span",
              _type: "span",
              marks: ["learn-link"],
              text: "Learn more",
            },
          ],
          markDefs: [
            {
              _key: "learn-link",
              _type: "customLink",
              href: "/learn",
              openInNewTab: false,
            },
          ],
        },
      ],
      buttons: [],
      eyebrow: null,
      image: null,
      title: [paragraph("hero-title", "Camp")],
    } as unknown as ComponentProps<typeof Hero>;

    render(<Hero {...hero} />);

    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute(
      "href",
      "/learn",
    );
  });

  it("renders rich text and a closing call to action", () => {
    const richText = {
      _key: "story",
      _type: "richTextBlock",
      eyebrow: "What we do",
      richText: [paragraph("story-body", "Details visitors can use.")],
      title: "Built to make the next decision easier.",
    } as unknown as ComponentProps<typeof RichTextBlock>;
    const { rerender } = render(
      <RichTextBlock {...richText} />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Built to make the next decision easier.",
      }),
    ).toBeInTheDocument();

    const cta = {
      _key: "cta",
      _type: "ctaBanner",
      buttons: [
        {
          _key: "contact",
          _type: "button",
          href: "/contact",
          openInNewTab: false,
          text: "Start a conversation",
          variant: "default",
        },
      ],
      description: "Tell us what you are working through.",
      title: "Have a complicated idea?",
    } as unknown as ComponentProps<typeof CtaBanner>;
    rerender(<CtaBanner {...cta} />);
    expect(
      screen.getByRole("link", { name: "Start a conversation" }),
    ).toHaveAttribute("href", "/contact");
  });

  it("gives an incomplete legacy CTA button a safe accessible name", () => {
    const cta = {
      _key: "cta",
      _type: "ctaBanner",
      buttons: [{ _key: "contact", href: "/contact", text: null }],
      description: null,
      title: "Ready for camp?",
    } as unknown as ComponentProps<typeof CtaBanner>;

    render(<CtaBanner {...cta} />);

    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("renders reusable marketing sections with semantic content", () => {
    const featureGrid = {
      _key: "features",
      _type: "benefitCards",
      cards: [
        {
          _key: "feature-one",
          _type: "featureGridItem",
          body: [paragraph("feature-body", "Short, useful context.")],
          icon: null,
          title: "Reusable content blocks",
        },
      ],
      intro: "Common sections for marketing pages.",
      title: [paragraph("features-title", "Feature grid")],
    } as unknown as ComponentProps<typeof BenefitCards>;
    const { rerender } = render(<BenefitCards {...featureGrid} />);

    expect(
      screen.getByRole("heading", { name: "Feature grid" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reusable content blocks" }),
    ).toBeInTheDocument();

    const imageAndText = {
      _key: "image-text",
      _type: "storyFeature",
      buttons: [],
      image: null,
      features: [
        {
          _key: "point",
          accent: "blue",
          body: [paragraph("point-copy", "Point text.")],
          icon: null,
          title: "Reusable",
        },
      ],
      richText: [paragraph("story-copy", "Story context visitors can use.")],
      title: [paragraph("story-title", "Image and text")],
    } as unknown as ComponentProps<typeof StoryFeature>;
    rerender(<StoryFeature {...imageAndText} />);

    expect(
      screen.getByRole("heading", { name: "Image and text" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reusable")).toBeInTheDocument();

    const faqSection = {
      _key: "faq",
      _type: "faqAccordion",
      faqs: [
        {
          _id: "faq-one",
          _key: "faq-one",
          _type: "faq",
          answer: [paragraph("faq-answer", "Use Sanity to manage it.")],
          title: "How is this content reused?",
        },
      ],
      title: [paragraph("faq-title", "Questions")],
    } as unknown as ComponentProps<typeof FaqAccordion>;
    rerender(<FaqAccordion {...faqSection} />);

    expect(
      screen.getByRole("button", { name: /How is this content reused/i }),
    ).toBeInTheDocument();

    const team = {
      _key: "team",
      _type: "teamMembers",
      members: [
        {
          _key: "person-one",
          _ref: "person-one",
          _type: "reference",
          document: {
            _id: "person-one",
            _type: "teamMember",
            bio: [paragraph("person-bio", "Leads client strategy.")],
            email: "hello@example.com",
            image: null,
            name: "Avery Stone",
            phone: null,
            role: "Founder",
            sortOrder: 1,
          },
        },
      ],
      title: "Team",
    } as unknown as ComponentProps<typeof TeamMembers>;
    rerender(<TeamMembers {...team} />);

    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avery Stone" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email Avery" })).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
  });
});
