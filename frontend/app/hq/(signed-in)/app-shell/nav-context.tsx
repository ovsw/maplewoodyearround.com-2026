"use client";

// Shares the signed-in person's sidebar links with the header, which shows
// where you are. The sidebar loads them; until then everyone's links stand in.
import { createContext, useContext, useState } from "react";

import { EVERYONE, type NavGroup } from "./nav";

type NavGroups = { groups: NavGroup[]; setGroups: (groups: NavGroup[]) => void };

const NavGroupsContext = createContext<NavGroups>({ groups: EVERYONE, setGroups: () => {} });

export function NavGroupsProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<NavGroup[]>(EVERYONE);
  return <NavGroupsContext value={{ groups, setGroups }}>{children}</NavGroupsContext>;
}

export function useNavGroups() {
  return useContext(NavGroupsContext);
}
