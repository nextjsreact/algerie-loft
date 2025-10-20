import { defineField, defineType } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
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
      name: 'excerpt',
      title: 'Excerpt',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'text' },
        { name: 'en', title: 'English', type: 'text' },
        { name: 'ar', title: 'Arabic', type: 'text' },
      ],
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
          of: [
            { type: 'block' },
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                },
                {
                  name: 'caption',
                  title: 'Caption',
                  type: 'string',
                },
              ],
            },
          ],
        },
        {
          name: 'en',
          title: 'English Content',
          type: 'array',
          of: [
            { type: 'block' },
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                },
                {
                  name: 'caption',
                  title: 'Caption',
                  type: 'string',
                },
              ],
            },
          ],
        },
        {
          name: 'ar',
          title: 'Arabic Content',
          type: 'array',
          of: [
            { type: 'block' },
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                },
                {
                  name: 'caption',
                  title: 'Caption',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
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
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Property Management', value: 'property-management' },
          { title: 'Real Estate Tips', value: 'real-estate-tips' },
          { title: 'Market Analysis', value: 'market-analysis' },
          { title: 'Company News', value: 'company-news' },
          { title: 'Client Stories', value: 'client-stories' },
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'array', of: [{ type: 'string' }] },
        { name: 'en', title: 'English', type: 'array', of: [{ type: 'string' }] },
        { name: 'ar', title: 'Arabic', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
        {
          name: 'bio',
          title: 'Bio',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
        {
          name: 'avatar',
          title: 'Avatar',
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
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title.fr',
      media: 'featuredImage',
      subtitle: 'publishedAt',
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
      }
    },
  },
})