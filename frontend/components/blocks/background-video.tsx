"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { stegaClean } from "next-sanity";
import { useMediaQuery } from "@/lib/use-media-query";
import { MuxVideo, muxPosterUrl } from "./mux-video";
/** Matches the `max-width: 767px` mobile layout of the blocks that use this video. */
export const BACKGROUND_VIDEO_QUERY = "(min-width: 768px)";
/**
 * Decorative media starts only when motion is allowed and can always be paused.
 * Below the desktop breakpoint it renders no sources, so phones never download
 * the video and see only the poster.
 *
 * A Mux playback ID takes precedence over the MP4 and WebM files: on desktop
 * the video then streams from Mux in the size the screen needs. Phones make no
 * Mux request, not even for the still frame.
 */
export default function BackgroundVideo({
  muxPlaybackId,
  mp4,
  webm,
  poster,
  className,
}: {
  muxPlaybackId?: string | null;
  mp4?: string | null;
  webm?: string | null;
  poster?: string;
  className?: string;
}) {
  // Mux attaches the video element after its code loads, so the effects
  // follow the element itself instead of reading a ref on mount.
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  const attach = useCallback(
    (node?: HTMLVideoElement | null) => setElement(node ?? null),
    [],
  );
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const desktop = useMediaQuery(BACKGROUND_VIDEO_QUERY, false);
  const playbackId = stegaClean(muxPlaybackId)?.trim() || undefined;
  useEffect(() => {
    if (!desktop || !element) return;
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
        element.pause();
        setPlaying(false);
      } else {
        void element
          .play()
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
    observer.observe(element);
    preference.addEventListener("change", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", onPageLoad);
      preference.removeEventListener("change", update);
      // The viewport became small (or the component unmounts): stop playback.
      if (!element.paused) element.pause();
      setPlaying(false);
    };
  }, [desktop, element]);
  useEffect(() => {
    // The viewport became small after the video played: drop the loaded
    // resource so the poster shows again instead of a frozen frame.
    if (!desktop) element?.load();
  }, [desktop, element]);
  const videoProps = {
    className,
    loop: true,
    muted: true,
    playsInline: true,
    preload: "none",
    "aria-hidden": true,
  } as const;
  // The plain element keeps the poster on phones and while Mux code loads.
  const plainVideo = (
    <video ref={attach} poster={poster} {...videoProps}>
      {desktop && !playbackId && webm ? (
        <source src={webm} type="video/webm" />
      ) : null}
      {desktop && !playbackId && mp4 ? (
        <source src={mp4} type="video/mp4" />
      ) : null}
    </video>
  );
  return (
    <>
      {desktop && playbackId ? (
        <Suspense fallback={plainVideo}>
          <MuxVideo
            ref={attach}
            playbackId={playbackId}
            poster={poster || muxPosterUrl(playbackId)}
            streamType="on-demand"
            disableTracking
            {...videoProps}
          />
        </Suspense>
      ) : (
        plainVideo
      )}
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
              element?.pause();
              setPlaying(false);
            } else {
              // A visitor can opt in; reduced motion prevents automatic playback.
              manuallyPaused.current = false;
              void element
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
