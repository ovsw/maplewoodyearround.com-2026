"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { stegaClean } from "next-sanity";
import { useMediaQuery } from "@/lib/use-media-query";
import { MuxVideo, muxPosterUrl } from "./mux-video";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Matches the hero's `lg` desktop layout. Smaller screens show the poster. */
export const HOME_HERO_VIDEO_QUERY = "(min-width: 1024px)";

type HomeHeroBackgroundVideoProps = {
  /** Streams from Mux when set; `src` then is not used. */
  playbackId?: string | null;
  poster?: string;
  src?: string;
};

export default function HomeHeroBackgroundVideo({
  playbackId: rawPlaybackId,
  poster,
  src,
}: HomeHeroBackgroundVideoProps) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY, true);
  // Phones and small tablets never mount the video, so they never download
  // it (from Mux or the file URL); the hero's poster image shows instead.
  const desktop = useMediaQuery(HOME_HERO_VIDEO_QUERY, false);
  const showVideo = desktop && !reduceMotion;
  const playbackId = stegaClean(rawPlaybackId)?.trim() || undefined;
  // Mux attaches its element after its code loads, so the effect follows the
  // element itself instead of reading a ref on mount.
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const attach = useCallback(
    (node?: HTMLVideoElement | null) => setVideo(node ?? null),
    [],
  );

  // Decoding a looping video is constant CPU/GPU work, so pause it whenever
  // the hero is scrolled out of view.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [video]);

  if (!showVideo || (!playbackId && !src)) return null;

  const videoProps = {
    "aria-hidden": true,
    autoPlay: true,
    className: "absolute inset-0 size-full object-cover",
    loop: true,
    muted: true,
    playsInline: true,
  } as const;

  if (playbackId) {
    // The hero's own image covers the space while the Mux code loads.
    return (
      <Suspense fallback={null}>
        <MuxVideo
          ref={attach}
          disableTracking
          playbackId={playbackId}
          poster={poster || muxPosterUrl(playbackId)}
          streamType="on-demand"
          {...videoProps}
        />
      </Suspense>
    );
  }

  return <video ref={attach} poster={poster} src={src} {...videoProps} />;
}
