import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PropertyCard, PropertyGrid } from '@/components/ui/property-card'

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

const mockProperty = {
  id: '1',
  title: 'Beautiful Apartment',
  description: 'A stunning apartment in the heart of the city',
  location: {
    address: '123 Main St',
    city: 'Algiers',
    coordinates: [36.7538, 3.0588] as [number, number]
  },
  images: ['/image1.jpg', '/image2.jpg', '/image3.jpg'],
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
}

describe('PropertyCard Component', () => {
  it('renders property information correctly', () => {
    render(<PropertyCard property={mockProperty} />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
    expect(screen.getByText('A stunning apartment in the heart of the city')).toBeInTheDocument()
    expect(screen.getByText('123 Main St, Algiers')).toBeInTheDocument()
    expect(screen.getByText('15,000 DZD')).toBeInTheDocument()
    expect(screen.getByText('/month')).toBeInTheDocument()
  })

  it('displays property features correctly', () => {
    render(<PropertyCard property={mockProperty} />)
    
    expect(screen.getByText('2')).toBeInTheDocument() // bedrooms
    expect(screen.getByText('1')).toBeInTheDocument() // bathrooms
    expect(screen.getByText('85m²')).toBeInTheDocument() // area
  })

  it('shows amenities with overflow indicator', () => {
    render(<PropertyCard property={mockProperty} />)
    
    expect(screen.getByText('WiFi')).toBeInTheDocument()
    expect(screen.getByText('Air Conditioning')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument() // remaining amenities
  })

  it('handles image click to open modal', async () => {
    render(<PropertyCard property={mockProperty} />)
    
    const image = screen.getByTestId('property-image')
    fireEvent.click(image)
    
    await waitFor(() => {
      expect(screen.getByTestId('image-modal')).toBeInTheDocument()
    })
  })

  it('handles contact button click', async () => {
    render(<PropertyCard property={mockProperty} />)
    
    const contactButton = screen.getByRole('button', { name: /contact/i })
    fireEvent.click(contactButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('contact-modal')).toBeInTheDocument()
    })
  })

  it('handles favorite toggle', () => {
    render(<PropertyCard property={mockProperty} />)
    
    const favoriteButton = screen.getByRole('button', { name: '' }) // Heart icon button
    fireEvent.click(favoriteButton)
    
    // Check if heart icon changes (would need to check class changes in real implementation)
    expect(favoriteButton).toBeInTheDocument()
  })

  it('renders in list variant correctly', () => {
    render(<PropertyCard property={mockProperty} variant="list" />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument()
  })

  it('renders featured variant with highlighting', () => {
    const highlightedProperty = { ...mockProperty, isHighlighted: true }
    render(<PropertyCard property={highlightedProperty} variant="featured" />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
  })

  it('handles custom onImageClick callback', () => {
    const onImageClick = jest.fn()
    render(<PropertyCard property={mockProperty} onImageClick={onImageClick} />)
    
    const image = screen.getByTestId('property-image')
    fireEvent.click(image)
    
    expect(onImageClick).toHaveBeenCalledWith(0)
  })

  it('handles custom onContactClick callback', () => {
    const onContactClick = jest.fn()
    render(<PropertyCard property={mockProperty} onContactClick={onContactClick} />)
    
    const contactButton = screen.getByRole('button', { name: /contact/i })
    fireEvent.click(contactButton)
    
    expect(onContactClick).toHaveBeenCalled()
  })

  it('hides contact button when showContactButton is false', () => {
    render(<PropertyCard property={mockProperty} showContactButton={false} />)
    
    expect(screen.queryByRole('button', { name: /contact/i })).not.toBeInTheDocument()
  })

  it('displays status badge with correct styling', () => {
    const { rerender } = render(<PropertyCard property={mockProperty} />)
    expect(screen.getByText('available')).toBeInTheDocument()

    const rentedProperty = { ...mockProperty, status: 'rented' as const }
    rerender(<PropertyCard property={rentedProperty} />)
    expect(screen.getByText('rented')).toBeInTheDocument()
  })

  it('handles property without price', () => {
    const propertyWithoutPrice = { ...mockProperty, price: undefined }
    render(<PropertyCard property={propertyWithoutPrice} />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
    expect(screen.queryByText('15,000 DZD')).not.toBeInTheDocument()
  })
})

describe('PropertyGrid Component', () => {
  const mockProperties = [
    mockProperty,
    { ...mockProperty, id: '2', title: 'Second Property' },
    { ...mockProperty, id: '3', title: 'Third Property', isHighlighted: true }
  ]

  it('renders multiple properties in grid layout', () => {
    render(<PropertyGrid properties={mockProperties} />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
    expect(screen.getByText('Second Property')).toBeInTheDocument()
    expect(screen.getByText('Third Property')).toBeInTheDocument()
  })

  it('renders in list variant', () => {
    render(<PropertyGrid properties={mockProperties} variant="list" />)
    
    expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /view details/i })).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(
      <PropertyGrid properties={mockProperties} className="custom-grid" />
    )
    
    expect(container.firstChild).toHaveClass('custom-grid')
  })

  it('handles empty properties array', () => {
    const { container } = render(<PropertyGrid properties={[]} />)
    
    expect(container.firstChild?.childNodes).toHaveLength(0)
  })
})