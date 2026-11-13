import { CAMP_HQ_PATH } from "@/lib/hq/config";

export const CAMP_GROUPS_PATH = `${CAMP_HQ_PATH}/groups`;
export const ACTIVITIES_PATH = `${CAMP_HQ_PATH}/activities`;

/** What a list form shows after a refused save or removal. */
export type ListFormState = {
  error?: string;
  /** Where the record is still used, when removing it was refused. */
  usedIn?: string[];
  /** The values the person entered, so a refused form keeps them. */
  values?: Record<string, string | string[]>;
};
