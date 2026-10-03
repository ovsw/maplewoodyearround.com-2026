import { describe, expect, it } from "vitest";
import { filterFaqHub, type FaqHubItem } from "./faq-hub-filter";

const travel = { _id: "cat-travel", title: "Getting there", slug: "getting-there", order: 50 };
const health = { _id: "cat-health", title: "Health", slug: "health", order: 40 };
const staff = { _id: "cat-staff", title: "Working at camp", slug: "working-at-camp", order: 100 };

function item(
  id: string,
  category: FaqHubItem["category"],
  question: string,
  answerText: string,
): FaqHubItem {
  return { _id: id, category, question, answerText };
}

// Already in page order: category order, then FAQ order, then question.
const faqs: FaqHubItem[] = [
  item("h-1", health, "What if my child gets homesick?", "Counsellors call home after two days."),
  item("h-2", health, "Do you keep medication?", "The nurse keeps every medication in the health centre."),
  item("t-1", travel, "Does the bus have seat belts?", "Yes. Every coach has three-point seat belts."),
  item("t-2", travel, "Can my child fly alone?", "Air Canada takes unaccompanied minors from age eight."),
  item("t-3", travel, "Do I need a visa?", "Most families need an eTA before they fly to Canada."),
  item("s-1", staff, "Can staff use their phone?", "Staff phones stay in the office during program time."),
];

function groupIds(result: ReturnType<typeof filterFaqHub>) {
  return result.groups.map((group) => [group.category._id, group.faqs.map((faq) => faq._id)]);
}

describe("filterFaqHub", () => {
  it("returns every group in category order when nothing filters", () => {
    const result = filterFaqHub(faqs, null, "");

    expect(groupIds(result)).toEqual([
      ["cat-health", ["h-1", "h-2"]],
      ["cat-travel", ["t-1", "t-2", "t-3"]],
      ["cat-staff", ["s-1"]],
    ]);
    expect(result.categories.map((category) => category._id)).toEqual([
      "cat-health",
      "cat-travel",
      "cat-staff",
    ]);
    expect(result.total).toBe(6);
    expect(result.counts).toEqual({ "cat-health": 2, "cat-travel": 3, "cat-staff": 1 });
  });

  it("returns one group for a chosen category", () => {
    const result = filterFaqHub(faqs, "cat-travel", "");

    expect(groupIds(result)).toEqual([["cat-travel", ["t-1", "t-2", "t-3"]]]);
    expect(result.total).toBe(3);
  });

  it("matches a word that appears only in the answer", () => {
    const result = filterFaqHub(faqs, null, "eTA");

    expect(groupIds(result)).toEqual([["cat-travel", ["t-3"]]]);
  });

  it("requires every typed word to match", () => {
    expect(groupIds(filterFaqHub(faqs, null, "seat belts"))).toEqual([["cat-travel", ["t-1"]]]);
    expect(groupIds(filterFaqHub(faqs, null, "seat visa"))).toEqual([]);
  });

  it("ignores case and diacritics", () => {
    expect(groupIds(filterFaqHub(faqs, null, "HOMESICK"))).toEqual([["cat-health", ["h-1"]]]);
    expect(groupIds(filterFaqHub(faqs, null, "médicatión"))).toEqual([["cat-health", ["h-2"]]]);

    const accented = [item("a-1", health, "Où est l'infirmerie?", "À côté du réfectoire.")];
    expect(groupIds(filterFaqHub(accented, null, "ou infirmerie"))).toEqual([["cat-health", ["a-1"]]]);
  });

  it("combines category and search", () => {
    expect(groupIds(filterFaqHub(faqs, "cat-staff", "phone"))).toEqual([["cat-staff", ["s-1"]]]);
    expect(groupIds(filterFaqHub(faqs, "cat-travel", "phone"))).toEqual([]);
  });

  it("returns zero total and no groups when nothing matches", () => {
    const result = filterFaqHub(faqs, null, "zebra");

    expect(result.groups).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.counts).toEqual({ "cat-health": 0, "cat-travel": 0, "cat-staff": 0 });
    expect(result.categories).toHaveLength(3);
  });

  it("keeps counts following the search, not the chosen category", () => {
    const result = filterFaqHub(faqs, "cat-health", "child");

    expect(groupIds(result)).toEqual([["cat-health", ["h-1"]]]);
    expect(result.counts).toEqual({ "cat-health": 1, "cat-travel": 1, "cat-staff": 0 });
  });
});
