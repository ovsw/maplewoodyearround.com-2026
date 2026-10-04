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
        <ul className={css.roster}>
          {members.map(({ document: member }) =>
            member ? (
              <li data-sanity={memberDataAttribute?.(member._id, "name")} key={member._id}>
                <div className={[css.cardSmall, css.rosterPhoto].join(" ")}>
                  <SourceImage image={member.image} sizes="(max-width: 767px) 90vw, (max-width: 991px) 45vw, 20rem" width={640} />
                  {member.yearRound || member.formerCamper ? (
                    <div className={css.rosterTags}>
                      {member.yearRound ? <span className={css.tagPurple}>Year-Round Staff</span> : null}
                      {member.formerCamper ? <span className={css.tagGreen}>Former Camper</span> : null}
                    </div>
                  ) : null}
                </div>
                <div className={css.rosterText}>
                  <p className={css.rosterName}>{member.name}</p>
                  {member.role ? <p>{member.role}</p> : null}
                  {member.yearsAtOrganization != null ? (
                    <p>Years at Maplewood: {member.yearsAtOrganization}</p>
                  ) : null}
                </div>
              </li>
            ) : null,
          )}
        </ul>
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
