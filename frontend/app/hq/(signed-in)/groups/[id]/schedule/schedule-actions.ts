"use server";

// Server actions for the Group schedule builder. They only call the Camp HQ
// operations module, which decides who may change what and refuses clashes.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import {
  isCampHqRefusal,
  type CampHqOperations,
  type CampHqRequest,
} from "@/lib/hq/operations";
import type { SlotContentInput } from "@/lib/hq/schedules";
import { requireCampHqActor } from "@/lib/hq/session";

import { SCHEDULE_PAGES, scheduleDayPath, type ScheduleFormState } from "./schedule-paths";

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Runs one operation; a refusal comes back as a message for the form. */
async function run(
  weekday: number,
  operation: (campHq: CampHqOperations, request: CampHqRequest) => Promise<unknown>,
): Promise<ScheduleFormState | null> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    await operation(campHq, { actor, now: new Date() });
    return null;
  } catch (error) {
    if (isCampHqRefusal(error)) {
      return {
        error: error.message,
        other: error.other ? { id: error.other.id, name: error.other.name, weekday } : undefined,
      };
    }
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was saved." };
    }
    throw error;
  }
}

function refresh() {
  revalidatePath(SCHEDULE_PAGES, "layout");
}

export async function addScheduleSlot(
  _previous: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const groupId = text(formData, "groupId");
  const weekday = Number(text(formData, "weekday"));
  const values = { start: text(formData, "start"), end: text(formData, "end") };
  const refused = await run(weekday, (campHq, request) =>
    campHq.addScheduleSlot(request, groupId, weekday, values),
  );
  if (refused) return { ...refused, values };
  refresh();
  return { savedAt: Date.now() };
}

export async function changeScheduleSlotTimes(
  _previous: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const groupId = text(formData, "groupId");
  const slotId = text(formData, "slotId");
  const weekday = Number(text(formData, "weekday"));
  const values = { start: text(formData, "start"), end: text(formData, "end") };
  const refused = await run(weekday, (campHq, request) =>
    campHq.changeScheduleSlotTimes(request, slotId, values),
  );
  if (refused) return { ...refused, values };
  refresh();
  redirect(scheduleDayPath(groupId, weekday));
}

/** The choice field holds "empty", "club-day" or "activity:<id>". */
function contentFromChoice(choice: string): SlotContentInput | null {
  if (choice === "empty") return { type: "empty" };
  if (choice === "club-day") return { type: "club-day" };
  if (choice.startsWith("activity:")) {
    return { type: "activity", activityId: choice.slice("activity:".length) };
  }
  return null;
}

export async function setScheduleSlotContent(
  _previous: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const groupId = text(formData, "groupId");
  const slotId = text(formData, "slotId");
  const weekday = Number(text(formData, "weekday"));
  const choice = text(formData, "choice");
  const content = contentFromChoice(choice);
  if (!content) return { error: "Choose an activity, a Club day period or an empty slot." };
  const refused = await run(weekday, (campHq, request) =>
    campHq.setScheduleSlotContent(request, slotId, content),
  );
  if (refused) return { ...refused, values: { choice } };
  refresh();
  redirect(scheduleDayPath(groupId, weekday));
}

export async function removeScheduleSlot(
  _previous: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const slotId = text(formData, "slotId");
  const weekday = Number(text(formData, "weekday"));
  const refused = await run(weekday, (campHq, request) =>
    campHq.removeScheduleSlot(request, slotId),
  );
  if (refused) return refused;
  refresh();
  return { savedAt: Date.now() };
}
