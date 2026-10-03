'use client'

import {
	PortableText,
	stegaClean,
	type PortableTextComponents,
} from 'next-sanity'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { HeroVideoZoomGrid } from '@/sanity/types'
import Img from '@/ui/img'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes, type ModuleProps } from '.'
import css from './hero.video-zoom-grid.module.css'

type HeroVideoZoomGridModule = ModuleProps & HeroVideoZoomGrid

type VideoMetrics = {
	vw: number
	vh: number
	endLeft: number
	endTop: number
	endWidth: number
	endHeight: number
	centerLeft: number
	centerTop: number
	centerWidth: number
	centerHeight: number
	isMobile: boolean
}

const CTA_BASE_CLASS =
	'inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 pointer-events-auto'

const CTA_STYLE_CLASSES = [
	`${CTA_BASE_CLASS} bg-brand-foreground text-brand-foreground-strong hover:bg-brand-foreground/90`,
	`${CTA_BASE_CLASS} border border-brand-foreground/80 text-brand-foreground hover:bg-brand-foreground/10`,
]

const HEADING_PORTABLE_TEXT_COMPONENTS: PortableTextComponents = {
	block: {
		normal: ({ children }) => <>{children}</>,
	},
	marks: {
		highlight: ({ children }) => (
			<span className="text-brand-highlight">{children}</span>
		),
	},
}

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value))

const lerp = (start: number, end: number, progress: number) =>
	start + (end - start) * progress

function getGridSlots(images: HeroVideoZoomGrid['gridImages']) {
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
	]
}

function getMobileSlots(images: HeroVideoZoomGrid['mobileImages']) {
	return [images?.[0] ?? null, null, images?.[1] ?? null]
}

export default function HeroVideoZoomGrid({
	heading,
	description,
	ctas,
	videoMp4Url,
	videoWebmUrl,
	posterUrl,
	gridImages,
	mobileImages,
	...props
}: HeroVideoZoomGridModule) {
	const trackRef = useRef<HTMLDivElement | null>(null)
	const stickyRef = useRef<HTMLDivElement | null>(null)
	const desktopGridTargetRef = useRef<HTMLDivElement | null>(null)
	const mobileGridTargetRef = useRef<HTMLDivElement | null>(null)
	const desktopCenterTargetRef = useRef<HTMLDivElement | null>(null)
	const mobileCenterTargetRef = useRef<HTMLDivElement | null>(null)
	const rafRef = useRef<number | null>(null)

	const [progress, setProgress] = useState(0)
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
	})

	const desktopScrollVh = 240
	const mobileScrollVh = 150
	const fadeEnd = 0.33

	const desktopSlots = useMemo(() => getGridSlots(gridImages), [gridImages])
	const mobileSlots = useMemo(
		() => getMobileSlots(mobileImages),
		[mobileImages],
	)

	useEffect(() => {
		const calculateMetrics = () => {
			const sticky = stickyRef.current
			const isMobile = window.matchMedia('(max-width: 767px)').matches
			const target = isMobile
				? mobileGridTargetRef.current
				: desktopGridTargetRef.current
			const center = isMobile
				? mobileCenterTargetRef.current
				: desktopCenterTargetRef.current
			if (!sticky || !target || !center) return

			const targetRect = target.getBoundingClientRect()
			const centerRect = center.getBoundingClientRect()

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
			})
		}

		const updateProgress = () => {
			const track = trackRef.current
			if (!track) return

			const rect = track.getBoundingClientRect()
			const total = track.offsetHeight - window.innerHeight
			const nextProgress = total <= 0 ? 0 : clamp(-rect.top / total, 0, 1)
			setProgress(nextProgress)
		}

		const onScroll = () => {
			if (rafRef.current !== null) return
			rafRef.current = window.requestAnimationFrame(() => {
				rafRef.current = null
				updateProgress()
			})
		}

		const onResize = () => {
			calculateMetrics()
			updateProgress()
		}

		calculateMetrics()
		updateProgress()

		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onResize)

		return () => {
			window.removeEventListener('scroll', onScroll)
			window.removeEventListener('resize', onResize)
			if (rafRef.current !== null) {
				window.cancelAnimationFrame(rafRef.current)
			}
		}
	}, [])

	const animationProgress = clamp((progress - 0.08) / 0.92, 0, 1)
	const revealProgress = clamp((progress - 0.18) / 0.68, 0, 1)
	const contentOpacity = clamp(1 - progress / fadeEnd, 0, 1)
	const currentOverlayOpacity = lerp(0.45, 0.2, revealProgress)

	const startWidth =
		metrics.centerWidth > 0
			? (metrics.vw * metrics.endWidth) / metrics.centerWidth
			: metrics.vw
	const startHeight =
		metrics.centerHeight > 0
			? (metrics.vh * metrics.endHeight) / metrics.centerHeight
			: metrics.vh
	const centerRatioX =
		metrics.endWidth > 0 ? metrics.centerLeft / metrics.endWidth : 0
	const centerRatioY =
		metrics.endHeight > 0 ? metrics.centerTop / metrics.endHeight : 0
	const startLeft = -centerRatioX * startWidth
	const startTop = -centerRatioY * startHeight

	const sceneStyle: React.CSSProperties = {
		left: `${lerp(startLeft, metrics.endLeft, animationProgress)}px`,
		top: `${lerp(startTop, metrics.endTop, animationProgress)}px`,
		width: `${lerp(startWidth, metrics.endWidth, animationProgress)}px`,
		height: `${lerp(startHeight, metrics.endHeight, animationProgress)}px`,
		boxShadow:
			animationProgress > 0.05
				? `0 18px 44px rgb(0 0 0 / ${lerp(0, 0.34, animationProgress)})`
				: undefined,
	}

	const trackHeightVh = metrics.isMobile ? mobileScrollVh : desktopScrollVh

	return (
		<section className={`full-bleed ${css.root}`} {...moduleAttributes(props)}>
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
						<div className={css.sceneDesktopGrid} aria-hidden>
							{desktopSlots.map((item, index) => (
								<div
									key={`desktop-slot-${index}`}
									className={`${css.tile} ${index === 4 ? css.videoTarget : css.mediaTile} ${
										index !== 4 && revealProgress > 0
											? css.mediaTileVisible
											: ''
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
												<video
													className={css.floatingVideoEl}
													autoPlay
													loop
													muted
													playsInline
													poster={stegaClean(posterUrl)}
													aria-hidden
												>
													{videoWebmUrl ? (
														<source
															src={stegaClean(videoWebmUrl)}
															type="video/webm"
														/>
													) : null}
													<source
														src={stegaClean(videoMp4Url)}
														type="video/mp4"
													/>
												</video>
											) : null}
											<div
												className={css.videoOverlay}
												style={{ opacity: currentOverlayOpacity }}
												aria-hidden
											/>
										</>
									) : item ? (
										<Img
											className={css.tileImage}
											image={item}
											width={640}
											alt={item.alt ?? ''}
										/>
									) : null}
								</div>
							))}
						</div>

						<div className={css.sceneMobileGrid} aria-hidden>
							{mobileSlots.map((item, index) => (
								<div
									key={`mobile-slot-${index}`}
									className={`${css.tile} ${index === 1 ? css.videoTarget : css.mediaTile} ${
										index !== 1 && revealProgress > 0
											? css.mediaTileVisible
											: ''
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
												<video
													className={css.floatingVideoEl}
													autoPlay
													loop
													muted
													playsInline
													poster={stegaClean(posterUrl)}
													aria-hidden
												>
													{videoWebmUrl ? (
														<source
															src={stegaClean(videoWebmUrl)}
															type="video/webm"
														/>
													) : null}
													<source
														src={stegaClean(videoMp4Url)}
														type="video/mp4"
													/>
												</video>
											) : null}
											<div
												className={css.videoOverlay}
												style={{ opacity: currentOverlayOpacity }}
												aria-hidden
											/>
										</>
									) : item ? (
										<Img
											className={css.tileImage}
											image={item}
											width={560}
											alt={item.alt ?? ''}
										/>
									) : null}
								</div>
							))}
						</div>
					</div>

					<div className={css.contentLayer} style={{ opacity: contentOpacity }}>
						<header className={css.contentInner}>
							{heading?.length ? (
								<h2 className="text-brand-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
									<PortableText
										value={heading}
										components={HEADING_PORTABLE_TEXT_COMPONENTS}
									/>
								</h2>
							) : null}

							{description ? (
								<p className="text-brand-foreground/90 mx-auto mt-6 max-w-3xl text-base leading-relaxed text-pretty sm:text-lg md:text-xl">
									{description}
								</p>
							) : null}

							{ctas?.length ? (
								<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
									{ctas.slice(0, 2).map((cta, index) => (
										<SanityLink
											key={cta._key}
											link={cta.link as SanityLinkType}
											className={
												CTA_STYLE_CLASSES[index] ?? CTA_STYLE_CLASSES[1]
											}
										/>
									))}
								</div>
							) : null}
						</header>
					</div>
				</div>
			</div>
		</section>
	)
}
