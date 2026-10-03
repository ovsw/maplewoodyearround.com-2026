import { PortableText, stegaClean, type PortableTextComponents } from 'next-sanity'
import type { HeroVideo } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes, type ModuleProps } from '.'

type HeroVideoModule = ModuleProps &
	Omit<HeroVideo, 'heading'> & {
		heading?: HeroVideo['heading'] | string
	}

const CTA_BASE_CLASS =
	'inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200'

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

function getLegacyHeading({
	heading,
	highlightText,
}: Pick<HeroVideoModule, 'heading' | 'highlightText'>) {
	if (typeof heading !== 'string') return null

	const cleanHeading = stegaClean(heading)
	const cleanHighlightText = stegaClean(highlightText)

	if (!cleanHeading) return null

	if (!cleanHighlightText || !cleanHeading.includes(cleanHighlightText)) {
		return (
			<h1 className="text-brand-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
				{heading}
				{highlightText ? (
					<>
						<br />
						<span className="text-brand-highlight">{highlightText}</span>
					</>
				) : null}
			</h1>
		)
	}

	const [before, ...rest] = heading.split(highlightText!)
	const after = rest.join(highlightText!)

	return (
		<h1 className="text-brand-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
			{before}
			<span className="text-brand-highlight">{cleanHighlightText}</span>
			{after}
		</h1>
	)
}

function getHeading({
	heading,
	highlightText,
}: Pick<HeroVideoModule, 'heading' | 'highlightText'>) {
	if (typeof heading === 'string') {
		return getLegacyHeading({ heading, highlightText })
	}

	if (!heading?.length) return null

	return (
		<h1 className="text-brand-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
			<PortableText
				value={heading}
				components={HEADING_PORTABLE_TEXT_COMPONENTS}
			/>
		</h1>
	)
}

export default function HeroVideo({
	heading,
	highlightText,
	description,
	ctas,
	videoMp4Url,
	videoWebmUrl,
	posterUrl,
	overlayOpacity,
	...props
}: HeroVideoModule) {
	const overlayValue =
		typeof overlayOpacity === 'number'
			? Math.min(1, Math.max(0, overlayOpacity))
			: 0.45

	return (
		<section
			className="full-bleed relative min-h-screen w-screen overflow-hidden"
			{...moduleAttributes(props)}
		>
			{videoMp4Url ? (
				<video
					className="absolute inset-0 h-full w-full object-cover"
					autoPlay
					loop
					muted
					playsInline
					poster={stegaClean(posterUrl)}
					aria-hidden
				>
					{videoWebmUrl ? (
						<source src={stegaClean(videoWebmUrl)} type="video/webm" />
					) : null}
					<source src={stegaClean(videoMp4Url)} type="video/mp4" />
				</video>
			) : null}

			<div
				className="bg-brand-overlay absolute inset-0"
				style={{ opacity: overlayValue }}
				aria-hidden
			/>

			<div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-24 text-center md:px-10">
				<header className="space-y-6">
					{getHeading({ heading, highlightText })}

					{description ? (
						<p className="text-brand-foreground/90 mx-auto max-w-3xl text-base leading-relaxed text-pretty sm:text-lg md:text-xl">
							{description}
						</p>
					) : null}

					{ctas?.length ? (
						<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
							{ctas.slice(0, 2).map((cta, index) => (
								<SanityLink
									key={cta._key}
									link={cta.link as SanityLinkType}
									className={CTA_STYLE_CLASSES[index] ?? CTA_STYLE_CLASSES[1]}
								/>
							))}
						</div>
					) : null}
				</header>
			</div>
		</section>
	)
}
