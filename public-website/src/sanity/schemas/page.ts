import { defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
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
      name: 'content',
      title: 'Content',
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
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'SEO Title',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'string' },
            { name: 'en', title: 'English', type: 'string' },
            { name: 'ar', title: 'Arabic', type: 'string' },
          ],
        },
        {
          name: 'description',
          title: 'SEO Description',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'array', of: [{ type: 'string' }] },
            { name: 'en', title: 'English', type: 'array', of: [{ type: 'string' }] },
            { name: 'ar', title: 'Arabic', type: 'array', of: [{ type: 'string' }] },
          ],
        },
        {
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title.fr',
      subtitle: 'slug.current',
    },
  },
})