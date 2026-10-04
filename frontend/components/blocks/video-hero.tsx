import { stegaClean } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import BackgroundVideo from "./background-video";
import {
  HighlightedTitle,
  SectionActions,
  type SectionProps,
} from "./maplewood-section";
import css from "./maplewood-home.module.css";

/** Port of legacy-mdc/sections/hero.video.tsx: background, shading, centred title and two actions. */
export default function VideoHero({
  _key,
  title,
  highlightText,
  description,
  actions,
  videoMp4Url,
  videoWebmUrl,
  poster,
  overlayOpacity,
  dataAttribute,
}: SectionProps<"videoHero">) {
  const shade =
    typeof overlayOpacity === "number"
      ? Math.min(1, Math.max(0, overlayOpacity))
      : 0.65;
  return (
    <section className={css.hero} aria-labelledby={`hero-${stegaClean(_key)}`}>
      <BackgroundVideo
        mp4={stegaClean(videoMp4Url)}
        webm={stegaClean(videoWebmUrl)}
        poster={poster?.asset ? urlFor(poster).width(1600).url() : undefined}
        className={css.heroVideo}
      />
      <div className={css.heroOverlay} style={{ opacity: shade }} aria-hidden />
      <header className={css.heroContent}>
        <h1
          id={`hero-${stegaClean(_key)}`}
          data-sanity={dataAttribute?.("title")}
        >
          <HighlightedTitle title={title} highlightText={highlightText} />
        </h1>
        {description ? (
          <p data-sanity={dataAttribute?.("description")}>{description}</p>
        ) : null}
        <SectionActions
          actions={actions?.slice(0, 2) ?? []}
          dataAttribute={dataAttribute}
        />
      </header>
    </section>
  );
}
