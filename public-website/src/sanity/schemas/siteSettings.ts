import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ar', title: 'Arabic', type: 'string' },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'text' },
        { name: 'en', title: 'English', type: 'text' },
        { name: 'ar', title: 'Arabic', type: 'text' },
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {
          name: 'email',
          title: 'Email',
          type: 'string',
          validation: (Rule) => Rule.email(),
        },
        {
          name: 'phone',
          title: 'Phone',
          type: 'string',
        },
        {
          name: 'whatsapp',
          title: 'WhatsApp',
          type: 'string',
        },
        {
          name: 'address',
          title: 'Address',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
        {
          name: 'businessHours',
          title: 'Business Hours',
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
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'url',
        },
        {
          name: 'youtube',
          title: 'YouTube',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'navigation',
      title: 'Navigation Menu',
      type: 'object',
      fields: [
        {
          name: 'mainMenu',
          title: 'Main Menu Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Label',
                  type: 'object',
                  fields: [
                    { name: 'fr', title: 'French', type: 'string' },
                    { name: 'en', title: 'English', type: 'string' },
                    { name: 'ar', title: 'Arabic', type: 'string' },
                  ],
                },
                {
                  name: 'href',
                  title: 'Link',
                  type: 'string',
                },
                {
                  name: 'order',
                  title: 'Order',
                  type: 'number',
                },
              ],
            },
          ],
        },
        {
          name: 'footerMenu',
          title: 'Footer Menu Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Label',
                  type: 'object',
                  fields: [
                    { name: 'fr', title: 'French', type: 'string' },
                    { name: 'en', title: 'English', type: 'string' },
                    { name: 'ar', title: 'Arabic', type: 'string' },
                  ],
                },
                {
                  name: 'href',
                  title: 'Link',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'Default SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'defaultTitle',
          title: 'Default SEO Title',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'string' },
            { name: 'en', title: 'English', type: 'string' },
            { name: 'ar', title: 'Arabic', type: 'string' },
          ],
        },
        {
          name: 'defaultDescription',
          title: 'Default SEO Description',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
        {
          name: 'defaultOgImage',
          title: 'Default Open Graph Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
    defineField({
      name: 'analytics',
      title: 'Analytics & Tracking',
      type: 'object',
      fields: [
        {
          name: 'googleAnalyticsId',
          title: 'Google Analytics ID',
          type: 'string',
        },
        {
          name: 'facebookPixelId',
          title: 'Facebook Pixel ID',
          type: 'string',
        },
        {
          name: 'gtmId',
          title: 'Google Tag Manager ID',
          type: 'string',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title.fr',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Site Settings',
      }
    },
  },
})