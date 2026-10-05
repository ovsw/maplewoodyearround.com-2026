import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SourceActions,
  SourceCopy,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type JobListProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "jobList" }
> & {
  dataAttribute?: DataAttribute;
  itemDataAttribute?: (documentId: string, documentType: string, path: string) => string | undefined;
};

const PROGRAM_TAGS = {
  summerCamp: { label: "Summer Camp", className: css.badgeSummer },
  schoolYear: { label: "School Year", className: css.badgeSchool },
} as const;

/*
 * Current openings (Webflow career12): heading and introduction beside the
 * visible Job Opportunities, each with its program tags, description and
 * Apply link. A job without an Apply link shows no button.
 */
export default function JobList({
  _key,
  background,
  dataAttribute,
  intro,
  itemDataAttribute,
  items,
  title,
}: JobListProps) {
  if (!title || !items?.length) return null;
  const headingId = `job-list-${stegaClean(_key)}-title`;

  return (
    <section aria-labelledby={headingId} className={[css.section, sectionBackground(background, "cream")].join(" ")}>
      <div className={[css.container, about.jobs].join(" ")}>
        <div>
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          <SourceCopy
            className={[css.medium, about.jobsIntro, about.markedLinks].join(" ")}
            dataSanity={dataAttribute?.("intro")}
            value={intro}
          />
        </div>
        <ul className={about.jobList}>
          {items.map((job) => {
            const edit = (path: string) => itemDataAttribute?.(job._id, "jobOpportunity", path);
            const tags = (job.programs ?? []).flatMap((program) => {
              const tag = PROGRAM_TAGS[stegaClean(program) as keyof typeof PROGRAM_TAGS];
              return tag ? [tag] : [];
            });
            return (
              <li className={about.job} key={job._id}>
                <div className={about.jobHeading}>
                  <h3 className={about.jobTitle} data-sanity={edit("title")}>
                    {job.title}
                  </h3>
                  {tags.map((tag) => (
                    <span className={[tag.className, about.jobTag].join(" ")} data-sanity={edit("programs")} key={tag.label}>
                      {tag.label}
                    </span>
                  ))}
                </div>
                <SourceCopy dataSanity={edit("description")} value={job.description} />
                <div className={about.jobApply} data-sanity={edit("applyLink")}>
                  <SourceActions
                    actions={[{ _key: job._id, label: "Apply Now", destination: job.applyLink }]}
                    allOutline
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
