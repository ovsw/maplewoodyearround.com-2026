"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
/** Decorative media starts only when motion is allowed and can always be paused. */
export default function BackgroundVideo({ mp4, webm, poster, className }: { mp4?: string | null; webm?: string | null; poster?: string; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) { video.current?.pause(); setPlaying(false); }
      else { void video.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
    };
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return <><video ref={video} className={className} loop muted playsInline poster={poster} preload="none" aria-hidden="true">{webm ? <source src={webm} type="video/webm" /> : null}{mp4 ? <source src={mp4} type="video/mp4" /> : null}</video><button type="button" className="maplewood-video-control" aria-label={playing ? "Pause background video" : "Play background video"} onClick={() => { if (playing) { video.current?.pause(); setPlaying(false); } else { void video.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); } }}>{playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}</button></>;
}
