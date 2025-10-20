import { defineField, defineType } from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ar', title: 'Arabic', type: 'string' },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title.fr',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'text' },
        { name: 'en', title: 'English', type: 'text' },
        { name: 'ar', title: 'Arabic', type: 'text' },
      ],
    }),
    defineField({
      name: 'longDescription',
      title: 'Detailed Description',
      type: 'object',
      fields: [
        {
          name: 'fr',
          title: 'French Content',
          type: 'array',
          of: [{ type: 'block' }],
        },
        {
          name: 'en',
          title: 'English Content',
          type: 'array',
          of: [{ type: 'block' }],
        },
        {
          name: 'ar',
          title: 'Arabic Content',
          type: 'array',
          of: [{ type: 'block' }],
        },
      ],
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Lucide icon name (e.g., "home", "key", "shield")',
    }),
    defineField({
      name: 'image',
      title: 'Service Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'string' },
            { name: 'en', title: 'English', type: 'string' },
            { name: 'ar', title: 'Arabic', type: 'string' },
          ],
        },
      ],
    }),
    defineField({
      name: 'features',
      title: 'Key Features',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'array', of: [{ type: 'string' }] },
        { name: 'en', title: 'English', type: 'array', of: [{ type: 'string' }] },
        { name: 'ar', title: 'Arabic', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
    defineField({
      name: 'pricing',
      title: 'Pricing Information',
      type: 'object',
      fields: [
        {
          name: 'type',
          title: 'Pricing Type',
          type: 'string',
          options: {
            list: [
              { title: 'Fixed Price', value: 'fixed' },
              { title: 'Percentage', value: 'percentage' },
              { title: 'Custom Quote', value: 'custom' },
            ],
          },
        },
        {
          name: 'amount',
          title: 'Amount/Percentage',
          type: 'number',
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          initialValue: 'DZD',
        },
        {
          name: 'description',
          title: 'Pricing Description',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
      ],
    }),
    defineField({
      name: 'ctaText',
      title: 'Call to Action Text',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ar', title: 'Arabic', type: 'string' },
      ],
    }),
    defineField({
      name: 'ctaLink',
      title: 'Call to Action Link',
      type: 'string',
      description: 'Internal link (e.g., "/contact") or external URL',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title.fr',
      media: 'image',
      subtitle: 'description.fr',
    },
  },
})