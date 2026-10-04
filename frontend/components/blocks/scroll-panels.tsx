import { PortableText } from "next-sanity";
import { richTextContentComponents } from "@/components/rich-text-content";
import HomeScrollMotion from "./home-scroll-motion";
import { SectionActions, SectionImage, type SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";
export default function ScrollPanels({ cards, dataAttribute }: SectionProps<"scrollPanels">) {
  return <section><HomeScrollMotion kind="panels" className={css.panels}>{cards?.map((card) => {
    const path = `cards[_key=="${card._key}"]`;
    return <article key={card._key} className={css.panel}>
      <div className={css.panelImage} data-panel-image data-sanity={dataAttribute?.(`${path}.image`)}><SectionImage image={card.image} className={css.desktopPhoto}/><SectionImage image={card.mobileImage || card.image} className={css.mobilePhoto}/></div>
      <div className={css.panelContent} data-panel-content>
        <div>{card.eyebrow ? <p className={css.eyebrow} data-sanity={dataAttribute?.(`${path}.eyebrow`)}>{card.eyebrow}</p> : null}
        <h2 data-sanity={dataAttribute?.(`${path}.title`)}>{card.title}</h2>
        <div className={css.body} data-sanity={dataAttribute?.(`${path}.body`)}><PortableText value={card.body || []} components={richTextContentComponents}/></div>
        <SectionActions actions={card.actions} dataAttribute={(field) => dataAttribute?.(`${path}.${field}`)}/></div>
      </div>
    </article>;
  })}</HomeScrollMotion></section>;
}
