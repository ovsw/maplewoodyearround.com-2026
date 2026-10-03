import { defineArrayMember, defineField, defineType } from 'sanity'
import { VscDeviceCameraVideo } from 'react-icons/vsc'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'hero.video',
	title: 'Hero (video)',
	type: 'object',
	icon: VscDeviceCameraVideo,
	groups: [
		{ name: 'content', default: true },
		{ name: 'video' },
		{ name: 'options' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
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
			name: 'highlightText',
			title: 'Highlighted text (deprecated)',
			type: 'string',
			deprecated: {
				reason:
					'Use highlighted spans directly in the heading field with the Highlight decorator.',
			},
			readOnly: true,
			hidden: ({ value }) => value === undefined,
			initialValue: undefined,
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
			name: 'overlayOpacity',
			type: 'number',
			initialValue: 0.45,
			validation: (rule) => rule.required().min(0).max(1),
			group: 'options',
		}),
	],
	preview: {
		select: {
			heading: 'heading',
		},
		prepare: ({ heading }) => {
			const title =
				typeof heading === 'string' ? heading : getBlockText(heading)

			return {
				title: title || 'Video hero',
				subtitle: 'Hero (video)',
				media: VscDeviceCameraVideo,
			}
		},
	},
})
