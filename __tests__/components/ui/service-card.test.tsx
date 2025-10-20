import { render, screen, fireEvent } from '@testing-library/react'
import { ServiceCard, ServiceGrid } from '@/components/ui/service-card'

// Mock the responsive image component
jest.mock('@/components/ui/responsive-image', () => ({
  ServiceIcon: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="service-icon" />
  ),
}))

const mockService = {
  id: '1',
  title: 'Property Management',
  description: 'Complete property management services for your rental properties',
  longDescription: 'Our comprehensive property management service includes tenant screening, rent collection, maintenance coordination, and financial reporting.',
  icon: '/icons/property-management.svg',
  features: [
    'Tenant screening and selection',
    'Rent collection and accounting',
    'Maintenance and repairs',
    'Legal compliance',
    'Financial reporting'
  ],
  benefits: [
    'Maximize rental income',
    'Reduce vacancy periods',
    'Professional tenant relations'
  ],
  pricing: {
    startingPrice: 5000,
    currency: 'DZD',
    period: 'month',
    priceLabel: 'Starting from'
  },
  ctaText: 'Learn More',
  ctaLink: '/services/property-management',
  isPopular: true,
  isNew: false
}

describe('ServiceCard Component', () => {
  it('renders service information correctly in default variant', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.getByText('Complete property management services for your rental properties')).toBeInTheDocument()
    expect(screen.getByTestId('service-icon')).toBeInTheDocument()
  })

  it('displays features with check icons', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('Tenant screening and selection')).toBeInTheDocument()
    expect(screen.getByText('Rent collection and accounting')).toBeInTheDocument()
    expect(screen.getByText('Maintenance and repairs')).toBeInTheDocument()
    expect(screen.getByText('Legal compliance')).toBeInTheDocument()
  })

  it('shows pricing information when available', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('From 5,000 DZD')).toBeInTheDocument()
    expect(screen.getByText('/month')).toBeInTheDocument()
  })

  it('renders CTA button with correct text', () => {
    render(<ServiceCard service={mockService} />)
    
    const ctaButton = screen.getByRole('button', { name: /learn more/i })
    expect(ctaButton).toBeInTheDocument()
  })

  it('handles CTA button click', () => {
    const onCtaClick = jest.fn()
    render(<ServiceCard service={mockService} onCtaClick={onCtaClick} />)
    
    const ctaButton = screen.getByRole('button', { name: /learn more/i })
    fireEvent.click(ctaButton)
    
    expect(onCtaClick).toHaveBeenCalled()
  })

  it('renders compact variant correctly', () => {
    render(<ServiceCard service={mockService} variant="compact" />)
    
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
  })

  it('renders detailed variant with long description and benefits', () => {
    render(<ServiceCard service={mockService} variant="detailed" />)
    
    expect(screen.getByText('Our comprehensive property management service')).toBeInTheDocument()
    expect(screen.getByText('Key Features:')).toBeInTheDocument()
    expect(screen.getByText('Benefits:')).toBeInTheDocument()
    expect(screen.getByText('Maximize rental income')).toBeInTheDocument()
  })

  it('renders pricing variant with popular badge', () => {
    render(<ServiceCard service={mockService} variant="pricing" />)
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
    expect(screen.getByText('5,000 DZD')).toBeInTheDocument()
    expect(screen.getByText('Starting from')).toBeInTheDocument()
  })

  it('shows new badge when service is new', () => {
    const newService = { ...mockService, isNew: true }
    render(<ServiceCard service={newService} variant="detailed" />)
    
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('hides CTA when showCta is false', () => {
    render(<ServiceCard service={mockService} showCta={false} />)
    
    expect(screen.queryByRole('button', { name: /learn more/i })).not.toBeInTheDocument()
  })

  it('handles service without pricing', () => {
    const serviceWithoutPricing = { ...mockService, pricing: undefined }
    render(<ServiceCard service={serviceWithoutPricing} />)
    
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.queryByText('5,000 DZD')).not.toBeInTheDocument()
  })

  it('handles service with custom price label', () => {
    const customPricingService = {
      ...mockService,
      pricing: {
        ...mockService.pricing,
        startingPrice: undefined,
        priceLabel: 'Contact us for pricing'
      }
    }
    render(<ServiceCard service={customPricingService} variant="pricing" />)
    
    expect(screen.getByText('Contact us for pricing')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ServiceCard service={mockService} className="custom-service-card" />
    )
    
    expect(container.firstChild).toHaveClass('custom-service-card')
  })

  it('limits features display in default variant', () => {
    render(<ServiceCard service={mockService} />)
    
    // Should show first 4 features plus "more features" indicator
    expect(screen.getByText('+1 more features')).toBeInTheDocument()
  })

  it('handles compact variant click', () => {
    const onCtaClick = jest.fn()
    render(<ServiceCard service={mockService} variant="compact" onCtaClick={onCtaClick} />)
    
    // In compact variant, the whole card is clickable
    const card = screen.getByText('Property Management').closest('[role="button"]') || 
                 screen.getByText('Property Management').closest('div')
    
    if (card) {
      fireEvent.click(card)
      expect(onCtaClick).toHaveBeenCalled()
    }
  })
})

describe('ServiceGrid Component', () => {
  const mockServices = [
    mockService,
    { ...mockService, id: '2', title: 'Maintenance Services', isPopular: false },
    { ...mockService, id: '3', title: 'Tenant Relations', isNew: true }
  ]

  it('renders multiple services in grid layout', () => {
    render(<ServiceGrid services={mockServices} />)
    
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.getByText('Maintenance Services')).toBeInTheDocument()
    expect(screen.getByText('Tenant Relations')).toBeInTheDocument()
  })

  it('renders in compact variant', () => {
    render(<ServiceGrid services={mockServices} variant="compact" />)
    
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.getAllByText('Learn more')).toHaveLength(3)
  })

  it('renders in detailed variant', () => {
    render(<ServiceGrid services={mockServices} variant="detailed" />)
    
    expect(screen.getAllByText('Key Features:')).toHaveLength(3)
    expect(screen.getAllByText('Benefits:')).toHaveLength(3)
  })

  it('renders in pricing variant', () => {
    render(<ServiceGrid services={mockServices} variant="pricing" />)
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
    expect(screen.getAllByText('Starting from')).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(
      <ServiceGrid services={mockServices} className="custom-grid" />
    )
    
    expect(container.firstChild).toHaveClass('custom-grid')
  })

  it('handles empty services array', () => {
    const { container } = render(<ServiceGrid services={[]} />)
    
    expect(container.firstChild?.childNodes).toHaveLength(0)
  })

  it('applies correct grid classes for different variants', () => {
    const { container, rerender } = render(<ServiceGrid services={mockServices} variant="default" />)
    expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')

    rerender(<ServiceGrid services={mockServices} variant="compact" />)
    expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2')

    rerender(<ServiceGrid services={mockServices} variant="detailed" />)
    expect(container.firstChild).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
  })
})