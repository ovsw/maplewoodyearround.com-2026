import { Check } from "lucide-react";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceActions,
  SourceIcon,
} from "./maplewood-inner";

type PricingCardsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "pricingCards" }
> & { dataAttribute?: DataAttribute };

// "$17/day" shows the amount large and the period after "/" smaller.
const splitPrice = (value?: string | null) => {
  const price = stegaClean(value) ?? "";
  const index = price.indexOf("/");
  return index > 0 ? [price.slice(0, index), price.slice(index)] : [price, ""];
};

/** Price cards (Webflow pricing19), each framed in its own colour. */
export default function PricingCards({
  _key,
  background,
  dataAttribute,
  description,
  plans,
  tagline,
  title,
}: PricingCardsProps) {
  if (!title || !plans?.length) return null;
  const headingId = `pricing-${stegaClean(_key)}-title`;
  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={css.container}>
        <div className={[css.narrow, css.centerText].join(" ")}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p className={[css.medium, css.pricingIntro].join(" ")} data-sanity={dataAttribute?.("description")}>
              {description}
            </p>
          ) : null}
        </div>
        <div className={css.pricingGrid}>
          {plans.map((plan) => {
            const [amount, period] = splitPrice(plan.price);
            const path = `plans[_key=="${plan._key}"]`;
            return (
              <article
                className={[css.card, css.pricingPlan, accentClass(plan.accent)].join(" ")}
                data-sanity={dataAttribute?.(path)}
                key={plan._key}
              >
                <div className={css.pricingIcon}>
                  <SourceIcon dataSanity={dataAttribute?.(`${path}.icon`)} icon={plan.icon} />
                </div>
                <h3 className={css.pricingTitle} data-sanity={dataAttribute?.(`${path}.title`)}>
                  {plan.title}
                </h3>
                <p className={css.pricingPrice} data-sanity={dataAttribute?.(`${path}.price`)}>
                  <span>{amount}</span>
                  {period ? <span className={css.pricingPeriod}>{period}</span> : null}
                </p>
                <hr className={css.pricingDivider} />
                {plan.details?.length ? (
                  <div className={css.pricingDetails} data-sanity={dataAttribute?.(`${path}.details`)}>
                    <PortableText
                      components={{
                        block: { normal: ({ children }) => <p>{children}</p> },
                        list: { bullet: ({ children }) => <ul>{children}</ul> },
                        listItem: {
                          bullet: ({ children }) => (
                            <li>
                              <Check aria-hidden size={20} />
                              <span>{children}</span>
                            </li>
                          ),
                        },
                      }}
                      value={plan.details}
                    />
                  </div>
                ) : null}
                <SourceActions
                  actions={plan.actions}
                  dataAttribute={(field) => dataAttribute?.(`${path}.${field}`)}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
