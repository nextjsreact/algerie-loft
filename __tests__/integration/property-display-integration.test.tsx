import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { PropertyCard, PropertyGrid } from '@/components/ui/property-card'
import { SearchInput, useSearch } from '@/components/ui/search'
import { Filters, useFilters } from '@/components/ui/filters'

// Mock the modal components
jest.mock('@/components/ui/modal', () => ({
  ImageModal: ({ isOpen, title }: { isOpen: boolean; title: string }) => 
    isOpen ? <div data-testid="image-modal">{title}</div> : null,
  ContactModal: ({ isOpen, propertyTitle }: { isOpen: boolean; propertyTitle: string }) => 
    isOpen ? <div data-testid="contact-modal">{propertyTitle}</div> : null,
}))

// Mock the responsive image component
jest.mock('@/components/ui/responsive-image', () => ({
  PropertyImage: ({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) => (
    <img src={src} alt={alt} onClick={onClick} data-testid="property-image" />
  ),
}))

// Extended mock property data for integration testing
const mockProperties = [
  {
    id: '1',
    title: 'Modern Apartment Downtown',
    description: 'Beautiful modern apartment in the city center with all amenities',
    location: {
      address: '123 Main St',
      city: 'Algiers',
      coordinates: [36.7538, 3.0588] as [number, number]
    },
    images: ['/image1.jpg', '/image1-2.jpg'],
    features: {
      bedrooms: 2,
      bathrooms: 1,
      area: 85,
      type: 'apartment'
    },
    amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Balcony'],
    price: {
      amount: 15000,
      currency: 'DZD',
      period: 'month'
    },
    status: 'available' as const,
    isHighlighted: false
  },
  {
    id: '2',
    title: 'Luxury Villa Seaside',
    description: 'Stunning villa with ocean views and private pool',
    location: {
      address: '456 Beach Rd',
      city: 'Oran',
      coordinates: [35.6911, -0.6417] as [number, number]
    },
    images: ['/image2.jpg', '/image2-2.jpg', '/image2-3.jpg'],
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      type: 'villa'
    },
    amenities: ['Pool', 'Garden', 'WiFi', 'Parking', 'Security'],
    price: {
      amount: 45000,
      currency: 'DZD',
      period: 'month'
    },
    status: 'available' as const,
    isHighlighted: true
  },
  {
    id: '3',
    title: 'Cozy Studio Central',
    description: 'Perfect studio for students near university',
    location: {
      address: '789 University Ave',
      city: 'Algiers',
      coordinates: [36.7538, 3.0588] as [number, number]
    },
    images: ['/image3.jpg'],
    features: {
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      type: 'studio'
    },
    amenities: ['WiFi', 'Furnished'],
    price: {
      amount: 8000,
      currency: 'DZD',
      period: 'month'
    },
    status: 'rented' as const,
    isHighlighted: false
  },
  {
    id: '4',
    title: 'Family House Suburbs',
    description: 'Spacious family house in quiet neighborhood',
    location: {
      address: '321 Suburb Lane',
      city: 'Constantine',
      coordinates: [36.3650, 6.6147] as [number, number]
    },
    images: ['/image4.jpg', '/image4-2.jpg'],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      type: 'house'
    },
    amenities: ['Garden', 'Garage', 'WiFi'],
    price: {
      amount: 25000,
      currency: 'DZD',
      period: 'month'
    },
    status: 'available' as const,
    isHighlighted: false
  }
]

// Comprehensive Property Management Component for Integration Testing
function PropertyManagementSystem() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({})
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  // Filter functions
  const filterFunctions = {
    type: (item: any, values: string[]) => values.includes(item.features.type),
    city: (item: any, values: string[]) => values.includes(item.location.city),
    status: (item: any, values: string[]) => values.includes(item.status),
    bedrooms: (item: any, values: string[]) => values.includes(item.features.bedrooms.toString()),
    priceRange: (item: any, values: string[]) => {
      const price = item.price?.amount || 0
      return values.some(range => {
        switch (range) {
          case 'low': return price < 15000
          case 'medium': return price >= 15000 && price < 35000
          case 'high': return price >= 35000
          default: return true
        }
      })
    }
  }

  // Apply filters first, then search
  const filteredProperties = useFilters(mockProperties, activeFilters, filterFunctions)
  const finalResults = useSearch(filteredProperties, ['title', 'description', 'location.city'], searchTerm)

  const filterGroups = [
    {
      key: 'type',
      label: 'Property Type',
      options: [
        { label: 'Apartment', value: 'apartment', count: 1 },
        { label: 'Villa', value: 'villa', count: 1 },
        { label: 'Studio', value: 'studio', count: 1 },
        { label: 'House', value: 'house', count: 1 }
      ]
    },
    {
      key: 'city',
      label: 'City',
      options: [
        { label: 'Algiers', value: 'Algiers', count: 2 },
        { label: 'Oran', value: 'Oran', count: 1 },
        { label: 'Constantine', value: 'Constantine', count: 1 }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Available', value: 'available', count: 3 },
        { label: 'Rented', value: 'rented', count: 1 }
      ]
    },
    {
      key: 'bedrooms',
      label: 'Bedrooms',
      options: [
        { label: '1 Bedroom', value: '1', count: 1 },
        { label: '2 Bedrooms', value: '2', count: 1 },
        { label: '3 Bedrooms', value: '3', count: 1 },
        { label: '4+ Bedrooms', value: '4', count: 1 }
      ]
    },
    {
      key: 'priceRange',
      label: 'Price Range',
      options: [
        { label: 'Under 15,000 DZD', value: 'low', count: 1 },
        { label: '15,000 - 35,000 DZD', value: 'medium', count: 2 },
        { label: 'Over 35,000 DZD', value: 'high', count: 1 }
      ]
    }
  ]

  const handleFilterChange = (filterKey: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: values
    }))
  }

  const handleClearAll = () => {
    setActiveFilters({})
  }

  return (
    <div data-testid="property-management-system">
      <div className="controls" data-testid="property-controls">
        <SearchInput
          placeholder="Search properties..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        
        <Filters
          filterGroups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />
        
        <div className="view-controls">
          <button 
            onClick={() => setViewMode('grid')}
            data-testid="grid-view-button"
            className={viewMode === 'grid' ? 'active' : ''}
          >
            Grid View
          </button>
          <button 
            onClick={() => setViewMode('list')}
            data-testid="list-view-button"
            className={viewMode === 'list' ? 'active' : ''}
          >
            List View
          </button>
        </div>
      </div>

      <div className="results-info" data-testid="results-info">
        <span>Showing {finalResults.length} of {mockProperties.length} properties</span>
      </div>

      <div className="property-display" data-testid="property-display">
        <PropertyGrid 
          properties={finalResults} 
          variant={viewMode}
        />
      </div>
    </div>
  )
}

describe('Property Display Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks()
  })

  describe('Complete Property Management System', () => {
    it('renders all components correctly', () => {
      render(<PropertyManagementSystem />)
      
      expect(screen.getByTestId('property-management-system')).toBeInTheDocument()
      expect(screen.getByTestId('property-controls')).toBeInTheDocument()
      expect(screen.getByTestId('property-display')).toBeInTheDocument()
      expect(screen.getByTestId('results-info')).toBeInTheDocument()
      
      // Check initial state shows all properties
      expect(screen.getByText('Showing 4 of 4 properties')).toBeInTheDocument()
    })

    it('displays all properties initially', () => {
      render(<PropertyManagementSystem />)
      
      expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
      expect(screen.getByText('Luxury Villa Seaside')).toBeInTheDocument()
      expect(screen.getByText('Cozy Studio Central')).toBeInTheDocument()
      expect(screen.getByText('Family House Suburbs')).toBeInTheDocument()
    })

    it('switches between grid and list view modes', async () => {
      render(<PropertyManagementSystem />)
      
      // Initially in grid view
      expect(screen.getByTestId('grid-view-button')).toHaveClass('active')
      
      // Switch to list view
      const listViewButton = screen.getByTestId('list-view-button')
      fireEvent.click(listViewButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('list-view-button')).toHaveClass('active')
        // In list view, should show "View Details" buttons
        expect(screen.getAllByText('View Details')).toHaveLength(4)
      })
    })
  })

  describe('Search Integration', () => {
    it('filters properties based on search term', async () => {
      render(<PropertyManagementSystem />)
      
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'Modern' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
        expect(screen.queryByText('Luxury Villa Seaside')).not.toBeInTheDocument()
      })
    })

    it('searches across multiple fields', async () => {
      render(<PropertyManagementSystem />)
      
      const searchInput = screen.getByPlaceholderText('Search properties...')
      
      // Search by city
      fireEvent.change(searchInput, { target: { value: 'Oran' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Luxury Villa Seaside')).toBeInTheDocument()
      })
      
      // Search by description
      fireEvent.change(searchInput, { target: { value: 'university' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Cozy Studio Central')).toBeInTheDocument()
      })
    })

    it('shows no results message when search yields no matches', async () => {
      render(<PropertyManagementSystem />)
      
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent property' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 0 of 4 properties')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Integration', () => {
    it('filters properties by type', async () => {
      render(<PropertyManagementSystem />)
      
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
      fireEvent.click(apartmentOption)
      
      // Close dropdown
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
        expect(screen.queryByText('Luxury Villa Seaside')).not.toBeInTheDocument()
      })
    })

    it('filters properties by multiple criteria', async () => {
      render(<PropertyManagementSystem />)
      
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      // Filter by city (Algiers) and status (available)
      const algiersOption = screen.getByRole('menuitemcheckbox', { name: /algiers/i })
      fireEvent.click(algiersOption)
      
      const availableOption = screen.getByRole('menuitemcheckbox', { name: /available/i })
      fireEvent.click(availableOption)
      
      // Close dropdown
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
        // Studio is in Algiers but rented, so shouldn't appear
        expect(screen.queryByText('Cozy Studio Central')).not.toBeInTheDocument()
      })
    })

    it('shows active filter badges', async () => {
      render(<PropertyManagementSystem />)
      
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
      fireEvent.click(apartmentOption)
      
      // Close dropdown
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Apartment')).toBeInTheDocument() // Filter badge
        expect(screen.getByText('1')).toBeInTheDocument() // Filter count in button
      })
    })

    it('clears all filters when clear all is clicked', async () => {
      render(<PropertyManagementSystem />)
      
      // Apply a filter first
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
      fireEvent.click(apartmentOption)
      
      // Close dropdown
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
      })
      
      // Clear all filters
      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      fireEvent.click(clearAllButton)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 4 properties')).toBeInTheDocument()
        expect(screen.queryByText('Apartment')).not.toBeInTheDocument() // Badge removed
      })
    })
  })

  describe('Combined Search and Filter Integration', () => {
    it('applies both search and filters together', async () => {
      render(<PropertyManagementSystem />)
      
      // First apply a filter
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      const algiersOption = screen.getByRole('menuitemcheckbox', { name: /algiers/i })
      fireEvent.click(algiersOption)
      
      // Close dropdown
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 properties')).toBeInTheDocument()
      })
      
      // Then apply search
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'Modern' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
        expect(screen.queryByText('Cozy Studio Central')).not.toBeInTheDocument()
      })
    })

    it('updates results when search is cleared but filters remain', async () => {
      render(<PropertyManagementSystem />)
      
      // Apply filter and search
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      
      const availableOption = screen.getByRole('menuitemcheckbox', { name: /available/i })
      fireEvent.click(availableOption)
      
      fireEvent.click(document.body)
      
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'Modern' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
      })
      
      // Clear search but keep filter
      const clearButton = screen.getByRole('button', { name: '' }) // X button in search
      fireEvent.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 4 properties')).toBeInTheDocument() // All available properties
        expect(screen.queryByText('Cozy Studio Central')).not.toBeInTheDocument() // Rented property filtered out
      })
    })
  })

  describe('Property Card Interactions', () => {
    it('opens image modal when property image is clicked', async () => {
      render(<PropertyManagementSystem />)
      
      const propertyImages = screen.getAllByTestId('property-image')
      fireEvent.click(propertyImages[0])
      
      await waitFor(() => {
        expect(screen.getByTestId('image-modal')).toBeInTheDocument()
      })
    })

    it('opens contact modal when contact button is clicked', async () => {
      render(<PropertyManagementSystem />)
      
      const contactButtons = screen.getAllByRole('button', { name: /contact/i })
      fireEvent.click(contactButtons[0])
      
      await waitFor(() => {
        expect(screen.getByTestId('contact-modal')).toBeInTheDocument()
      })
    })

    it('displays property information correctly in both view modes', async () => {
      render(<PropertyManagementSystem />)
      
      // Check grid view
      expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
      expect(screen.getByText('123 Main St, Algiers')).toBeInTheDocument()
      expect(screen.getByText('15,000 DZD')).toBeInTheDocument()
      
      // Switch to list view
      const listViewButton = screen.getByTestId('list-view-button')
      fireEvent.click(listViewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
        expect(screen.getByText('123 Main St, Algiers')).toBeInTheDocument()
        expect(screen.getByText('15,000 DZD')).toBeInTheDocument()
        expect(screen.getAllByText('View Details')).toHaveLength(4)
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles empty search results gracefully', async () => {
      render(<PropertyManagementSystem />)
      
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 0 of 4 properties')).toBeInTheDocument()
        expect(screen.getByTestId('property-display')).toBeInTheDocument()
      })
    })

    it('handles rapid filter changes', async () => {
      render(<PropertyManagementSystem />)
      
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      
      // Rapidly toggle filters
      fireEvent.click(filtersButton)
      const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
      fireEvent.click(apartmentOption)
      fireEvent.click(apartmentOption) // Toggle off
      fireEvent.click(apartmentOption) // Toggle on again
      
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
      })
    })

    it('maintains state consistency during complex interactions', async () => {
      render(<PropertyManagementSystem />)
      
      // Apply search
      const searchInput = screen.getByPlaceholderText('Search properties...')
      fireEvent.change(searchInput, { target: { value: 'apartment' } })
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
      })
      
      // Apply filter
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)
      const availableOption = screen.getByRole('menuitemcheckbox', { name: /available/i })
      fireEvent.click(availableOption)
      fireEvent.click(document.body)
      
      // Change view mode
      const listViewButton = screen.getByTestId('list-view-button')
      fireEvent.click(listViewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 properties')).toBeInTheDocument()
        expect(screen.getByText('View Details')).toBeInTheDocument()
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument()
      })
    })
  })
})