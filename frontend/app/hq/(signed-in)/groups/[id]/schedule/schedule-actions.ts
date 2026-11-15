"use server";

// Server actions for the Group schedule table. Each saves one cell or one row
// and returns what the cell shows. They only call the Camp HQ operations
// module, which decides who may change what and refuses clashes.
import type {
  SlotContentInput,
  SlotTimesChange,
  SlotTimesInput,
} from "@/lib/hq/schedules";
import type { CampHqOperations, CampHqRequest } from "@/lib/hq/operations";

import { runCell } from "../../../cell-run";
import type { CellResult } from "../../../editable-table/types";
import { scheduleDayPath } from "./schedule-paths";

/** Runs one operation; a clash links to the other group's schedule of that day. */
function run(
  weekday: number,
  operation: (campHq: CampHqOperations, request: CampHqRequest) => Promise<unknown>,
): Promise<CellResult> {
  // Only a Camp group has a schedule to open; a specialist is named in the message.
  return runCell(operation, (refusal) =>
    refusal.other?.kind === "camp-group"
      ? {
          href: scheduleDayPath(refusal.other.id, weekday),
          label: `Open the schedule of ${refusal.other.name}`,
        }
      : undefined,
  );
}

/** The choice of a slot: "empty", "club-day" or "activity:<id>". */
function contentFromChoice(choice: string): SlotContentInput | null {
  if (choice === "empty") return { type: "empty" };
  if (choice === "club-day") return { type: "club-day" };
  if (choice.startsWith("activity:")) {
    return { type: "activity", activityId: choice.slice("activity:".length) };
  }
  return null;
}

const NO_CHOICE = "Choose an activity, a Club day period or an empty slot.";

export async function addScheduleSlot(
  groupId: string,
  weekday: number,
  times: SlotTimesInput,
): Promise<CellResult> {
  return run(weekday, (campHq, request) =>
    campHq.addScheduleSlot(request, groupId, weekday, times),
  );
}

/** Changes one time of a slot, or both. The time left out keeps its stored value. */
export async function changeScheduleSlotTimes(
  slotId: string,
  weekday: number,
  times: SlotTimesChange,
): Promise<CellResult> {
  return run(weekday, (campHq, request) =>
    campHq.changeScheduleSlotTimes(request, slotId, times),
  );
}

export async function setScheduleSlotContent(
  slotId: string,
  weekday: number,
  choice: string,
): Promise<CellResult> {
  const content = contentFromChoice(choice);
  if (!content) return { ok: false, error: NO_CHOICE };
  return run(weekday, (campHq, request) =>
    campHq.setScheduleSlotContent(request, slotId, content),
  );
}

export async function removeScheduleSlot(slotId: string, weekday: number): Promise<CellResult> {
  return run(weekday, (campHq, request) => campHq.removeScheduleSlot(request, slotId));
}

/**
 * A slot at these times holding this choice: the undo of a removal, and a
 * period picked on the Groups Schedule for a group that had no slot then.
 */
export async function restoreScheduleSlot(
  groupId: string,
  weekday: number,
  times: SlotTimesInput,
  choice: string,
): Promise<CellResult> {
  const content = contentFromChoice(choice);
  if (!content) return { ok: false, error: NO_CHOICE };
  let slotId = "";
  const added = await run(weekday, async (campHq, request) => {
    slotId = (await campHq.addScheduleSlot(request, groupId, weekday, times)).id;
  });
  if (!added.ok || content.type === "empty") return added;
  const filled = await run(weekday, (campHq, request) =>
    campHq.setScheduleSlotContent(request, slotId, content),
  );
  if (filled.ok) return filled;
  return { ...filled, error: `The slot is there, but empty. ${filled.error}` };
}
