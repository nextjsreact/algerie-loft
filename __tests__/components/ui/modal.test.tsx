import { render, screen, fireEvent } from '@testing-library/react'
import { Modal, ConfirmationModal, ImageModal, ContactModal } from '@/components/ui/modal'

// Mock the dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => 
    open ? <div data-testid="dialog" onClick={onOpenChange}>{children}</div> : null,
  DialogContent: ({ children, onPointerDownOutside, className }: any) => (
    <div 
      data-testid="dialog-content" 
      className={className}
      onPointerDown={onPointerDownOutside}
    >
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}))

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('renders title and description when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        title="Test Title" 
        description="Test Description" 
      />
    )
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Test Title')
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('Test Description')
  })

  it('renders close button by default', () => {
    render(<Modal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />)
    expect(screen.getByTestId('dialog-content')).toHaveClass('max-w-sm')

    rerender(<Modal {...defaultProps} size="lg" />)
    expect(screen.getByTestId('dialog-content')).toHaveClass('max-w-lg')

    rerender(<Modal {...defaultProps} size="full" />)
    expect(screen.getByTestId('dialog-content')).toHaveClass('max-w-[95vw]')
  })

  it('handles overlay click when closeOnOverlayClick is true', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={true} />)
    
    const dialog = screen.getByTestId('dialog')
    fireEvent.click(dialog)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('prevents overlay click when closeOnOverlayClick is false', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />)
    
    const dialog = screen.getByTestId('dialog')
    fireEvent.click(dialog)
    
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('ConfirmationModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default text', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(
      <ConfirmationModal 
        {...defaultProps}
        title="Delete Item"
        description="This action cannot be undone"
        confirmText="Delete"
        cancelText="Keep"
      />
    )
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onConfirm = jest.fn()
    const onClose = jest.fn()
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />)
    
    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    fireEvent.click(confirmButton)
    
    expect(onConfirm).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('calls only onClose when cancel button is clicked', () => {
    const onConfirm = jest.fn()
    const onClose = jest.fn()
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />)
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)
    
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('renders destructive variant correctly', () => {
    render(<ConfirmationModal {...defaultProps} variant="destructive" />)
    
    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmButton).toBeInTheDocument()
  })
})

describe('ImageModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    src: '/test-image.jpg',
    alt: 'Test image'
  }

  it('renders image with correct attributes', () => {
    render(<ImageModal {...defaultProps} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('renders with title when provided', () => {
    render(<ImageModal {...defaultProps} title="Image Title" />)
    
    expect(screen.getByText('Image Title')).toBeInTheDocument()
  })

  it('applies correct image classes', () => {
    render(<ImageModal {...defaultProps} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveClass('max-w-full', 'max-h-[80vh]', 'object-contain')
  })
})

describe('ContactModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  }

  it('renders with default title', () => {
    render(<ContactModal {...defaultProps} />)
    
    expect(screen.getByText('Contact us')).toBeInTheDocument()
  })

  it('renders with property-specific title', () => {
    render(<ContactModal {...defaultProps} propertyTitle="Beautiful Apartment" />)
    
    expect(screen.getByText('Inquire about Beautiful Apartment')).toBeInTheDocument()
  })

  it('renders appropriate description for property inquiry', () => {
    render(<ContactModal {...defaultProps} propertyTitle="Beautiful Apartment" />)
    
    expect(screen.getByText(/Get more information about Beautiful Apartment/)).toBeInTheDocument()
  })

  it('renders general description when no property specified', () => {
    render(<ContactModal {...defaultProps} />)
    
    expect(screen.getByText(/Get in touch with our team/)).toBeInTheDocument()
  })

  it('shows placeholder for contact form', () => {
    render(<ContactModal {...defaultProps} />)
    
    expect(screen.getByText('Contact form will be implemented in the forms section')).toBeInTheDocument()
  })
})