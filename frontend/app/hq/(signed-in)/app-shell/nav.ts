// The Camp HQ sidebar: which links each person sees, and which one is active
// for a page. Plain data, so the server builds it and the client renders it.
import { CAMP_HQ_PATH } from "@/lib/hq/config";
import type { MyAssignment } from "@/lib/hq/assignments";
import type { CampHqRole } from "@/lib/hq/operations";

import { CAMPERS_PATH, groupCampersPath } from "../campers/paths";
import {
  CLUB_DAY_MISSING_PATH,
  CLUB_DAY_PATH,
  CLUB_DAY_ROSTERS_PATH,
  MY_CLUB_DAY_ROSTERS_PATH,
  groupClubDayPath,
} from "../club-day/paths";
import { FRONT_DESK_PATH } from "../front-desk/paths";
import { ACTIVITIES_PATH, CAMP_GROUPS_PATH } from "../lists-paths";
import { STAFF_PATH } from "../staff/paths";
import {
  MY_ACTIVITIES_PATH,
  byActivityPath,
  groupsSchedulePath,
  leaderViewPath,
} from "../views-paths";

/** Names a lucide icon; the client maps it, since components cannot cross to it. */
export type NavIcon =
  | "home"
  | "today"
  | "signups"
  | "campers"
  | "activity"
  | "rosters"
  | "schedule"
  | "by-activity"
  | "groups"
  | "activities"
  | "club-day"
  | "find"
  | "staff";

export type NavLink = { label: string; href: string; icon: NavIcon };
export type NavGroup = { title: string | null; links: NavLink[] };

/** Who the sidebar is for. Null while loading or for an account with no staff record. */
export type NavPerson = {
  name: string;
  role: CampHqRole;
  roleLabel: string;
  assignment: MyAssignment;
} | null;

const HOME: NavLink = { label: "Home", href: CAMP_HQ_PATH, icon: "home" };

/** The links every signed-in person sees, also shown while the rest loads. */
export const EVERYONE: NavGroup[] = [
  { title: null, links: [HOME] },
  {
    title: "Schedule",
    links: [
      { label: "Groups Schedule", href: groupsSchedulePath(), icon: "schedule" },
      { label: "Schedule by activity", href: byActivityPath(), icon: "by-activity" },
    ],
  },
  {
    title: "Configure",
    links: [
      { label: "Configure Groups", href: CAMP_GROUPS_PATH, icon: "groups" },
      { label: "Configure Activities", href: ACTIVITIES_PATH, icon: "activities" },
    ],
  },
];

const ADMIN_ONLY: NavGroup[] = [
  {
    title: "Club day",
    links: [
      { label: "Club day setup", href: CLUB_DAY_PATH, icon: "club-day" },
      { label: "Club day signups", href: CLUB_DAY_MISSING_PATH, icon: "signups" },
      { label: "Club day rosters", href: CLUB_DAY_ROSTERS_PATH, icon: "rosters" },
    ],
  },
  {
    title: "People",
    links: [
      { label: "Find a child", href: FRONT_DESK_PATH, icon: "find" },
      { label: "Camper list", href: CAMPERS_PATH, icon: "campers" },
      { label: "Staff and accounts", href: STAFF_PATH, icon: "staff" },
    ],
  },
];

/** The links of the signed-in person's own Assignment. */
function myWork(assignment: MyAssignment): NavLink[] {
  switch (assignment.kind) {
    case "leader": {
      const { id } = assignment.campGroup;
      return [
        { label: "Today's schedule", href: leaderViewPath(id), icon: "today" },
        { label: "Club day signups", href: groupClubDayPath(id), icon: "signups" },
        { label: "Campers expected today", href: groupCampersPath(id), icon: "campers" },
      ];
    }
    case "specialist":
      return [
        { label: "Who comes to me today", href: MY_ACTIVITIES_PATH, icon: "activity" },
        { label: "My Club day rosters", href: MY_CLUB_DAY_ROSTERS_PATH, icon: "rosters" },
      ];
    default:
      return [];
  }
}

export function navFor(person: NavPerson): NavGroup[] {
  if (!person) return [{ title: null, links: [HOME] }];
  const work = myWork(person.assignment);
  return [
    EVERYONE[0],
    ...(work.length > 0 ? [{ title: "My work", links: work }] : []),
    ...EVERYONE.slice(1),
    ...(person.role === "admin" ? ADMIN_ONLY : []),
  ];
}

/** Pages under another section's address that belong to a sidebar link. */
const BELONGS_TO: [RegExp, string][] = [
  [/^\/hq\/groups\/[^/]+\/schedule(\/|$)/, groupsSchedulePath()],
];

/**
 * The href of the link to mark active on this page: the longest link the
 * address starts with. Home is active only on Home itself.
 */
export function activeHref(pathname: string, groups: NavGroup[]): string | null {
  const hrefs = groups.flatMap((group) => group.links.map((link) => link.href));
  for (const [pattern, href] of BELONGS_TO) {
    if (pattern.test(pathname) && hrefs.includes(href)) return href;
  }
  let best: string | null = null;
  for (const href of hrefs) {
    const matches =
      href === CAMP_HQ_PATH
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}
