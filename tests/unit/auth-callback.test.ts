/**
 * Unit tests for password reset authentication callback
 * Tests the /api/auth/reset-password route functionality
 */

import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    exchangeCodeForSession: jest.fn(),
  },
}

// Mock the createClient function
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Import the route handler after mocking
import { GET } from '@/app/api/auth/reset-password/route'

describe('Password Reset Auth Callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Valid code exchange', () => {
    it('should successfully exchange code for session and redirect to reset password page', async () => {
      // Arrange
      const mockSession = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: { id: 'user_id', email: 'test@example.com' },
      }

      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=valid_code')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid_code')
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/reset-password')
    })
  })

  describe('Missing code parameter', () => {
    it('should redirect to forgot password with invalid-link error when no code provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=invalid-link')
    })
  })

  describe('Invalid/expired code', () => {
    it('should redirect to forgot password with expired-link error when code exchange fails', async () => {
      // Arrange
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid or expired code' },
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=invalid_code')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('invalid_code')
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=expired-link')
    })
  })

  describe('Session exchange failure', () => {
    it('should redirect to forgot password with auth-failed error when no session returned', async () => {
      // Arrange
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=valid_code')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid_code')
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=auth-failed')
    })
  })

  describe('Unexpected errors', () => {
    it('should handle unexpected errors and redirect to forgot password with auth-failed error', async () => {
      // Arrange
      mockSupabaseClient.auth.exchangeCodeForSession.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=valid_code')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid_code')
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=auth-failed')
    })
  })

  describe('Code parameter validation', () => {
    it('should handle empty code parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=invalid-link')
    })

    it('should handle malformed code parameter', async () => {
      // Arrange
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Malformed code' },
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password?code=malformed-code-123')

      // Act
      const response = await GET(request)

      // Assert
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('malformed-code-123')
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/fr/forgot-password?error=expired-link')
    })
  })
})