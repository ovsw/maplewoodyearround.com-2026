import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type InstructionStepsProps = Extract<
  PageBlock,
  { _type: "instructionSteps" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function InstructionSteps({
  _key,
  dataAttribute,
  description,
  title,
}: InstructionStepsProps) {
  if (!title) return null;

  const headingId = `instruction-steps-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="section-pad"
      id={`instruction-steps-${stegaClean(_key)}`}
    >
      <div className="container-content">
        <h2
          className="typo-section-heading"
          data-sanity={dataAttribute?.("title")}
          id={headingId}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="mt-5 typo-body-editorial"
            data-sanity={dataAttribute?.("description")}
          >
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
