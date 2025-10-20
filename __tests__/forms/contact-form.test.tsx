import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '@/components/forms/contact-form'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl
const messages = {
  contact: {
    form: {
      title: 'Send us a message',
      description: 'Fill out the form below',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      phone: 'Phone Number',
      phonePlaceholder: 'Enter your phone number (optional)',
      subject: 'Subject',
      subjectPlaceholder: 'What can we help you with?',
      message: 'Message',
      messagePlaceholder: 'Tell us about your needs...',
      preferredContact: 'Preferred Contact Method',
      contactMethods: {
        email: 'Email',
        phone: 'Phone'
      },
      consentText: 'I consent to being contacted',
      privacyNotice: 'We respect your privacy',
      submit: 'Send Message',
      submitting: 'Sending...',
      successTitle: 'Message Sent!',
      successMessage: 'Thank you for your message',
      responseTime: 'We typically respond within 2-4 hours',
      submitAnother: 'Send Another Message',
      submitError: 'Failed to send message'
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

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred contact method/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i consent to being contacted/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/subject must be at least 5 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/you must consent to being contacted/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates message length', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    const messageInput = screen.getByLabelText(/message/i)
    await user.type(messageInput, 'short')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockResolvedValue(undefined)
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Form submitted successfully' })
    })

    render(
      <TestWrapper>
        <ContactForm onSubmit={mockSubmit} />
      </TestWrapper>
    )

    // Fill out the form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
    await user.type(screen.getByLabelText(/subject/i), 'Test inquiry')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message for the contact form')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))

    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        subject: 'Test inquiry',
        message: 'This is a test message for the contact form',
        preferredContact: 'email',
        consentToContact: true,
        website: ''
      })
    })
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Form submitted successfully' })
    })

    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    // Fill out and submit form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Test inquiry')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message for the contact form')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/message sent!/i)).toBeInTheDocument()
      expect(screen.getByText(/thank you for your message/i)).toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    // Fill out and submit form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Test inquiry')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message for the contact form')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('prevents spam with honeypot field', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <TestWrapper>
        <ContactForm onSubmit={mockSubmit} />
      </TestWrapper>
    )

    // Fill out the form including honeypot
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Test inquiry')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message for the contact form')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))

    // Simulate bot filling honeypot field
    const honeypotField = document.querySelector('input[name="website"]') as HTMLInputElement
    if (honeypotField) {
      fireEvent.change(honeypotField, { target: { value: 'spam' } })
    }

    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Should not call onSubmit when honeypot is filled
    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    
    // Mock a slow response
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true })
      }), 1000))
    )

    render(
      <TestWrapper>
        <ContactForm />
      </TestWrapper>
    )

    // Fill out and submit form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Test inquiry')
    await user.type(screen.getByLabelText(/message/i), 'This is a test message for the contact form')
    await user.click(screen.getByLabelText(/i consent to being contacted/i))
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)

    // Button should be disabled and show submitting text
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/sending.../i)).toBeInTheDocument()
  })
})