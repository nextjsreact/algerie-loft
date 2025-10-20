import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropertyInquiryForm } from '@/components/forms/property-inquiry-form'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl
const messages = {
  propertyInquiry: {
    form: {
      title: 'Property Inquiry',
      description: 'Interested in this property?',
      descriptionWithProperty: 'Interested in {property}?',
      propertyInfo: 'Property Information',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      phone: 'Phone Number',
      phonePlaceholder: 'Enter your phone number (optional)',
      inquiryType: 'Type of Inquiry',
      inquiryTypes: {
        viewing: 'Schedule a Viewing',
        information: 'Request Information',
        rental: 'Rental Inquiry',
        purchase: 'Purchase Inquiry',
        management: 'Management Services'
      },
      preferredContactTime: 'Preferred Contact Time',
      contactTimes: {
        morning: 'Morning (9 AM - 12 PM)',
        afternoon: 'Afternoon (12 PM - 6 PM)',
        evening: 'Evening (6 PM - 9 PM)',
        anytime: 'Anytime'
      },
      budget: 'Budget Range',
      budgetPlaceholder: 'e.g., $1000-1500/month',
      moveInDate: 'Preferred Move-in Date',
      message: 'Additional Details',
      messagePlaceholder: 'Tell us more about your requirements...',
      consentText: 'I consent to being contacted about this property inquiry',
      privacyNotice: 'Your information is secure',
      submit: 'Send Inquiry',
      submitting: 'Sending...',
      successTitle: 'Inquiry Sent!',
      successMessage: 'Thank you for your interest',
      responseTime: 'Our property specialists typically respond within 2-4 hours',
      submitAnother: 'Submit Another Inquiry',
      submitError: 'Failed to send inquiry'
    }
  }
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)

// Mock fetch
global.fetch = jest.fn()

describe('PropertyInquiryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type of inquiry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred contact time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/budget range/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred move-in date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/additional details/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i consent to being contacted/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send inquiry/i })).toBeInTheDocument()
  })

  it('displays property information when provided', () => {
    render(
      <TestWrapper>
        <PropertyInquiryForm propertyId="123" propertyName="Luxury Apartment Downtown" />
      </TestWrapper>
    )

    expect(screen.getByText(/property information/i)).toBeInTheDocument()
    expect(screen.getByText(/luxury apartment downtown/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /send inquiry/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/please provide more details/i)).toBeInTheDocument()
      expect(screen.getByText(/you must consent to being contacted/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockResolvedValue(undefined)
    
    render(
      <TestWrapper>
        <PropertyInquiryForm 
          propertyId="123" 
          propertyName="Test Property"
          onSubmit={mockSubmit} 
        />
      </TestWrapper>
    )

    // Fill out the form
    await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
    await user.type(screen.getByLabelText(/additional details/i), 'I am interested in viewing this property next week')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))

    const submitButton = screen.getByRole('button', { name: /send inquiry/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        propertyId: '123',
        propertyName: 'Test Property',
        inquiryType: 'information',
        message: 'I am interested in viewing this property next week',
        consentToContact: true
      }))
    })
  })

  it('handles inquiry type selection', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    const inquiryTypeSelect = screen.getByLabelText(/type of inquiry/i)
    await user.click(inquiryTypeSelect)
    
    const viewingOption = screen.getByText(/schedule a viewing/i)
    await user.click(viewingOption)

    // Verify the selection
    expect(screen.getByDisplayValue(/schedule a viewing/i)).toBeInTheDocument()
  })

  it('handles contact time selection', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    const contactTimeSelect = screen.getByLabelText(/preferred contact time/i)
    await user.click(contactTimeSelect)
    
    const morningOption = screen.getByText(/morning \(9 am - 12 pm\)/i)
    await user.click(morningOption)

    // Verify the selection
    expect(screen.getByDisplayValue(/morning \(9 am - 12 pm\)/i)).toBeInTheDocument()
  })

  it('handles move-in date input', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    const moveInDateInput = screen.getByLabelText(/preferred move-in date/i)
    await user.type(moveInDateInput, '2024-06-01')

    expect(moveInDateInput).toHaveValue('2024-06-01')
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Inquiry submitted successfully' })
    })

    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    // Fill out and submit form
    await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/additional details/i), 'I am interested in this property')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    await waitFor(() => {
      expect(screen.getByText(/inquiry sent!/i)).toBeInTheDocument()
      expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <TestWrapper>
        <PropertyInquiryForm />
      </TestWrapper>
    )

    // Fill out and submit form
    await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/additional details/i), 'I am interested in this property')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})