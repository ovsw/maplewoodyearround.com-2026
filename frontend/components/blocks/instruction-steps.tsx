import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import InstructionStepsNumber from "./instruction-steps-number";
import { type DataAttribute, innerCss as css, SourceCopy } from "./maplewood-inner";

type InstructionStepsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "instructionSteps" }
> & { dataAttribute?: DataAttribute };

/** Numbered steps (Webflow layout486) with a large sticky step number. */
export default function InstructionSteps({ _key, background, cards, dataAttribute }: InstructionStepsProps) {
  const steps = (cards ?? []).filter((card) => stegaClean(card.title)?.trim());
  if (!steps.length) return null;
  const prefix = `steps-${stegaClean(_key)}`;
  const stepIds = steps.map((step) => `${prefix}-${stegaClean(step._key)}`);
  return (
    <section className={[css.section, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}>
      <div className={[css.container, css.steps].join(" ")}>
        <div className={css.stepsAside}>
          <InstructionStepsNumber stepIds={stepIds} />
        </div>
        <ol className={css.stepsList}>
          {steps.map((step, index) => (
            <li
              className={css.step}
              data-sanity={dataAttribute?.(`cards[_key=="${step._key}"]`)}
              id={stepIds[index]}
              key={step._key}
            >
              <div aria-hidden="true" className={css.stepNumberMobile}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className={css.stepRule} />
              {stegaClean(step.eyebrow)?.trim() ? <p className={css.tagline}>{step.eyebrow}</p> : null}
              <h2 className={[css.h2, css.stepTitle].join(" ")}>{step.title}</h2>
              <SourceCopy className={css.medium} value={step.body} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
