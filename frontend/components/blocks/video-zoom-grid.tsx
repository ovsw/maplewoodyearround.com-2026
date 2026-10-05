import { urlFor } from "@/sanity/lib/image";
import {
  HighlightedTitle,
  SectionActions,
  type SectionProps,
} from "./maplewood-section";
import { SectionTagline } from "./maplewood-inner";
import VideoZoomGridScene from "./video-zoom-grid-scene";
export default function VideoZoomGrid({
  tagline,
  title,
  highlightText,
  description,
  actions,
  dataAttribute,
  poster,
  videoMp4Url,
  videoWebmUrl,
  gridImages,
  mobileImages,
}: SectionProps<"videoZoomGrid">) {
  return (
    <VideoZoomGridScene
      videoMp4Url={videoMp4Url}
      videoWebmUrl={videoWebmUrl}
      posterUrl={poster?.asset ? urlFor(poster).width(1600).url() : undefined}
      gridImages={gridImages}
      mobileImages={mobileImages}
    >
      <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
      <h2 data-sanity={dataAttribute?.("title")}>
        <HighlightedTitle title={title} highlightText={highlightText} />
      </h2>
      {description ? (
        <p data-sanity={dataAttribute?.("description")}>{description}</p>
      ) : null}
      <SectionActions actions={actions} dataAttribute={dataAttribute} />
    </VideoZoomGridScene>
  );
}
