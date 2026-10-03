import { stegaClean } from "next-sanity";

type PortableTextNode = {
  _type?: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  url?: string | null;
  embedUrl?: string | null;
  contentUrl?: string | null;
  thumbnailUrl?: string | null;
  uploadDate?: string | null;
  children?: PortableTextNode[];
  markDefs?: PortableTextNode[];
  [key: string]: unknown;
};

export type VideoObjectJsonLd = {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description?: string;
  embedUrl?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? stegaClean(value)?.trim() : undefined;
}

function isVideoNode(node: PortableTextNode) {
  return Boolean(node._type?.toLowerCase().includes("video"));
}

function walk(node: unknown, videos: VideoObjectJsonLd[]) {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const child of node) walk(child, videos);
    return;
  }

  const candidate = node as PortableTextNode;
  if (isVideoNode(candidate)) {
    const name = clean(candidate.name) || clean(candidate.title);
    const embedUrl = clean(candidate.embedUrl) || clean(candidate.url);
    const contentUrl = clean(candidate.contentUrl);

    if (name && (embedUrl || contentUrl)) {
      videos.push({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name,
        ...(clean(candidate.description)
          ? { description: clean(candidate.description) }
          : {}),
        ...(embedUrl ? { embedUrl } : {}),
        ...(contentUrl ? { contentUrl } : {}),
        ...(clean(candidate.thumbnailUrl)
          ? { thumbnailUrl: clean(candidate.thumbnailUrl) }
          : {}),
        ...(clean(candidate.uploadDate)
          ? { uploadDate: clean(candidate.uploadDate) }
          : {}),
      });
    }
  }

  for (const value of Object.values(candidate)) {
    if (value && typeof value === "object") walk(value, videos);
  }
}

export function createVideoObjectJsonLd(
  content: unknown,
): VideoObjectJsonLd[] {
  const videos: VideoObjectJsonLd[] = [];
  walk(content, videos);
  return videos;
}

export function serializeVideoObjectJsonLd(value: VideoObjectJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
