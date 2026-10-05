import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import BackgroundVideo from "./background-video";
import { type DataAttribute, SourceCopy, SourceImage } from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type DirectorIntroProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "directorIntro" }
> & { dataAttribute?: DataAttribute };

/*
 * Director story (Webflow layout355): the background video fills the first
 * screen, then the story panels scroll over it, alternating sides. The video
 * stays still under reduced motion and can always be paused.
 */
export default function DirectorIntro({
  _key,
  dataAttribute,
  panels,
  poster,
  videoMp4Url,
  videoWebmUrl,
}: DirectorIntroProps) {
  const story = (panels ?? []).filter((panel) => stegaClean(panel.title)?.trim());
  if (!story.length) return null;
  const headingId = `director-intro-${stegaClean(_key)}-title`;

  return (
    <section aria-labelledby={headingId} className={about.director}>
      <div className={about.directorMedia} data-sanity={dataAttribute?.("videoMp4")}>
        <SourceImage className={about.directorPoster} image={poster} priority sizes="100vw" width={1920} />
        {videoMp4Url || videoWebmUrl ? (
          <BackgroundVideo
            className={about.directorVideo}
            mp4={videoMp4Url}
            poster={poster?.asset ? urlFor(poster).width(1920).url() : undefined}
            webm={videoWebmUrl}
          />
        ) : null}
        <div aria-hidden="true" className={about.directorOverlay} />
      </div>
      <div className={about.directorPanels}>
        {story.map((panel, index) => {
          const Heading = index === 0 ? "h1" : "h2";
          const path = `panels[_key=="${panel._key}"]`;
          return (
            <div
              className={about.directorPanel}
              data-sanity={dataAttribute?.(path)}
              key={panel._key}
              // Each panel fills a screen; the right-hand ones start half a screen lower.
              style={{ gridColumn: index % 2 ? 3 : 1, gridRow: `${index + 1} / span 2` }}
            >
              <Heading data-sanity={dataAttribute?.(`${path}.title`)} id={index === 0 ? headingId : undefined}>
                {panel.title}
              </Heading>
              <SourceCopy dataSanity={dataAttribute?.(`${path}.body`)} value={panel.body} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
