import { stegaClean } from "next-sanity";

export function getHomeHeroVideoEmbedUrl(url: string): string | null {
  const clean = stegaClean(url)?.trim();
  if (!clean) return null;

  try {
    const parsed = new URL(clean);
    let videoId: string | null = null;

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      videoId =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] ||
        null;
    }

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : null;
  } catch {
    return null;
  }
}
