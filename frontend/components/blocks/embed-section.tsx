import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import CognitoForm from "./cognito-form";
import EventsCalendar from "./events-calendar";
import {
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceActions,
  SourceCopy,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type EmbedSectionProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "embedSection" }
> & { dataAttribute?: DataAttribute };

const httpsUrl = (value?: string | null) => {
  try {
    const url = new URL(stegaClean(value) ?? "");
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

/*
 * Provider embeds: the bus stop map (Webflow gallery1), the Airtable form
 * frame, the Cognito tour form (content30) and the Events Calendar. Pasted
 * markup never runs; the Cognito and Events Calendar loaders are fixed code,
 * and the form or calendar is chosen by its public IDs.
 */
export default function EmbedSection({
  _key,
  accountId,
  actions,
  background,
  body,
  dataAttribute,
  description,
  embedUrl,
  frameTitle,
  provider,
  providerId,
  sentFrom,
  tagline,
  title,
}: EmbedSectionProps) {
  const kind = stegaClean(provider);
  // The Events Calendar and Cognito use fixed loaders chosen by public IDs.
  const calendar = kind === "Events Calendar" ? stegaClean(providerId)?.trim() : undefined;
  const src = kind === "Events Calendar" ? null : httpsUrl(embedUrl);
  const cognito = kind === "Cognito" && stegaClean(accountId) && stegaClean(providerId);
  if (!cognito && !src && !calendar) return null;
  const headingId = title ? `embed-${stegaClean(_key)}-title` : undefined;
  // The calendar page has no hero: its section heading is the page heading.
  const Heading = calendar ? "h1" : "h2";
  const name = stegaClean(frameTitle) || stegaClean(title) || "Embedded content";

  if (kind === "Airtable" && !title && !body?.length) {
    return (
      <div className={css.airtable} data-sanity={dataAttribute?.("embedUrl")}>
        <iframe className={css.airtableFrame} loading="lazy" src={src ?? undefined} title={name} />
      </div>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={css.container}>
        {title || description ? (
          <div className={[css.narrow, css.centerText, css.embedHeading].join(" ")}>
            <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
            {title ? (
              <Heading className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
                {title}
              </Heading>
            ) : null}
            {stegaClean(description)?.trim() ? (
              <p className={[css.medium, css.embedDescription].join(" ")} data-sanity={dataAttribute?.("description")}>
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        <SourceCopy className={css.embedBody} dataSanity={dataAttribute?.("body")} value={body} />
        {calendar ? (
          <div className={about.calendar} data-sanity={dataAttribute?.("providerId")}>
            <EventsCalendar projectId={calendar} />
          </div>
        ) : cognito ? (
          <div className={css.cognito} data-sanity={dataAttribute?.("providerId")}>
            <CognitoForm
              accountId={stegaClean(accountId) as string}
              formId={stegaClean(providerId) as string}
              sentFrom={stegaClean(sentFrom)}
            />
          </div>
        ) : (
          <div className={[css.card, css.embedFrame].join(" ")} data-sanity={dataAttribute?.("embedUrl")}>
            <iframe loading="lazy" src={src ?? undefined} title={name} />
          </div>
        )}
        <SourceActions actions={actions} center dataAttribute={dataAttribute} />
      </div>
    </section>
  );
}
