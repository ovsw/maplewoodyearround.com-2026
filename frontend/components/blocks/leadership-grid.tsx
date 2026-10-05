import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SourceCopy,
  SourceImage,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type TeamMembersBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "teamMembers" }
>;
type Member = NonNullable<NonNullable<TeamMembersBlock["members"]>[number]["document"]>;

/*
 * Leadership profiles (Webflow team14): framed square portrait, name, role,
 * email and biography for each leadership staff record, three to a row.
 */
export default function LeadershipGrid({
  _key,
  background,
  dataAttribute,
  memberDataAttribute,
  members,
  richText,
}: Pick<TeamMembersBlock, "_key" | "background" | "richText"> & {
  dataAttribute?: DataAttribute;
  memberDataAttribute?: (documentId: string, path: string) => string | undefined;
  members: Member[];
}) {
  return (
    <section
      aria-label="Leadership team"
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
      id={`leadership-${stegaClean(_key)}`}
    >
      <div className={css.container}>
        <SourceCopy className={css.medium} dataSanity={dataAttribute?.("richText")} value={richText} />
        <ul className={about.leaders} data-sanity={dataAttribute?.("members")}>
          {members.map((member) => {
            const edit = (path: string) => memberDataAttribute?.(member._id, path);
            const email = stegaClean(member.email)?.trim();
            return (
              <li data-sanity={edit("name")} key={member._id}>
                {member.image?.asset?._id ? (
                  <div className={[css.cardSmall, about.leaderPhoto].join(" ")} data-sanity={edit("image")}>
                    <SourceImage image={member.image} sizes="(max-width: 767px) 90vw, (max-width: 991px) 45vw, 384px" width={800} />
                  </div>
                ) : null}
                <h2 className={about.leaderName} data-sanity={edit("name")}>
                  {member.name}
                </h2>
                {stegaClean(member.role)?.trim() ? (
                  <p className={about.leaderRole} data-sanity={edit("role")}>
                    {member.role}
                  </p>
                ) : null}
                {email ? (
                  <a className={about.leaderEmail} data-sanity={edit("email")} href={`mailto:${email}`}>
                    {member.email}
                  </a>
                ) : null}
                <SourceCopy
                  className={[about.leaderBio, about.markedLinks].join(" ")}
                  dataSanity={edit("bio")}
                  value={member.bio}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
