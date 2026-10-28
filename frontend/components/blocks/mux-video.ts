"use client";
import { lazy } from "react";

/**
 * Mux's `<video>`-compatible element, loaded on demand. It carries hls.js, so
 * it stays out of the first-paint bundle and only loads on viewports that
 * play the video.
 */
export const MuxVideo = lazy(() => import("@mux/mux-video-react"));

/** Mux's still frame, for a block that has no poster image of its own. */
export function muxPosterUrl(playbackId: string) {
  return `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.webp`;
}
