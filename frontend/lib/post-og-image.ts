import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Version 2: the Maplewood card with the hero photo.
export const OG_IMAGE_VERSION = "2";
export const POST_OG_IMAGE_VERSION = OG_IMAGE_VERSION;

const MAX_SLUG_LENGTH = 200;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SLUG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9/_-]*[A-Za-z0-9])?$/;

type PostOgImageIdentity = {
  slug: string;
  revision: string;
  version?: string;
};

export type OgImageIdentity = {
  key: string;
  revision: string;
  version?: string;
};

function signaturePayload({
  slug,
  revision,
  version = OG_IMAGE_VERSION,
}: PostOgImageIdentity) {
  return `${version}\n${slug}\n${revision}`;
}

/** The hero photo of a Generated sharing card, as `sharingCardQuery` returns it. */
export type SharingPhoto = {
  asset?: { _ref?: string | null } | null;
  crop?: { top?: number; bottom?: number; left?: number; right?: number } | null;
  hotspot?: { x?: number; y?: number; width?: number; height?: number } | null;
} | null | undefined;

/**
 * Names the photo and its framing, so a revision changes when an editor
 * replaces the photo or moves its crop or hotspot.
 */
export function getSharingPhotoKey(photo: SharingPhoto) {
  const ref = photo?.asset?._ref;
  if (!ref) return "";
  const { crop, hotspot } = photo;
  return [
    ref,
    crop ? [crop.top, crop.bottom, crop.left, crop.right].join(",") : "",
    hotspot ? [hotspot.x, hotspot.y, hotspot.width, hotspot.height].join(",") : "",
  ].join("|");
}

export function createPostOgImageRevision({
  photo,
  publishedAt,
  title,
}: {
  photo?: SharingPhoto;
  publishedAt: string;
  title: string;
}) {
  return createOgImageRevision([title.trim(), publishedAt, getSharingPhotoKey(photo)]);
}

export function createOgImageRevision(parts: string[]) {
  return createHash("sha256")
    .update(parts.join("\n"))
    .digest("base64url")
    .slice(0, 22);
}

export function isValidOgSlug(slug: string) {
  return (
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    !slug.includes("//") &&
    SLUG_PATTERN.test(slug)
  );
}

export const isValidPostOgSlug = isValidOgSlug;

export function signPostOgImage(
  identity: PostOgImageIdentity,
  secret: string,
) {
  return signOgImage(
    {
      key: identity.slug,
      revision: identity.revision,
      version: identity.version,
    },
    secret,
  );
}

export function signOgImage(identity: OgImageIdentity, secret: string) {
  return createHmac("sha256", secret)
    .update(
      signaturePayload({
        slug: identity.key,
        revision: identity.revision,
        version: identity.version,
      }),
    )
    .digest("base64url");
}

export function verifyPostOgImageSignature({
  identity,
  secret,
  signature,
}: {
  identity: PostOgImageIdentity;
  secret: string;
  signature: string;
}) {
  return verifyOgImageSignature({
    identity: {
      key: identity.slug,
      revision: identity.revision,
      version: identity.version,
    },
    secret,
    signature,
  });
}

export function verifyOgImageSignature({
  identity,
  secret,
  signature,
}: {
  identity: OgImageIdentity;
  secret: string;
  signature: string;
}) {
  if (!SIGNATURE_PATTERN.test(signature)) return false;

  const expected = Buffer.from(signOgImage(identity, secret), "base64url");
  const received = Buffer.from(signature, "base64url");

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function getOgImageSecret() {
  const secret = process.env.OG_IMAGE_SECRET;
  if (!secret) throw new Error("OG_IMAGE_SECRET is required");
  return secret;
}

export const getPostOgImageSecret = getOgImageSecret;

export function buildPostOgImageUrl({
  origin,
  photo,
  publishedAt,
  slug,
  title,
  secret = getPostOgImageSecret(),
}: {
  origin: string;
  photo?: SharingPhoto;
  publishedAt: string;
  secret?: string;
  slug: string;
  title: string;
}) {
  if (!isValidPostOgSlug(slug)) {
    throw new Error("Cannot build an OG image URL for an invalid post slug");
  }

  const encodedSlug = slug.split("/").map(encodeURIComponent).join("/");
  const revision = createPostOgImageRevision({ photo, publishedAt, title });
  const url = new URL(`/api/og/post/${encodedSlug}`, origin);
  url.searchParams.set("v", POST_OG_IMAGE_VERSION);
  url.searchParams.set("rev", revision);
  url.searchParams.set(
    "sig",
    signPostOgImage({ slug, revision }, secret),
  );
  return url.toString();
}

export function formatPostOgDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .toUpperCase();
}

// The title column is 648px wide. A Poppins Bold letter is about 0.64em wide,
// so the longest word also caps the size; short titles match the live 90px.
const TITLE_COLUMN_WIDTH = 648;
const POPPINS_BOLD_LETTER_WIDTH = 0.64;

export function fitPostOgTitle(value: string) {
  const trimmed = value.trim();
  let text = trimmed;
  if (trimmed.length > 96) {
    const candidate = trimmed.slice(0, 95);
    const lastSpace = candidate.lastIndexOf(" ");
    text = `${candidate.slice(0, lastSpace > 70 ? lastSpace : 95).trim()}…`;
  }

  const sizeForLength =
    text.length <= 28 ? 90 : text.length <= 44 ? 76 : text.length <= 70 ? 60 : 50;
  const longestWord = Math.max(...text.split(/\s+/).map((word) => word.length));
  const sizeForWord = Math.floor(
    TITLE_COLUMN_WIDTH / (longestWord * POPPINS_BOLD_LETTER_WIDTH),
  );
  return { text, fontSize: Math.min(sizeForLength, sizeForWord) };
}
