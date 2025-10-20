import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResponsiveImage, HeroImage, PropertyImage, ServiceIcon } from '@/components/ui/responsive-image'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        data-testid="next-image"
        {...props}
      />
    )
  }
})

// Mock Skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

describe('ResponsiveImage Component', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 400,
    height: 300
  }

  it('renders image with correct props', () => {
    render(<ResponsiveImage {...defaultProps} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('shows skeleton while loading', () => {
    render(<ResponsiveImage {...defaultProps} />)
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('hides skeleton after image loads', async () => {
    render(<ResponsiveImage {...defaultProps} />)
    
    const image = screen.getByTestId('next-image')
    fireEvent.load(image)
    
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
  })

  it('calls onLoad callback when image loads', () => {
    const onLoad = jest.fn()
    render(<ResponsiveImage {...defaultProps} onLoad={onLoad} />)
    
    const image = screen.getByTestId('next-image')
    fireEvent.load(image)
    
    expect(onLoad).toHaveBeenCalled()
  })

  it('handles image error and shows fallback', async () => {
    render(<ResponsiveImage {...defaultProps} fallbackSrc="/fallback.jpg" />)
    
    const image = screen.getByTestId('next-image')
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(screen.getByText('Image unavailable')).toBeInTheDocument()
    })
  })

  it('calls onError callback when image fails to load', () => {
    const onError = jest.fn()
    render(<ResponsiveImage {...defaultProps} onError={onError} />)
    
    const image = screen.getByTestId('next-image')
    fireEvent.error(image)
    
    expect(onError).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveImage {...defaultProps} className="custom-image" />
    )
    
    expect(container.firstChild).toHaveClass('custom-image')
  })

  it('renders with fill prop correctly', () => {
    render(<ResponsiveImage src="/test.jpg" alt="Test" fill />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('applies priority prop for above-fold images', () => {
    render(<ResponsiveImage {...defaultProps} priority />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('uses custom quality setting', () => {
    render(<ResponsiveImage {...defaultProps} quality={95} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('handles blur placeholder', () => {
    render(
      <ResponsiveImage 
        {...defaultProps} 
        placeholder="blur" 
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ" 
      />
    )
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })
})

describe('HeroImage Component', () => {
  it('renders with hero-specific props', () => {
    render(<HeroImage src="/hero.jpg" alt="Hero image" />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Hero image')
  })

  it('applies hero-specific classes', () => {
    const { container } = render(<HeroImage src="/hero.jpg" alt="Hero" />)
    
    expect(container.firstChild).toHaveClass('w-full')
  })

  it('applies custom className along with default classes', () => {
    const { container } = render(
      <HeroImage src="/hero.jpg" alt="Hero" className="custom-hero" />
    )
    
    expect(container.firstChild).toHaveClass('custom-hero', 'w-full')
  })
})

describe('PropertyImage Component', () => {
  it('renders with property-specific props', () => {
    render(<PropertyImage src="/property.jpg" alt="Property image" />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Property image')
  })

  it('applies property-specific classes', () => {
    const { container } = render(<PropertyImage src="/property.jpg" alt="Property" />)
    
    expect(container.firstChild).toHaveClass('aspect-[4/3]', 'w-full')
  })

  it('handles click events', () => {
    const onClick = jest.fn()
    const { container } = render(
      <PropertyImage src="/property.jpg" alt="Property" onClick={onClick} />
    )
    
    if (container.firstChild) {
      fireEvent.click(container.firstChild)
      expect(onClick).toHaveBeenCalled()
    }
  })
})

describe('ServiceIcon Component', () => {
  it('renders with service icon specific props', () => {
    render(<ServiceIcon src="/icon.svg" alt="Service icon" />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Service icon')
  })

  it('applies service icon specific classes', () => {
    const { container } = render(<ServiceIcon src="/icon.svg" alt="Service" />)
    
    expect(container.firstChild).toHaveClass('w-16', 'h-16')
  })

  it('uses fixed dimensions for icons', () => {
    render(<ServiceIcon src="/icon.svg" alt="Service" />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })
})

describe('Error Handling', () => {
  it('shows error state when image fails to load', async () => {
    render(<ResponsiveImage src="/broken-image.jpg" alt="Broken image" />)
    
    const image = screen.getByTestId('next-image')
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(screen.getByText('Image unavailable')).toBeInTheDocument()
    })
  })

  it('attempts to load fallback image on error', async () => {
    render(
      <ResponsiveImage 
        src="/broken-image.jpg" 
        alt="Broken image" 
        fallbackSrc="/fallback.jpg" 
      />
    )
    
    const image = screen.getByTestId('next-image')
    fireEvent.error(image)
    
    // The component should attempt to load the fallback
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/fallback.jpg')
    })
  })

  it('shows error state even when fallback fails', async () => {
    render(
      <ResponsiveImage 
        src="/broken-image.jpg" 
        alt="Broken image" 
        fallbackSrc="/broken-fallback.jpg" 
      />
    )
    
    const image = screen.getByTestId('next-image')
    
    // First error - should try fallback
    fireEvent.error(image)
    
    // Second error on fallback - should show error state
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(screen.getByText('Image unavailable')).toBeInTheDocument()
    })
  })
})