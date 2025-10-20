import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearch, useFilters } from '@/components/ui/search'
import { Filters } from '@/components/ui/filters'
import { SearchInput } from '@/components/ui/search'

// Mock property data for testing
const mockProperties = [
  {
    id: '1',
    title: 'Modern Apartment Downtown',
    description: 'Beautiful modern apartment in the city center',
    location: {
      address: '123 Main St',
      city: 'Algiers',
      coordinates: [36.7538, 3.0588] as [number, number]
    },
    images: ['/image1.jpg'],
    features: {
      bedrooms: 2,
      bathrooms: 1,
      area: 85,
      type: 'apartment'
    },
    amenities: ['WiFi', 'Air Conditioning', 'Parking'],
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
    description: 'Stunning villa with ocean views',
    location: {
      address: '456 Beach Rd',
      city: 'Oran',
      coordinates: [35.6911, -0.6417] as [number, number]
    },
    images: ['/image2.jpg'],
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      type: 'villa'
    },
    amenities: ['Pool', 'Garden', 'WiFi', 'Parking'],
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
    description: 'Perfect studio for students',
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
  }
]

// Test component that uses search functionality
function TestSearchComponent({ onResults }: { onResults: (results: any[]) => void }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const searchResults = useSearch(mockProperties, ['title', 'description', 'location.city'], searchTerm)
  
  React.useEffect(() => {
    onResults(searchResults)
  }, [searchResults, onResults])

  return (
    <SearchInput
      placeholder="Search properties..."
      value={searchTerm}
      onChange={setSearchTerm}
    />
  )
}

// Test component that uses filter functionality
function TestFilterComponent({ onResults }: { onResults: (results: any[]) => void }) {
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({})
  
  const filterFunctions = {
    type: (item: any, values: string[]) => values.includes(item.features.type),
    city: (item: any, values: string[]) => values.includes(item.location.city),
    status: (item: any, values: string[]) => values.includes(item.status),
    bedrooms: (item: any, values: string[]) => values.includes(item.features.bedrooms.toString()),
    priceRange: (item: any, values: string[]) => {
      const price = item.price?.amount || 0
      return values.some(range => {
        switch (range) {
          case 'low': return price < 10000
          case 'medium': return price >= 10000 && price < 30000
          case 'high': return price >= 30000
          default: return true
        }
      })
    }
  }
  
  const filteredResults = useFilters(mockProperties, activeFilters, filterFunctions)
  
  React.useEffect(() => {
    onResults(filteredResults)
  }, [filteredResults, onResults])

  const filterGroups = [
    {
      key: 'type',
      label: 'Property Type',
      options: [
        { label: 'Apartment', value: 'apartment', count: 1 },
        { label: 'Villa', value: 'villa', count: 1 },
        { label: 'Studio', value: 'studio', count: 1 }
      ]
    },
    {
      key: 'city',
      label: 'City',
      options: [
        { label: 'Algiers', value: 'Algiers', count: 2 },
        { label: 'Oran', value: 'Oran', count: 1 }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Available', value: 'available', count: 2 },
        { label: 'Rented', value: 'rented', count: 1 }
      ]
    },
    {
      key: 'bedrooms',
      label: 'Bedrooms',
      options: [
        { label: '1 Bedroom', value: '1', count: 1 },
        { label: '2 Bedrooms', value: '2', count: 1 },
        { label: '4+ Bedrooms', value: '4', count: 1 }
      ]
    },
    {
      key: 'priceRange',
      label: 'Price Range',
      options: [
        { label: 'Under 10,000 DZD', value: 'low', count: 1 },
        { label: '10,000 - 30,000 DZD', value: 'medium', count: 1 },
        { label: 'Over 30,000 DZD', value: 'high', count: 1 }
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
    <Filters
      filterGroups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAll}
    />
  )
}

describe('Property Search Functionality', () => {
  it('searches properties by title', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'Modern' } })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Modern Apartment Downtown' })
        ])
      )
    })
  })

  it('searches properties by description', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'ocean views' } })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Luxury Villa Seaside' })
        ])
      )
    })
  })

  it('searches properties by city', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'Oran' } })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Luxury Villa Seaside' })
        ])
      )
    })
  })

  it('returns all properties when search term is empty', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(mockProperties)
    })
  })

  it('returns empty results for non-matching search', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith([])
    })
  })

  it('performs case-insensitive search', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'MODERN' } })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Modern Apartment Downtown' })
        ])
      )
    })
  })

  it('clears search when clear button is clicked', async () => {
    const onResults = jest.fn()
    render(<TestSearchComponent onResults={onResults} />)
    
    const searchInput = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(searchInput, { target: { value: 'Modern' } })
    
    await waitFor(() => {
      const clearButton = screen.getByRole('button')
      fireEvent.click(clearButton)
    })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(mockProperties)
    })
  })
})

describe('Property Filter Functionality', () => {
  it('filters properties by type', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    // Open filters dropdown
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    // Select apartment type
    const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
    fireEvent.click(apartmentOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ features: expect.objectContaining({ type: 'apartment' }) })
        ])
      )
    })
  })

  it('filters properties by city', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const algiersOption = screen.getByRole('menuitemcheckbox', { name: /algiers/i })
    fireEvent.click(algiersOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ location: expect.objectContaining({ city: 'Algiers' }) })
        ])
      )
    })
  })

  it('filters properties by status', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const availableOption = screen.getByRole('menuitemcheckbox', { name: /available/i })
    fireEvent.click(availableOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: 'available' })
        ])
      )
    })
  })

  it('filters properties by bedroom count', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const twoBedroomOption = screen.getByRole('menuitemcheckbox', { name: /2 bedrooms/i })
    fireEvent.click(twoBedroomOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ features: expect.objectContaining({ bedrooms: 2 }) })
        ])
      )
    })
  })

  it('filters properties by price range', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const lowPriceOption = screen.getByRole('menuitemcheckbox', { name: /under 10,000/i })
    fireEvent.click(lowPriceOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 
            price: expect.objectContaining({ amount: expect.any(Number) })
          })
        ])
      )
    })
  })

  it('applies multiple filters simultaneously', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    // Apply multiple filters
    const algiersOption = screen.getByRole('menuitemcheckbox', { name: /algiers/i })
    fireEvent.click(algiersOption)
    
    const availableOption = screen.getByRole('menuitemcheckbox', { name: /available/i })
    fireEvent.click(availableOption)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 
            location: expect.objectContaining({ city: 'Algiers' }),
            status: 'available'
          })
        ])
      )
    })
  })

  it('shows active filter count in button', async () => {
    render(<TestFilterComponent onResults={jest.fn()} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
    fireEvent.click(apartmentOption)
    
    // Close dropdown by clicking outside
    fireEvent.click(document.body)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Filter count badge
    })
  })

  it('displays active filters as badges', async () => {
    render(<TestFilterComponent onResults={jest.fn()} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
    fireEvent.click(apartmentOption)
    
    // Close dropdown
    fireEvent.click(document.body)
    
    await waitFor(() => {
      expect(screen.getByText('Apartment')).toBeInTheDocument()
    })
  })

  it('removes individual filters when badge X is clicked', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
    fireEvent.click(apartmentOption)
    
    // Close dropdown
    fireEvent.click(document.body)
    
    await waitFor(() => {
      const removeButton = screen.getByRole('button', { name: '' }) // X button in badge
      fireEvent.click(removeButton)
    })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(mockProperties) // All properties returned
    })
  })

  it('clears all filters when clear all button is clicked', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    // Apply a filter
    const apartmentOption = screen.getByRole('menuitemcheckbox', { name: /apartment/i })
    fireEvent.click(apartmentOption)
    
    // Close dropdown
    fireEvent.click(document.body)
    
    await waitFor(() => {
      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      fireEvent.click(clearAllButton)
    })
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(mockProperties)
    })
  })

  it('returns all properties when no filters are active', async () => {
    const onResults = jest.fn()
    render(<TestFilterComponent onResults={onResults} />)
    
    await waitFor(() => {
      expect(onResults).toHaveBeenCalledWith(mockProperties)
    })
  })
})

describe('Combined Search and Filter Functionality', () => {
  it('should work together when both search and filters are applied', () => {
    // Test search hook with pre-filtered data
    const searchResults = useSearch(
      mockProperties.filter(p => p.location.city === 'Algiers'),
      ['title', 'description'],
      'Modern'
    )
    
    expect(searchResults).toHaveLength(1)
    expect(searchResults[0].title).toBe('Modern Apartment Downtown')
  })

  it('should handle empty results gracefully', () => {
    const searchResults = useSearch([], ['title'], 'test')
    expect(searchResults).toEqual([])
    
    const filterResults = useFilters([], {}, {})
    expect(filterResults).toEqual([])
  })
})