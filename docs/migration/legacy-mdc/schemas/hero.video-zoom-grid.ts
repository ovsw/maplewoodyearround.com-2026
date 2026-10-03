import { defineArrayMember, defineField, defineType } from 'sanity'
import { VscDeviceCameraVideo } from 'react-icons/vsc'
import { count, getBlockText } from '@/lib/utils'

export default defineType({
	name: 'hero.video-zoom-grid',
	title: 'Hero (video zoom grid)',
	type: 'object',
	icon: VscDeviceCameraVideo,
	groups: [
		{ name: 'content', default: true },
		{ name: 'video' },
		{ name: 'desktopGrid' },
		{ name: 'mobileGrid' },
	],
	fields: [
		defineField({
			name: 'heading',
			description:
				'Select text and use "Highlight" to color specific words in the heading.',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
					marks: {
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Emphasis', value: 'em' },
							{ title: 'Highlight', value: 'highlight' },
						],
						annotations: [],
					},
				}),
			],
			validation: (rule) => rule.required().min(1).max(1),
			group: 'content',
		}),
		defineField({
			name: 'description',
			type: 'text',
			rows: 3,
			group: 'content',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-actions',
			type: 'array',
			of: [{ type: 'cta' }],
			validation: (rule) => rule.max(2),
			group: 'content',
		}),
		defineField({
			name: 'videoMp4Url',
			title: 'Video MP4 URL',
			type: 'url',
			validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] }),
			group: 'video',
		}),
		defineField({
			name: 'videoWebmUrl',
			title: 'Video WebM URL',
			type: 'url',
			validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
			group: 'video',
		}),
		defineField({
			name: 'posterUrl',
			title: 'Poster URL',
			type: 'url',
			validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] }),
			group: 'video',
		}),
		defineField({
			name: 'gridImages',
			title: 'Desktop grid images',
			description:
				'Provide exactly 8 images. The center tile is automatically the playing video.',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							type: 'string',
						}),
					],
				}),
			],
			validation: (rule) => rule.required().min(8).max(8),
			group: 'desktopGrid',
		}),
		defineField({
			name: 'mobileImages',
			title: 'Mobile grid images',
			description:
				'Provide exactly 2 images (top + bottom). The middle tile is automatically the playing video.',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							type: 'string',
						}),
					],
				}),
			],
			validation: (rule) => rule.required().min(2).max(2),
			group: 'mobileGrid',
		}),
	],
	preview: {
		select: {
			heading: 'heading',
			gridImages: 'gridImages',
		},
		prepare: ({ heading, gridImages }) => ({
			title: getBlockText(heading) || 'Video zoom grid hero',
			subtitle: count(gridImages, 'image'),
			media: VscDeviceCameraVideo,
		}),
	},
})
