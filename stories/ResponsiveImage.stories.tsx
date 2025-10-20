import type { Meta, StoryObj } from '@storybook/react'
import { ResponsiveImage, HeroImage, PropertyImage, ServiceIcon } from '@/components/ui/responsive-image'

const meta: Meta<typeof ResponsiveImage> = {
  title: 'UI/ResponsiveImage',
  component: ResponsiveImage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: { type: 'boolean' },
    },
    quality: {
      control: { type: 'range', min: 1, max: 100 },
    },
    fill: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Default image',
    width: 400,
    height: 300,
  },
}

export const WithFallback: Story = {
  args: {
    src: '/broken-image.jpg',
    alt: 'Broken image with fallback',
    width: 400,
    height: 300,
    fallbackSrc: '/placeholder.jpg',
  },
}

export const HighQuality: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'High quality image',
    width: 400,
    height: 300,
    quality: 95,
  },
}

export const Priority: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Priority image',
    width: 400,
    height: 300,
    priority: true,
  },
}

export const WithBlurPlaceholder: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Image with blur placeholder',
    width: 400,
    height: 300,
    placeholder: 'blur',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  },
}

export const CustomClassName: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Custom styled image',
    width: 400,
    height: 300,
    className: 'rounded-lg shadow-lg border-4 border-blue-500',
  },
}

export const HeroImageStory: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <HeroImage
        src="/placeholder.jpg"
        alt="Hero image"
      />
    </div>
  ),
  name: 'Hero Image',
}

export const PropertyImageStory: Story = {
  render: () => (
    <div className="w-80">
      <PropertyImage
        src="/placeholder.jpg"
        alt="Property image"
      />
    </div>
  ),
  name: 'Property Image',
}

export const ServiceIconStory: Story = {
  render: () => (
    <div className="flex gap-4">
      <ServiceIcon
        src="/placeholder.svg"
        alt="Service icon 1"
      />
      <ServiceIcon
        src="/placeholder.svg"
        alt="Service icon 2"
      />
      <ServiceIcon
        src="/placeholder.svg"
        alt="Service icon 3"
      />
    </div>
  ),
  name: 'Service Icons',
}

export const LoadingState: Story = {
  render: () => (
    <div className="w-80">
      <ResponsiveImage
        src="/very-slow-loading-image.jpg"
        alt="Loading image"
        width={320}
        height={240}
      />
    </div>
  ),
  name: 'Loading State',
}

export const ErrorState: Story = {
  render: () => (
    <div className="w-80">
      <ResponsiveImage
        src="/definitely-broken-image.jpg"
        alt="Error image"
        width={320}
        height={240}
      />
    </div>
  ),
  name: 'Error State',
}

export const ResponsiveSizes: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <ResponsiveImage
        src="/placeholder.jpg"
        alt="Responsive image"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="aspect-video"
      />
    </div>
  ),
  name: 'Responsive Sizes',
}