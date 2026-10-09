// Issue #47: Grades in school order, Grades on the three summer Age programs,
// one "Birthday Party Exclusive" program and one "Arts Class" FAQ category.

import { moveReferences, recordId, versionPrefix } from "../lib/migration.mjs";

/** Grade slugs in school order. A Grade's order is its place in this list. */
export const SCHOOL_ORDER = [
  "preschool",
  "kindergarten",
  "1st-grade",
  "2nd-grade",
  "3rd-grade",
  "4th-grade",
  "5th-grade",
  "6th-grade",
  "7th-grade",
  "8th-grade",
  "9th-grade",
];

/** Kindergarten is in two programs on purpose (Ovi, 2026-10-09). */
export const AGE_PROGRAMS = {
  "wf-authored-program-d07c834e5c46fecd": {
    title: "Preschool & Kindergarten",
    grades: ["preschool", "kindergarten"],
  },
  "wf-authored-program-f49413c3b5492eaa": {
    title: "K-7th Grade Program",
    grades: SCHOOL_ORDER.slice(1, 9),
  },
  "wf-authored-program-e4366d3ae4f07b3c": {
    title: "Teen Leadership (C.I.T.)",
    grades: ["8th-grade", "9th-grade"],
  },
};

/** The older "Birthday Party Exclusive" record stays; the other merges into it. */
export const KEPT_BIRTHDAY = "wf-6778db8fb567d06d3525c12f-67bdf5426c0c4f031d51cd38";
export const MERGED_BIRTHDAY = "wf-6778db8fb567d06d3525c12f-67be1096971a469484600c78";

/** The empty duplicate "Arts Class" FAQ category. */
export const EMPTY_ARTS_CLASS = "wf-6797b73cfd315e900db665c5-6797b84f75372443d5c986a2";

function expectTitle(dataset, id, title) {
  const document = dataset.get(id);
  if (document && document.title !== title)
    throw new Error(`${id} is "${document.title}", expected "${title}"`);
  return document;
}

export default {
  description:
    "Issue #47: Grades in school order, Grades on the summer Age programs, one Birthday Party Exclusive program, one Arts Class FAQ category.",

  prepare(dataset) {
    const grades = dataset.documents.filter((document) => document._type === "grade" && !versionPrefix(document._id));
    const gradeIds = new Map(grades.map((grade) => [grade.slug?.current, grade._id]));
    for (const grade of grades)
      if (!SCHOOL_ORDER.includes(grade.slug?.current))
        throw new Error(`Grade ${grade._id} has the unknown slug "${grade.slug?.current}"`);
    if (grades.length !== SCHOOL_ORDER.length || gradeIds.size !== SCHOOL_ORDER.length)
      throw new Error(`Expected one published Grade for each of: ${SCHOOL_ORDER.join(", ")}`);

    for (const [id, { title }] of Object.entries(AGE_PROGRAMS))
      if (!expectTitle(dataset, id, title)) throw new Error(`The Age program ${id} is missing`);
    if (!expectTitle(dataset, KEPT_BIRTHDAY, "Birthday Party Exclusive"))
      throw new Error(`The kept Birthday Party Exclusive program ${KEPT_BIRTHDAY} is missing`);
    expectTitle(dataset, MERGED_BIRTHDAY, "Birthday Party Exclusive");
    expectTitle(dataset, EMPTY_ARTS_CLASS, "Arts Class");

    return (document) => {
      const id = recordId(document._id);
      if (id === MERGED_BIRTHDAY || id === EMPTY_ARTS_CLASS) return null;
      if (document._type === "grade") {
        const order = SCHOOL_ORDER.indexOf(document.slug?.current);
        if (order < 0) throw new Error(`Grade ${document._id} has the unknown slug "${document.slug?.current}"`);
        return { ...document, order };
      }

      const moved = moveReferences(document, MERGED_BIRTHDAY, KEPT_BIRTHDAY);
      const ageProgram = AGE_PROGRAMS[id];
      if (!ageProgram) return moved;
      return {
        ...moved,
        grades: ageProgram.grades.map((slug) => ({ _key: slug, _type: "reference", _ref: gradeIds.get(slug) })),
      };
    };
  },
};
