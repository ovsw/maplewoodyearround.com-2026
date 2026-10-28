"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";
/** Matches the `max-width: 767px` mobile layout of the blocks that use this video. */
export const BACKGROUND_VIDEO_QUERY = "(min-width: 768px)";
/**
 * Decorative media starts only when motion is allowed and can always be paused.
 * Below the desktop breakpoint it renders no sources, so phones never download
 * the video and see only the poster.
 */
export default function BackgroundVideo({
  mp4,
  webm,
  poster,
  className,
}: {
  mp4?: string | null;
  webm?: string | null;
  poster?: string;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const desktop = useMediaQuery(BACKGROUND_VIDEO_QUERY, false);
  useEffect(() => {
    if (!desktop) return;
    const element = video.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    // The video downloads only once it plays, so holding playback until the
    // page has loaded keeps it from competing with the rest of the page.
    let pageLoaded = document.readyState === "complete";
    const update = () => {
      if (
        preference.matches ||
        !visible ||
        !pageLoaded ||
        manuallyPaused.current
      ) {
        video.current?.pause();
        setPlaying(false);
      } else {
        void video.current
          ?.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const onPageLoad = () => {
      pageLoaded = true;
      update();
    };
    if (!pageLoaded) window.addEventListener("load", onPageLoad, { once: true });
    if (video.current) observer.observe(video.current);
    preference.addEventListener("change", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", onPageLoad);
      preference.removeEventListener("change", update);
      // The viewport became small (or the component unmounts): stop playback.
      if (element && !element.paused) element.pause();
      setPlaying(false);
    };
  }, [desktop]);
  useEffect(() => {
    // The viewport became small after the video played: drop the loaded
    // resource so the poster shows again instead of a frozen frame.
    if (!desktop) video.current?.load();
  }, [desktop]);
  return (
    <>
      <video
        ref={video}
        className={className}
        loop
        muted
        playsInline
        poster={poster}
        preload="none"
        aria-hidden="true"
      >
        {desktop && webm ? <source src={webm} type="video/webm" /> : null}
        {desktop && mp4 ? <source src={mp4} type="video/mp4" /> : null}
      </video>
      {desktop ? (
        <button
          type="button"
          className="maplewood-video-control"
          aria-label={
            playing ? "Pause background video" : "Play background video"
          }
          onClick={() => {
            if (playing) {
              manuallyPaused.current = true;
              video.current?.pause();
              setPlaying(false);
            } else {
              // A visitor can opt in; reduced motion prevents automatic playback.
              manuallyPaused.current = false;
              void video.current
                ?.play()
                .then(() => setPlaying(true))
                .catch(() => setPlaying(false));
            }
          }}
        >
          {playing ? (
            <Pause size={18} aria-hidden />
          ) : (
            <Play size={18} aria-hidden />
          )}
        </button>
      ) : null}
    </>
  );
}
