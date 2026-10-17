import Image from "next/image";
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
  const mp4 = stegaClean(videoMp4Url);
  const webm = stegaClean(videoWebmUrl);
  return (
    <section className={css.hero} aria-labelledby={`hero-${stegaClean(_key)}`}>
      {mp4 || webm ? (
        <BackgroundVideo
          mp4={mp4}
          webm={webm}
          poster={poster?.asset ? urlFor(poster).width(1600).url() : undefined}
          className={css.heroVideo}
        />
      ) : poster?.asset?._id ? (
        // Without a video the still image is the hero backdrop and the
        // page's largest paint, so it loads first.
        <Image
          src={urlFor(poster).width(1920).url()}
          alt={stegaClean(poster.alt) || ""}
          blurDataURL={poster.asset.metadata?.lqip || undefined}
          placeholder={poster.asset.metadata?.lqip ? "blur" : undefined}
          className={css.heroVideo}
          style={
            poster.hotspot?.x != null && poster.hotspot.y != null
              ? {
                  objectPosition: `${poster.hotspot.x * 100}% ${poster.hotspot.y * 100}%`,
                }
              : undefined
          }
          data-sanity={dataAttribute?.("poster")}
          fill
          preload
          sizes="100vw"
        />
      ) : null}
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
