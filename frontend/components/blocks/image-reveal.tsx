import { PortableText } from "next-sanity";
import { richTextContentComponents } from "@/components/rich-text-content";
import HomeScrollMotion from "./home-scroll-motion";
import { SectionActions, SectionImage, type SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";
export default function ImageReveal({ title, eyebrow, body, description, image, actions, dataAttribute }: SectionProps<"imageReveal">) {
  return <section className={css.yearRound}><HomeScrollMotion kind="reveal" className={css.reveal}>
    <div className={css.revealText}>{eyebrow ? <p className={css.eyebrow} data-sanity={dataAttribute?.("eyebrow")}>{eyebrow}</p> : null}<h2 data-sanity={dataAttribute?.("title")}>{title}</h2>
    <div className={css.body} data-sanity={dataAttribute?.(body?.length ? "body" : "description")}>{body?.length ? <PortableText value={body} components={richTextContentComponents}/> : <p>{description}</p>}</div>
    <SectionActions actions={actions} dataAttribute={dataAttribute}/></div>
    <div className={css.revealImage} data-reveal-image data-sanity={dataAttribute?.("image")}><SectionImage image={image}/></div>
  </HomeScrollMotion></section>;
}
