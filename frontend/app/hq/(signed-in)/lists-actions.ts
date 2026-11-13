"use server";

// Server actions for Camp HQ's lists. They only call the Camp HQ operations
// module, which decides who may change what.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import {
  isCampHqRefusal,
  type CampHqOperations,
  type CampHqRequest,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { ACTIVITIES_PATH, CAMP_GROUPS_PATH, type ListFormState } from "./lists-paths";

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const texts = (formData: FormData, name: string) =>
  formData.getAll(name).filter((value): value is string => typeof value === "string");

/** Runs one operation; a refusal comes back as a message for the form. */
async function run(
  operation: (campHq: CampHqOperations, request: CampHqRequest) => Promise<unknown>,
): Promise<ListFormState | null> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    await operation(campHq, { actor, now: new Date() });
    return null;
  } catch (error) {
    if (isCampHqRefusal(error)) return { error: error.message, usedIn: error.usedIn };
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was saved." };
    }
    throw error;
  }
}

export async function saveCampGroup(
  _previous: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  const id = text(formData, "id");
  const values = {
    name: text(formData, "name"),
    grades: texts(formData, "grades"),
    team: text(formData, "team"),
    change: text(formData, "change"),
    freeSwim: text(formData, "freeSwim"),
    lunch: text(formData, "lunch"),
    swimLessons: text(formData, "swimLessons"),
  };
  const input = {
    name: values.name,
    grades: values.grades,
    team: Number(values.team),
    locations: {
      change: values.change,
      freeSwim: values.freeSwim,
      lunch: values.lunch,
      swimLessons: values.swimLessons,
    },
  };
  const refused = await run((campHq, request) =>
    id ? campHq.updateCampGroup(request, id, input) : campHq.addCampGroup(request, input),
  );
  if (refused) return { ...refused, values };
  revalidatePath(CAMP_GROUPS_PATH);
  redirect(CAMP_GROUPS_PATH);
}

export async function removeCampGroup(
  _previous: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  const id = text(formData, "id");
  const refused = await run((campHq, request) => campHq.removeCampGroup(request, id));
  if (refused) return refused;
  revalidatePath(CAMP_GROUPS_PATH);
  redirect(CAMP_GROUPS_PATH);
}

export async function saveActivity(
  _previous: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  const id = text(formData, "id");
  const values = {
    name: text(formData, "name"),
    grades: texts(formData, "grades"),
    kind: text(formData, "kind"),
  };
  const input = { name: values.name, grades: values.grades, kind: values.kind || undefined };
  const refused = await run((campHq, request) =>
    id ? campHq.updateActivity(request, id, input) : campHq.addActivity(request, input),
  );
  if (refused) return { ...refused, values };
  revalidatePath(ACTIVITIES_PATH);
  redirect(ACTIVITIES_PATH);
}

export async function removeActivity(
  _previous: ListFormState,
  formData: FormData,
): Promise<ListFormState> {
  const id = text(formData, "id");
  const refused = await run((campHq, request) => campHq.removeActivity(request, id));
  if (refused) return refused;
  revalidatePath(ACTIVITIES_PATH);
  redirect(ACTIVITIES_PATH);
}
