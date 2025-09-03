/**
 * Test for post-login redirect functionality
 * Verifies that users are redirected to the correct localized dashboard after login
 */

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn()
    }
  }))
}))

// Import the login function after mocking
import { login } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Get the mocked functions
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Post-Login Redirect Functionality', () => {
  let mockSignInWithPassword: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup the mock for signInWithPassword
    mockSignInWithPassword = jest.fn()
    ;(mockCreateClient as jest.MockedFunction<any>).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword
      }
    })
  })

  it('should redirect to French dashboard when locale is fr', async () => {
    // Mock successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await login('test@example.com', 'password', 'fr')

    expect(mockRedirect).toHaveBeenCalledWith('/fr/dashboard')
  })

  it('should redirect to English dashboard when locale is en', async () => {
    // Mock successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await login('test@example.com', 'password', 'en')

    expect(mockRedirect).toHaveBeenCalledWith('/en/dashboard')
  })

  it('should redirect to Arabic dashboard when locale is ar', async () => {
    // Mock successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await login('test@example.com', 'password', 'ar')

    expect(mockRedirect).toHaveBeenCalledWith('/ar/dashboard')
  })

  it('should fallback to French dashboard when locale is invalid', async () => {
    // Mock successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await login('test@example.com', 'password', 'invalid-locale')

    expect(mockRedirect).toHaveBeenCalledWith('/fr/dashboard')
  })

  it('should fallback to French dashboard when locale is undefined', async () => {
    // Mock successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await login('test@example.com', 'password', undefined)

    expect(mockRedirect).toHaveBeenCalledWith('/fr/dashboard')
  })

  it('should return error when login fails', async () => {
    // Mock failed login
    const mockError = { message: 'Invalid credentials' }
    mockSignInWithPassword.mockResolvedValue({ error: mockError })

    const result = await login('test@example.com', 'wrong-password', 'fr')

    expect(result).toEqual({ success: false, error: 'Invalid credentials' })
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})