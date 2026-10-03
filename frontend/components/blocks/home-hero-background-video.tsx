"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

type HomeHeroBackgroundVideoProps = {
  poster?: string;
  src: string;
};

export default function HomeHeroBackgroundVideo({
  poster,
  src,
}: HomeHeroBackgroundVideoProps) {
  const reduceMotion = useSyncExternalStore(
    subscribe,
    prefersReducedMotion,
    () => true,
  );
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
  }, [reduceMotion]);

  if (reduceMotion) return null;

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
