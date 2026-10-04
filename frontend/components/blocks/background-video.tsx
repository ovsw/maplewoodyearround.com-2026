"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
/** Decorative media starts only when motion is allowed and can always be paused. */
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
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      if (preference.matches || !visible || manuallyPaused.current) {
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
    if (video.current) observer.observe(video.current);
    preference.addEventListener("change", update);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);
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
        {webm ? <source src={webm} type="video/webm" /> : null}
        {mp4 ? <source src={mp4} type="video/mp4" /> : null}
      </video>
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
    </>
  );
}
