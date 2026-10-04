import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import CognitoForm from "./cognito-form";
import {
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceActions,
  SourceCopy,
} from "./maplewood-inner";

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
 * frame and the Cognito tour form (content30). Pasted markup never runs;
 * the Cognito loader is fixed code and the form is chosen by its public IDs.
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
  // The Events Calendar is a loader script, not a frame; its page owns it.
  const src = kind === "Events Calendar" ? null : httpsUrl(embedUrl);
  const cognito = kind === "Cognito" && stegaClean(accountId) && stegaClean(providerId);
  if (!cognito && !src) return null;
  const headingId = title ? `embed-${stegaClean(_key)}-title` : undefined;
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
              <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
                {title}
              </h2>
            ) : null}
            {stegaClean(description)?.trim() ? (
              <p className={[css.medium, css.embedDescription].join(" ")} data-sanity={dataAttribute?.("description")}>
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        <SourceCopy className={css.embedBody} dataSanity={dataAttribute?.("body")} value={body} />
        {cognito ? (
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
