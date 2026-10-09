// Pictures are the image assets editors place: every image asset except the
// poster frames Webflow made for its videos.

/** True for an image asset that is a picture, not a video poster frame. */
export const isPicture = (asset) =>
  asset._type === "sanity.imageAsset" && !/-poster-\d+\.[a-z0-9]+$/i.test(asset.originalFilename ?? "");

/**
 * The name two copies of one picture share: the file name without its leading
 * Webflow ID prefixes, its extension and a trailing copy counter such as
 * "(1)" or "-1", in lower case with hyphens for spaces.
 */
export const pictureStem = (filename) =>
  filename
    .replace(/^(?:[0-9a-f]{24}_)+/i, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/(?:[\s-]*\(\d+\)|-1)+$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

/**
 * The name Raster gives an uploaded file: the file name without its extension.
 * The Raster sync matches Sanity assets to Raster descriptions by this name,
 * case-insensitively.
 */
export const rasterName = (filename) =>
  filename
    .replace(/\.[a-z0-9]+$/i, "")
    .trim()
    .toLowerCase();
