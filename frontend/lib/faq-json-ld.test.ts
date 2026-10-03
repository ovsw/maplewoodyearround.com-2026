import { describe, expect, it } from "vitest";
import {
  createFaqPageJsonLd,
  serializeFaqPageJsonLd,
  type FaqJsonLdBlock,
} from "./faq-json-ld";

type FaqBlock = Extract<FaqJsonLdBlock, { _type: "faqAccordion" }>;
type Faq = NonNullable<FaqBlock["faqs"]>[number];
type FaqHubBlock = Extract<FaqJsonLdBlock, { _type: "faqHub" }>;
type HubFaq = NonNullable<FaqHubBlock["faqs"]>[number];

function faq(id: string, title: string | null, answer: string | null): Faq {
  return {
    _id: id,
    _key: `key-${id}`,
    _type: "faq",
    title,
    answer:
      answer === null
        ? null
        : [
            {
              _key: `answer-${id}`,
              _type: "block",
              children: [
                {
                  _key: `span-${id}`,
                  _type: "span",
                  marks: [],
                  text: answer,
                },
              ],
              markDefs: [],
              style: "normal",
            },
          ],
  };
}

function faqBlock(faqs: Faq[]): FaqBlock {
  return { _type: "faqAccordion", faqs };
}

function hubFaq(id: string, title: string, answer: string): HubFaq {
  const { _id, title: question, answer: body } = faq(id, title, answer);
  return {
    _id,
    title: question,
    answer: body,
    answerText: answer,
    order: null,
    category: { _id: "cat-1", title: "Getting there", slug: "getting-there", order: 10 },
  };
}

function hubBlock(faqs: HubFaq[]): FaqHubBlock {
  return { _type: "faqHub", faqs };
}

describe("createFaqPageJsonLd", () => {
  it("builds an FAQPage from usable Q&As", () => {
    expect(
      createFaqPageJsonLd([
        faqBlock([
          faq("faq-1", "  What is onboarding?  ", "  A setup review.  "),
        ]),
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
            name: "What is onboarding?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A setup review.",
            },
        },
      ],
    });
  });

  it("merges FAQs from multiple blocks into one entity", () => {
    const result = createFaqPageJsonLd([
      faqBlock([faq("faq-1", "First?", "First answer.")]),
      faqBlock([faq("faq-2", "Second?", "Second answer.")]),
    ]);

    expect(result?.mainEntity.map(({ name }) => name)).toEqual([
      "First?",
      "Second?",
    ]);
  });

  it("strips stega characters from titles and answers", () => {
    const stega = "\u200b\u200c\u200d\ufeff";
    const result = createFaqPageJsonLd([
      faqBlock([
        faq("faq-1", `Question?${stega}`, `Answer.${stega}`),
      ]),
    ]);

    expect(result?.mainEntity[0]).toMatchObject({
      name: "Question?",
      acceptedAnswer: { text: "Answer." },
    });
  });

  it("dedupes repeated FAQ documents by id", () => {
    const duplicate = faq("faq-1", "Repeated?", "Only once.");
    const result = createFaqPageJsonLd([
      faqBlock([duplicate]),
      faqBlock([duplicate]),
    ]);

    expect(result?.mainEntity).toHaveLength(1);
  });

  it("lists every question the FAQ hub renders", () => {
    const result = createFaqPageJsonLd([
      { _type: "richTextBlock" },
      hubBlock([
        hubFaq("faq-1", "Seat belts?", "Yes, on every coach."),
        hubFaq("faq-2", "Fly alone?", "From age eight."),
      ]),
    ]);

    expect(result?.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Seat belts?",
        acceptedAnswer: { "@type": "Answer", text: "Yes, on every coach." },
      },
      {
        "@type": "Question",
        name: "Fly alone?",
        acceptedAnswer: { "@type": "Answer", text: "From age eight." },
      },
    ]);
  });

  it("lists a question once when a curated section and the hub both show it", () => {
    const result = createFaqPageJsonLd([
      faqBlock([faq("faq-1", "Seat belts?", "Yes, on every coach.")]),
      hubBlock([
        hubFaq("faq-1", "Seat belts?", "Yes, on every coach."),
        hubFaq("faq-2", "Fly alone?", "From age eight."),
      ]),
    ]);

    expect(result?.mainEntity.map(({ name }) => name)).toEqual([
      "Seat belts?",
      "Fly alone?",
    ]);
  });

  it("excludes title-only FAQs", () => {
    const result = createFaqPageJsonLd([
      faqBlock([
        faq("title-only", "Visible title", null),
        faq("usable", "Usable title", "Usable answer"),
      ]),
    ]);

    expect(result?.mainEntity.map(({ name }) => name)).toEqual([
      "Usable title",
    ]);
  });

  it("returns null when there are no usable Q&As", () => {
    expect(
      createFaqPageJsonLd([
        { _type: "richTextBlock" },
        faqBlock([
          faq("missing-title", "  ", "Answer"),
          faq("missing-answer", "Question", "  "),
        ]),
      ]),
    ).toBeNull();
  });

  it("neutralizes script-closing payloads when serialized", () => {
    const value = createFaqPageJsonLd([
      faqBlock([
        faq("unsafe", "Unsafe?", "</script><script>alert(1)</script>"),
      ]),
    ]);

    expect(value).not.toBeNull();
    if (!value) return;

    const serialized = serializeFaqPageJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
