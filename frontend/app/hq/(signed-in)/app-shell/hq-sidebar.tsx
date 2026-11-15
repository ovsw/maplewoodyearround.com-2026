"use client";

// Camp HQ's sidebar, adapted from shadcnblocks application-shell1: the logo,
// the links grouped by section with the current page marked, and the signed-in
// person's menu with Sign out at the bottom.
import { SignOutButton } from "@clerk/nextjs";
import {
  CalendarDays,
  CalendarRange,
  ChevronsUpDown,
  ClipboardCheck,
  ClipboardList,
  House,
  ListChecks,
  LogOut,
  Search,
  Shapes,
  Sun,
  Tent,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { CAMP_HQ_PATH, CAMP_HQ_SIGN_IN_PATH } from "@/lib/hq/config";

import { activeHref, type NavGroup, type NavIcon, type NavPerson } from "./nav";
import { useNavGroups } from "./nav-context";

const icons: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  home: House,
  today: Sun,
  signups: ClipboardCheck,
  campers: UsersRound,
  activity: Shapes,
  rosters: ClipboardList,
  schedule: CalendarDays,
  "by-activity": CalendarRange,
  groups: Users,
  activities: ListChecks,
  "club-day": Tent,
  find: Search,
  staff: UserRound,
};

const spring = { type: "spring", bounce: 0.18, duration: 0.45 } as const;

// Press feedback, and the active pill drawn by ActivePill instead of the static background.
const buttonMotion =
  "relative isolate overflow-visible transition-[width,height,padding,background-color,color,transform] duration-200 ease-out group-data-[collapsible=icon]:overflow-hidden active:scale-[0.98] data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:hover:bg-sidebar-accent/60 motion-reduce:transition-none motion-reduce:active:scale-100";

function ActivePill() {
  return (
    <motion.span
      layoutId="hq-sidebar-active-pill"
      transition={spring}
      className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent shadow-xs ring-1 ring-sidebar-border/60"
    />
  );
}

function Logo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href={CAMP_HQ_PATH}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
              <Tent className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Camp HQ</span>
              <span className="text-xs text-muted-foreground">Maplewood</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function PersonMenu({ person }: { person: NonNullable<NavPerson> | null }) {
  const name = person?.name ?? "Signed in";
  const initials = person ? initialsOf(person.name) : "";
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Account: ${name}`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                {person ? (
                  <span className="truncate text-xs text-muted-foreground">{person.roleLabel}</span>
                ) : null}
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-medium">{name}</span>
              {person ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {person.roleLabel}
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <SignOutButton redirectUrl={CAMP_HQ_SIGN_IN_PATH}>
              <DropdownMenuItem>
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The links, with the current page marked once the address is known. */
function NavMenu({ groups, active }: { groups: NavGroup[]; active: string | null }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return groups.map((group, index) => (
    <SidebarGroup key={group.title ?? `group-${index}`}>
      {group.title ? <SidebarGroupLabel>{group.title}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.links.map((link) => {
            const Icon = icons[link.icon];
            const isActive = link.href === active;
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={link.label}
                  className={buttonMotion}
                >
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    {isActive ? <ActivePill /> : null}
                    <Icon className="size-4" />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

function ActiveNavMenu({ groups }: { groups: NavGroup[] }) {
  return <NavMenu groups={groups} active={activeHref(usePathname(), groups)} />;
}

export function HqSidebar({ groups, person }: { groups: NavGroup[]; person: NavPerson }) {
  const { setGroups } = useNavGroups();
  // The header names the current page from the same links.
  useEffect(() => setGroups(groups), [groups, setGroups]);

  return (
    <MotionConfig reducedMotion="user">
      <Sidebar collapsible="icon" aria-label="Camp HQ">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          {/* The address is read at request time, so the frame renders first. */}
          <Suspense fallback={<NavMenu groups={groups} active={null} />}>
            <ActiveNavMenu groups={groups} />
          </Suspense>
        </SidebarContent>
        <SidebarFooter>
          <PersonMenu person={person} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </MotionConfig>
  );
}
