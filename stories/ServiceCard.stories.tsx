import type { Meta, StoryObj } from '@storybook/react'
import { ServiceCard, ServiceGrid } from '@/components/ui/service-card'

const mockService = {
  id: '1',
  title: 'Property Management',
  description: 'Complete property management services for your rental properties including tenant screening, rent collection, and maintenance coordination.',
  longDescription: 'Our comprehensive property management service takes care of every aspect of your rental property. From finding and screening quality tenants to handling maintenance requests and ensuring legal compliance, we provide end-to-end solutions that maximize your rental income while minimizing your stress.',
  icon: '/placeholder.svg',
  features: [
    'Tenant screening and selection',
    'Rent collection and accounting',
    'Maintenance and repairs coordination',
    'Legal compliance and documentation',
    'Financial reporting and analytics',
    '24/7 emergency support'
  ],
  benefits: [
    'Maximize rental income',
    'Reduce vacancy periods',
    'Professional tenant relations',
    'Peace of mind'
  ],
  pricing: {
    startingPrice: 8000,
    currency: 'DZD',
    period: 'month',
    priceLabel: 'Starting from'
  },
  ctaText: 'Learn More',
  ctaLink: '/services/property-management',
  isPopular: true,
  isNew: false
}

const mockServices = [
  mockService,
  {
    ...mockService,
    id: '2',
    title: 'Maintenance Services',
    description: 'Professional maintenance and repair services to keep your properties in excellent condition.',
    icon: '/placeholder.svg',
    features: [
      'Regular property inspections',
      'Preventive maintenance',
      'Emergency repairs',
      'Vendor management'
    ],
    pricing: {
      startingPrice: 3000,
      currency: 'DZD',
      period: 'month'
    },
    isPopular: false,
    isNew: true
  },
  {
    ...mockService,
    id: '3',
    title: 'Tenant Relations',
    description: 'Expert tenant communication and relationship management services.',
    icon: '/placeholder.svg',
    features: [
      'Tenant communication',
      'Lease management',
      'Conflict resolution',
      'Move-in/move-out coordination'
    ],
    pricing: {
      priceLabel: 'Contact us for pricing',
      currency: 'DZD'
    },
    isPopular: false,
    isNew: false
  }
]

const meta: Meta<typeof ServiceCard> = {
  title: 'UI/ServiceCard',
  component: ServiceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'detailed', 'pricing'],
    },
    showCta: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    service: mockService,
  },
}

export const Compact: Story = {
  args: {
    service: mockService,
    variant: 'compact',
  },
}

export const Detailed: Story = {
  args: {
    service: mockService,
    variant: 'detailed',
  },
}

export const Pricing: Story = {
  args: {
    service: mockService,
    variant: 'pricing',
  },
}

export const NewService: Story = {
  args: {
    service: {
      ...mockService,
      title: 'New Service',
      isNew: true,
      isPopular: false,
    },
    variant: 'detailed',
  },
}

export const WithoutPricing: Story = {
  args: {
    service: {
      ...mockService,
      pricing: undefined,
      title: 'Consultation Service'
    },
  },
}

export const CustomPricing: Story = {
  args: {
    service: {
      ...mockService,
      pricing: {
        priceLabel: 'Contact us for quote',
        currency: 'DZD'
      },
      title: 'Custom Service'
    },
    variant: 'pricing',
  },
}

export const NoCta: Story = {
  args: {
    service: mockService,
    showCta: false,
  },
}

export const ServiceGridStory: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <ServiceGrid services={mockServices} />
    </div>
  ),
  name: 'Service Grid',
}

export const ServiceGridCompact: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <ServiceGrid services={mockServices} variant="compact" />
    </div>
  ),
  name: 'Service Grid Compact',
}

export const ServiceGridDetailed: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <ServiceGrid services={mockServices} variant="detailed" />
    </div>
  ),
  name: 'Service Grid Detailed',
}

export const ServiceGridPricing: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <ServiceGrid services={mockServices} variant="pricing" />
    </div>
  ),
  name: 'Service Grid Pricing',
}