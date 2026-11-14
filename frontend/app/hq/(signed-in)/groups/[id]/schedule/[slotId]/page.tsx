import type { Metadata } from "next";
import { Suspense } from "react";

import { isCampHqRefusal } from "@/lib/hq/operations";
import { formatSlotRange, slotTimeValue, weekdayLabels } from "@/lib/hq/schedule-times";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../../camp-hq-page";
import { CAMP_GROUPS_PATH } from "../../../../lists-paths";
import { SlotContentForm, SlotTimesForm, type SlotChoiceOption } from "../schedule-forms";
import { scheduleDayPath } from "../schedule-paths";

export const metadata: Metadata = { title: "Change a slot" };

export default function ScheduleSlotPage({ params }: PageProps<"/hq/groups/[id]/schedule/[slotId]">) {
  return (
    <Suspense fallback={null}>
      <ScheduleSlot params={params} />
    </Suspense>
  );
}

async function ScheduleSlot({ params }: { params: Promise<{ id: string; slotId: string }> }) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const { id, slotId } = await params;

  const found = await campHq.getSlotChoices(request, slotId).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found")) return null;
    throw error;
  });

  if (!found || found.group.id !== id) {
    return (
      <section className="flex flex-col gap-6">
        <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
        <p className="text-muted-foreground">This slot no longer exists.</p>
      </section>
    );
  }

  const { slot, group, choices } = found;
  const back = (
    <BackLink href={scheduleDayPath(group.id, slot.weekday)}>
      {weekdayLabels[slot.weekday]} schedule of {group.name}
    </BackLink>
  );
  if (!isAdmin) {
    return (
      <section className="flex flex-col gap-6">
        {back}
        <p className="text-muted-foreground">Only an Admin can change schedules.</p>
      </section>
    );
  }

  const current =
    slot.content.type === "activity"
      ? `activity:${slot.content.activity.id}`
      : slot.content.type;
  const options: SlotChoiceOption[] = [
    { value: "empty", label: "Empty" },
    { value: "club-day", label: "Club day period" },
    ...choices.map(({ activity, bookedBy }) => ({
      value: `activity:${activity.id}`,
      label: activity.name,
      bookedBy: bookedBy
        ? {
            groupId: bookedBy.campGroupId,
            groupName: bookedBy.campGroupName,
            times: formatSlotRange(bookedBy.start, bookedBy.end),
          }
        : undefined,
    })),
  ];
  // Keep the slot's current activity visible even if the group's grades changed since.
  if (slot.content.type === "activity" && !options.some((option) => option.value === current)) {
    options.push({ value: current, label: `${slot.content.activity.name} (not allowed for these grades)` });
  }

  return (
    <section className="flex flex-col gap-6">
      {back}
      <h1 className="text-title-lg">
        {group.name}, {weekdayLabels[slot.weekday]} {formatSlotRange(slot.start, slot.end)}
      </h1>

      <h2 className="text-title">Times</h2>
      <SlotTimesForm
        groupId={group.id}
        weekday={slot.weekday}
        slotId={slot.id}
        start={slotTimeValue(slot.start)}
        end={slotTimeValue(slot.end)}
      />

      <hr className="max-w-3xl border-border" />
      <h2 className="text-title">Activity</h2>
      <p className="max-w-3xl text-muted-foreground">
        Only activities allowed for the grades of {group.name} are listed. An Exclusive
        activity another group has at this time is unavailable.
      </p>
      <SlotContentForm
        groupId={group.id}
        weekday={slot.weekday}
        slotId={slot.id}
        current={current}
        options={options}
      />
    </section>
  );
}
