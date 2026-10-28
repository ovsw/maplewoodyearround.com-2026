"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Matches the hero's `lg` desktop layout. Smaller screens show the poster. */
export const HOME_HERO_VIDEO_QUERY = "(min-width: 1024px)";

type HomeHeroBackgroundVideoProps = {
  poster?: string;
  src: string;
};

export default function HomeHeroBackgroundVideo({
  poster,
  src,
}: HomeHeroBackgroundVideoProps) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY, true);
  // Phones and small tablets never mount the video, so they never download
  // it; the hero's poster image shows instead.
  const desktop = useMediaQuery(HOME_HERO_VIDEO_QUERY, false);
  const showVideo = desktop && !reduceMotion;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Decoding a looping video is constant CPU/GPU work, so pause it whenever
  // the hero is scrolled out of view.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [showVideo]);

  if (!showVideo) return null;

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      className="absolute inset-0 size-full object-cover"
      loop
      muted
      playsInline
      poster={poster}
      src={src}
    />
  );
}
