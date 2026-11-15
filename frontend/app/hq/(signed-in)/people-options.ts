// The choices of a "who" cell: the people who can lead a Camp group or run an
// activity. No server code here, so client tables can use it.
import type { EditableOption } from "./editable-table/types";

/** A person who can be picked, with what they do now. */
export type PersonChoice = { id: string; name: string; job: string | null };

/** The value of "nobody" in a "who" cell. */
export const NOBODY = "";

/**
 * "Nobody", then every person with an active account. `blocked` says why a
 * person cannot be picked here; they stay in the list, greyed out. The person
 * the cell holds now is always listed, even without an active account.
 */
export function peopleOptions({
  people,
  nobody,
  current,
  blocked,
}: {
  people: PersonChoice[];
  nobody: string;
  current: { id: string; name: string } | null;
  blocked: (person: PersonChoice) => string | undefined;
}): EditableOption[] {
  const options: EditableOption[] = [{ value: NOBODY, label: nobody, muted: true }];
  for (const person of people) {
    const isCurrent = person.id === current?.id;
    options.push({
      value: person.id,
      label: person.name,
      unavailable: isCurrent ? undefined : blocked(person),
      note: isCurrent ? undefined : (person.job ?? undefined),
    });
  }
  if (current && !people.some((person) => person.id === current.id)) {
    options.push({ value: current.id, label: `${current.name} (no active account)` });
  }
  return options;
}
