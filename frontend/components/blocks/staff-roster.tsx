import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { type DataAttribute, innerCss as css, SourceActions, SourceImage } from "./maplewood-inner";

type TeamMembersBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "teamMembers" }
>;
type Member = NonNullable<TeamMembersBlock["members"]>[number];

/*
 * Staff roster (Webflow team4): framed portraits with Year-Round Staff and
 * Former Camper badges, name, role and years at Maplewood, then the
 * section's closing note and buttons.
 */
export default function StaffRoster({
  _key,
  actions,
  closingText,
  closingTitle,
  dataAttribute,
  memberDataAttribute,
  members,
  richText,
}: Pick<TeamMembersBlock, "_key" | "actions" | "closingText" | "closingTitle" | "richText"> & {
  dataAttribute?: DataAttribute;
  memberDataAttribute?: (documentId: string, path: string) => string | undefined;
  members: Member[];
}) {
  const closingId = `staff-roster-${stegaClean(_key)}-closing`;
  return (
    <section className={[css.section, css.white].join(" ")}>
      <div className={css.container}>
        {richText?.length ? (
          <div className={[css.rosterIntro, css.medium].join(" ")} data-sanity={dataAttribute?.("richText")}>
            <PortableTextRenderer value={richText} />
          </div>
        ) : null}
        <RosterGrid memberDataAttribute={memberDataAttribute} members={members} />
        {stegaClean(closingTitle)?.trim() ? (
          <div aria-labelledby={closingId} className={css.rosterClosing} role="group">
            <h2 className={css.h4} data-sanity={dataAttribute?.("closingTitle")} id={closingId}>
              {closingTitle}
            </h2>
            {stegaClean(closingText)?.trim() ? (
              <p className={css.medium} data-sanity={dataAttribute?.("closingText")}>
                {closingText}
              </p>
            ) : null}
            <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

type RosterMember = {
  document?: {
    _id: string;
    name?: string | null;
    role?: string | null;
    yearsAtOrganization?: number | null;
    yearRound?: boolean | null;
    formerCamper?: boolean | null;
    image?: Parameters<typeof SourceImage>[0]["image"];
  } | null;
};

/** Framed staff portraits with name, role and years at Maplewood. */
export function RosterGrid({
  members,
  memberDataAttribute,
}: {
  members: RosterMember[];
  memberDataAttribute?: (documentId: string, path: string) => string | undefined;
}) {
  return (
    <ul className={css.roster}>
      {members.map(({ document: member }) =>
        member ? (
          <li key={member._id}>
            <div
              className={[css.cardSmall, css.rosterPhoto].join(" ")}
              data-sanity={memberDataAttribute?.(member._id, "image")}
            >
              <SourceImage image={member.image} sizes="(max-width: 767px) 90vw, (max-width: 991px) 45vw, 20rem" width={640} />
              {member.yearRound || member.formerCamper ? (
                <div className={css.rosterTags}>
                  {member.yearRound ? <span className={css.tagPurple}>Year-Round Staff</span> : null}
                  {member.formerCamper ? <span className={css.tagGreen}>Former Camper</span> : null}
                </div>
              ) : null}
            </div>
            <div className={css.rosterText}>
              <p className={css.rosterName} data-sanity={memberDataAttribute?.(member._id, "name")}>
                {member.name}
              </p>
              {member.role ? <p data-sanity={memberDataAttribute?.(member._id, "role")}>{member.role}</p> : null}
              {member.yearsAtOrganization != null ? (
                <p>Years at Maplewood: {member.yearsAtOrganization}</p>
              ) : null}
            </div>
          </li>
        ) : null,
      )}
    </ul>
  );
}

/*
 * Tour invitation (Webflow layout30 with staff): label, heading, text and
 * button beside small portraits of the staff who give tours.
 */
export function TourInvitation({
  _key,
  actions,
  dataAttribute,
  eyebrow,
  memberDataAttribute,
  members,
  richText,
  title,
}: Pick<TeamMembersBlock, "_key" | "actions" | "eyebrow" | "richText" | "title"> & {
  dataAttribute?: DataAttribute;
  memberDataAttribute?: (documentId: string, path: string) => string | undefined;
  members: Member[];
}) {
  const headingId = `tour-${stegaClean(_key)}-title`;
  return (
    <section aria-labelledby={headingId} className={[css.section, css.white].join(" ")}>
      <div className={[css.container, css.tour].join(" ")}>
        <div className={css.tourCopy}>
          {stegaClean(eyebrow)?.trim() ? (
            <p className={css.tagline} data-sanity={dataAttribute?.("eyebrow")}>
              <span className={css.badgeSchool}>{eyebrow}</span>
            </p>
          ) : null}
          <h2 className={css.h4} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          {richText?.length ? (
            <div className={[css.copy, css.medium].join(" ")} data-sanity={dataAttribute?.("richText")}>
              <PortableTextRenderer value={richText} />
            </div>
          ) : null}
          <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
        </div>
        <ul className={css.tourStaff}>
          {members.map(({ document: member }) =>
            member ? (
              <li key={member._id}>
                <div className={[css.cardSmall, css.rosterPhoto].join(" ")} data-sanity={memberDataAttribute?.(member._id, "image")}>
                  <SourceImage image={member.image} sizes="(max-width: 767px) 45vw, 12rem" width={480} />
                </div>
                <p className={css.tourName} data-sanity={memberDataAttribute?.(member._id, "name")}>
                  {member.name}
                </p>
                {member.role ? <p className={css.tourRole}>{member.role}</p> : null}
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
