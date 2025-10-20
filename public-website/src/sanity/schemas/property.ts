import { defineField, defineType } from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Property',
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
      title: 'Description',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'text' },
        { name: 'en', title: 'English', type: 'text' },
        { name: 'ar', title: 'Arabic', type: 'text' },
      ],
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
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
            {
              name: 'caption',
              title: 'Caption',
              type: 'object',
              fields: [
                { name: 'fr', title: 'French', type: 'string' },
                { name: 'en', title: 'English', type: 'string' },
                { name: 'ar', title: 'Arabic', type: 'string' },
              ],
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).max(10),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        {
          name: 'address',
          title: 'Address',
          type: 'string',
        },
        {
          name: 'city',
          title: 'City',
          type: 'string',
        },
        {
          name: 'coordinates',
          title: 'Coordinates',
          type: 'geopoint',
        },
      ],
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'object',
      fields: [
        { name: 'fr', title: 'French', type: 'array', of: [{ type: 'string' }] },
        { name: 'en', title: 'English', type: 'array', of: [{ type: 'string' }] },
        { name: 'ar', title: 'Arabic', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
    defineField({
      name: 'type',
      title: 'Property Type',
      type: 'string',
      options: {
        list: [
          { title: 'Apartment', value: 'apartment' },
          { title: 'Villa', value: 'villa' },
          { title: 'Studio', value: 'studio' },
          { title: 'Loft', value: 'loft' },
          { title: 'House', value: 'house' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'object',
      fields: [
        {
          name: 'bedrooms',
          title: 'Bedrooms',
          type: 'number',
        },
        {
          name: 'bathrooms',
          title: 'Bathrooms',
          type: 'number',
        },
        {
          name: 'area',
          title: 'Area (m²)',
          type: 'number',
        },
        {
          name: 'capacity',
          title: 'Guest Capacity',
          type: 'number',
        },
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Inactive', value: 'inactive' },
          { title: 'Featured', value: 'featured' },
        ],
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'testimonial',
      title: 'Client Testimonial',
      type: 'object',
      fields: [
        {
          name: 'content',
          title: 'Testimonial Content',
          type: 'object',
          fields: [
            { name: 'fr', title: 'French', type: 'text' },
            { name: 'en', title: 'English', type: 'text' },
            { name: 'ar', title: 'Arabic', type: 'text' },
          ],
        },
        {
          name: 'clientName',
          title: 'Client Name',
          type: 'string',
        },
        {
          name: 'clientPhoto',
          title: 'Client Photo',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title.fr',
      media: 'images.0',
      subtitle: 'location.city',
    },
  },
})