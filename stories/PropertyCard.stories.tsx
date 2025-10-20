import type { Meta, StoryObj } from '@storybook/react'
import { PropertyCard, PropertyGrid } from '@/components/ui/property-card'

const mockProperty = {
  id: '1',
  title: 'Beautiful Apartment in Algiers',
  description: 'A stunning modern apartment in the heart of Algiers with panoramic city views. This property features high-end finishes and premium amenities.',
  location: {
    address: '123 Rue Didouche Mourad',
    city: 'Algiers',
    coordinates: [36.7538, 3.0588] as [number, number]
  },
  images: [
    '/placeholder.jpg',
    '/placeholder.jpg',
    '/placeholder.jpg',
    '/placeholder.jpg'
  ],
  features: {
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: 'apartment'
  },
  amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Balcony', 'Security', 'Elevator'],
  price: {
    amount: 25000,
    currency: 'DZD',
    period: 'month'
  },
  status: 'available' as const,
  isHighlighted: false
}

const mockProperties = [
  mockProperty,
  {
    ...mockProperty,
    id: '2',
    title: 'Luxury Villa in Hydra',
    location: { ...mockProperty.location, address: '456 Chemin des Glycines', city: 'Hydra' },
    features: { ...mockProperty.features, bedrooms: 5, bathrooms: 4, area: 300 },
    price: { ...mockProperty.price, amount: 80000 },
    status: 'rented' as const,
    isHighlighted: true
  },
  {
    ...mockProperty,
    id: '3',
    title: 'Cozy Studio Downtown',
    features: { ...mockProperty.features, bedrooms: 1, bathrooms: 1, area: 45 },
    price: { ...mockProperty.price, amount: 12000 },
    status: 'maintenance' as const
  }
]

const meta: Meta<typeof PropertyCard> = {
  title: 'UI/PropertyCard',
  component: PropertyCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['grid', 'list', 'featured'],
    },
    showContactButton: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    property: mockProperty,
  },
}

export const Featured: Story = {
  args: {
    property: { ...mockProperty, isHighlighted: true },
    variant: 'featured',
  },
}

export const ListView: Story = {
  args: {
    property: mockProperty,
    variant: 'list',
  },
}

export const RentedProperty: Story = {
  args: {
    property: {
      ...mockProperty,
      status: 'rented',
      title: 'Rented Apartment'
    },
  },
}

export const MaintenanceProperty: Story = {
  args: {
    property: {
      ...mockProperty,
      status: 'maintenance',
      title: 'Property Under Maintenance'
    },
  },
}

export const WithoutPrice: Story = {
  args: {
    property: {
      ...mockProperty,
      price: undefined,
      title: 'Property Without Price'
    },
  },
}

export const NoContactButton: Story = {
  args: {
    property: mockProperty,
    showContactButton: false,
  },
}

export const LuxuryVilla: Story = {
  args: {
    property: {
      ...mockProperty,
      title: 'Luxury Villa with Pool',
      description: 'Exceptional luxury villa with private pool, garden, and stunning mountain views. Perfect for families seeking premium living.',
      features: {
        bedrooms: 6,
        bathrooms: 5,
        area: 450,
        type: 'villa'
      },
      amenities: ['Private Pool', 'Garden', 'Garage', 'Security System', 'Maid Room', 'BBQ Area', 'Mountain View'],
      price: {
        amount: 150000,
        currency: 'DZD',
        period: 'month'
      },
      isHighlighted: true
    },
    variant: 'featured',
  },
}

export const PropertyGridStory: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <PropertyGrid properties={mockProperties} />
    </div>
  ),
  name: 'Property Grid',
}

export const PropertyListStory: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <PropertyGrid properties={mockProperties} variant="list" />
    </div>
  ),
  name: 'Property List',
}