import { PortableText } from "next-sanity";
import { Star } from "lucide-react";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import type { SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";
type Props = SectionProps<"quoteWall"> & { testimonialDataAttribute?: (id: string, path: string) => string | undefined };
export default function QuoteWall({ heading, description, testimonials, dataAttribute, testimonialDataAttribute }: Props) {
  const cards = testimonials?.flatMap((item) => item.document?.body?.length ? [item.document] : []) ?? [];
  if (!cards.length) return null;
  return <section className={css.testimonials} id="testimonials"><div className={css.container}>
    <h2 data-sanity={dataAttribute?.("heading")}><PortableText value={heading || []} components={{ block: { normal: ({ children }) => <>{children}</> } } /></h2>
    <div className={css.quoteGrid}>{cards.map((card) => <figure key={card._id} className={css.quote} data-sanity={testimonialDataAttribute?.(card._id, "body")}>
      <div className={css.stars} aria-label={`${card.rating || 5} out of 5 stars`}>{Array.from({ length: card.rating || 5 }, (_, i) => <Star key={i} size={24} fill="currentColor" aria-hidden />)}</div>
      <blockquote><PortableText value={card.body || []} components={simpleRichTextComponents}/></blockquote>
      <figcaption>{card.pluralParents ? "Parents" : "Parent"}{card.program ? `, ${card.program === "schoolYear" ? "School Year" : "Summer Camp"}` : null}</figcaption>
    </figure>)}</div>
    {description ? <p className={css.quoteClosing} data-sanity={dataAttribute?.("description")}>{description}</p> : null}
  </div></section>;
}
