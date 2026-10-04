"use client";

import { stegaClean } from "next-sanity";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SectionProps } from "./maplewood-section";
import { SectionImage } from "./maplewood-section";
import BackgroundVideo from "./background-video";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import css from "./hero.video-zoom-grid.module.css";

type HeroVideoZoomGrid = SectionProps<"videoZoomGrid">;
type HeroVideoZoomGridModule = Pick<
  HeroVideoZoomGrid,
  "videoMp4Url" | "videoWebmUrl" | "gridImages" | "mobileImages"
> & { posterUrl?: string; children: React.ReactNode };

type VideoMetrics = {
  vw: number;
  vh: number;
  endLeft: number;
  endTop: number;
  endWidth: number;
  endHeight: number;
  centerLeft: number;
  centerTop: number;
  centerWidth: number;
  centerHeight: number;
  isMobile: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

function getGridSlots(images: HeroVideoZoomGrid["gridImages"]) {
  return [
    images?.[0] ?? null,
    images?.[1] ?? null,
    images?.[2] ?? null,
    images?.[3] ?? null,
    null,
    images?.[4] ?? null,
    images?.[5] ?? null,
    images?.[6] ?? null,
    images?.[7] ?? null,
  ];
}

function getMobileSlots(images: HeroVideoZoomGrid["mobileImages"]) {
  return [images?.[0] ?? null, null, images?.[1] ?? null];
}

export default function HeroVideoZoomGrid({
  children,
  videoMp4Url,
  videoWebmUrl,
  posterUrl,
  gridImages,
  mobileImages,
}: HeroVideoZoomGridModule) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const desktopGridTargetRef = useRef<HTMLDivElement | null>(null);
  const mobileGridTargetRef = useRef<HTMLDivElement | null>(null);
  const desktopCenterTargetRef = useRef<HTMLDivElement | null>(null);
  const mobileCenterTargetRef = useRef<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState(false);

  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<VideoMetrics>({
    vw: 0,
    vh: 0,
    endLeft: 0,
    endTop: 0,
    endWidth: 0,
    endHeight: 0,
    centerLeft: 0,
    centerTop: 0,
    centerWidth: 0,
    centerHeight: 0,
    isMobile: false,
  });

  const desktopScrollVh = 300;
  const mobileScrollVh = 300;
  const fadeEnd = 0.33;

  const desktopSlots = useMemo(() => getGridSlots(gridImages), [gridImages]);
  const mobileSlots = useMemo(
    () => getMobileSlots(mobileImages),
    [mobileImages],
  );

  useEffect(() => {
    const calculateMetrics = () => {
      const sticky = stickyRef.current;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const target = isMobile
        ? mobileGridTargetRef.current
        : desktopGridTargetRef.current;
      const center = isMobile
        ? mobileCenterTargetRef.current
        : desktopCenterTargetRef.current;
      if (!sticky || !target || !center) return;

      const targetRect = target.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();

      setMetrics({
        vw: window.innerWidth,
        vh: window.innerHeight,
        endLeft: 0,
        endTop: 0,
        endWidth: window.innerWidth,
        endHeight: window.innerHeight,
        centerLeft: centerRect.left - targetRect.left,
        centerTop: centerRect.top - targetRect.top,
        centerWidth: centerRect.width,
        centerHeight: centerRect.height,
        isMobile,
      });
    };

    const media = gsap.matchMedia();
    media.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        moving: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const isReduced = Boolean(context.conditions?.reduced);
        setReduced(isReduced);
        calculateMetrics();
        if (isReduced) {
          setProgress(1);
          return;
        }
        const trigger = ScrollTrigger.create({
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => setProgress(self.progress),
          onRefresh: calculateMetrics,
        });
        return () => trigger.kill();
      },
    );
    return () => media.revert();
  }, []);

  const animationProgress = clamp((progress - 0.08) / 0.92, 0, 1);
  const revealProgress = clamp((progress - 0.18) / 0.68, 0, 1);
  const contentOpacity = clamp(1 - progress / fadeEnd, 0, 1);
  const currentOverlayOpacity = lerp(0.45, 0.2, revealProgress);

  const startWidth =
    metrics.centerWidth > 0
      ? (metrics.vw * metrics.endWidth) / metrics.centerWidth
      : metrics.vw;
  const startHeight =
    metrics.centerHeight > 0
      ? (metrics.vh * metrics.endHeight) / metrics.centerHeight
      : metrics.vh;
  const centerRatioX =
    metrics.endWidth > 0 ? metrics.centerLeft / metrics.endWidth : 0;
  const centerRatioY =
    metrics.endHeight > 0 ? metrics.centerTop / metrics.endHeight : 0;
  const startLeft = -centerRatioX * startWidth;
  const startTop = -centerRatioY * startHeight;

  const sceneStyle: React.CSSProperties = {
    left: `${lerp(startLeft, metrics.endLeft, animationProgress)}px`,
    top: `${lerp(startTop, metrics.endTop, animationProgress)}px`,
    width: `${lerp(startWidth, metrics.endWidth, animationProgress)}px`,
    height: `${lerp(startHeight, metrics.endHeight, animationProgress)}px`,
    boxShadow:
      animationProgress > 0.05
        ? `0 18px 44px rgb(0 0 0 / ${lerp(0, 0.34, animationProgress)})`
        : undefined,
  };

  const trackHeightVh = metrics.isMobile ? mobileScrollVh : desktopScrollVh;

  return (
    <section className={`${css.root} ${reduced ? css.reduced : ""}`}>
      <div
        ref={trackRef}
        className={css.scrollTrack}
        style={{ height: `${trackHeightVh}vh` }}
      >
        <div ref={stickyRef} className={css.stickyViewport}>
          <div className={css.gridTargetStage} aria-hidden>
            <div ref={desktopGridTargetRef} className={css.desktopGrid}>
              {Array.from({ length: 9 }, (_, index) => (
                <div
                  key={`desktop-target-${index}`}
                  ref={index === 4 ? desktopCenterTargetRef : undefined}
                  className={css.measurementTile}
                />
              ))}
            </div>
            <div ref={mobileGridTargetRef} className={css.mobileGrid}>
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={`mobile-target-${index}`}
                  ref={index === 1 ? mobileCenterTargetRef : undefined}
                  className={css.measurementTile}
                />
              ))}
            </div>
          </div>

          <div className={css.floatingScene} style={sceneStyle}>
            <div className={css.sceneDesktopGrid}>
              {desktopSlots.map((item, index) => (
                <div
                  key={`desktop-slot-${index}`}
                  className={`${css.tile} ${index === 4 ? css.videoTarget : css.mediaTile} ${
                    index !== 4 && revealProgress > 0
                      ? css.mediaTileVisible
                      : ""
                  }`}
                  style={
                    index !== 4
                      ? {
                          opacity: revealProgress,
                          transform: `translate3d(0, ${lerp(
                            24,
                            0,
                            revealProgress,
                          )}px, 0) scale(${lerp(0.9, 1, revealProgress)})`,
                        }
                      : undefined
                  }
                >
                  {index === 4 ? (
                    <>
                      {videoMp4Url ? (
                        <BackgroundVideo
                          className={css.floatingVideoEl}
                          mp4={stegaClean(videoMp4Url)}
                          webm={stegaClean(videoWebmUrl)}
                          poster={stegaClean(posterUrl)}
                        />
                      ) : null}
                      <div
                        className={css.videoOverlay}
                        style={{ opacity: currentOverlayOpacity }}
                        aria-hidden
                      />
                    </>
                  ) : item ? (
                    <SectionImage
                      className={css.tileImage}
                      image={item}
                      sizes="33vw"
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <div className={css.sceneMobileGrid}>
              {mobileSlots.map((item, index) => (
                <div
                  key={`mobile-slot-${index}`}
                  className={`${css.tile} ${index === 1 ? css.videoTarget : css.mediaTile} ${
                    index !== 1 && revealProgress > 0
                      ? css.mediaTileVisible
                      : ""
                  }`}
                  style={
                    index !== 1
                      ? {
                          opacity: revealProgress,
                          transform: `translate3d(0, ${lerp(
                            16,
                            0,
                            revealProgress,
                          )}px, 0) scale(${lerp(0.92, 1, revealProgress)})`,
                        }
                      : undefined
                  }
                >
                  {index === 1 ? (
                    <>
                      {videoMp4Url ? (
                        <BackgroundVideo
                          className={css.floatingVideoEl}
                          mp4={stegaClean(videoMp4Url)}
                          webm={stegaClean(videoWebmUrl)}
                          poster={stegaClean(posterUrl)}
                        />
                      ) : null}
                      <div
                        className={css.videoOverlay}
                        style={{ opacity: currentOverlayOpacity }}
                        aria-hidden
                      />
                    </>
                  ) : item ? (
                    <SectionImage
                      className={css.tileImage}
                      image={item}
                      sizes="100vw"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div
            className={css.contentLayer}
            style={{
              opacity: reduced ? 1 : contentOpacity,
              visibility:
                !reduced && contentOpacity === 0 ? "hidden" : "visible",
            }}
          >
            <header className={css.contentInner}>{children}</header>
          </div>
        </div>
      </div>
    </section>
  );
}
