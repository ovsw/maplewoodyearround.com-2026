import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => {
  const imageBuilder = builder.image(source);

  // Check if it's an object with asset property that has mimeType
  const sourceObj = source as { asset?: { mimeType?: string } };
  const isSvg = sourceObj?.asset?.mimeType === "image/svg+xml";

  if (isSvg) {
    return imageBuilder;
  }

  return imageBuilder.format("webp").fit("crop");
};

export const SHARING_IMAGE_WIDTH = 1200;
export const SHARING_IMAGE_HEIGHT = 630;

/** Formats an uploaded image for link previews, honouring its crop and hotspot. */
export function sharingImageUrl(source: SanityImageSource) {
  const imageBuilder = builder
    .image(source)
    .width(SHARING_IMAGE_WIDTH)
    .height(SHARING_IMAGE_HEIGHT)
    .fit("crop");
  const sourceObj = source as { asset?: { mimeType?: string } };

  // Link preview crawlers do not render SVG.
  return (
    sourceObj?.asset?.mimeType === "image/svg+xml"
      ? imageBuilder.format("png")
      : imageBuilder
  ).url();
}
