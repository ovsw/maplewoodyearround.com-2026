// The four places every Camp group has, in the order the tables show them.
// No server code here, so client tables can use it.
export const locationLabels = {
  change: "Change",
  freeSwim: "Free swim",
  lunch: "Lunch",
  swimLessons: "Swim lessons",
} as const;

export const locationKeys = Object.keys(locationLabels) as (keyof typeof locationLabels)[];
