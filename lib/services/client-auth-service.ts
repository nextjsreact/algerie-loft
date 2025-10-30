"use server"

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

// Types for client authentication
export interface ClientUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  preferences: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      marketing: boolean
    }
  }
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface ClientAuthSession {
  user: ClientUser
  token: string
  expires_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  preferences?: {
    language?: string
    currency?: string
    notifications?: {
      email?: boolean
      sms?: boolean
      marketing?: boolean
    }
  }
}

export interface AuthResult {
  success: boolean
  data?: ClientAuthSession
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

class ClientAuthService {
  private readonly JWT_SECRET: string
  private readonly JWT_EXPIRES_IN = '7d'
  private readonly SALT_ROUNDS = 12

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set in environment variables')
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): { token: string; expires_at: string } {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const token = jwt.sign(
      { 
        userId, 
        type: 'client_auth',
        iat: Math.floor(Date.now() / 1000)
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return {
      token,
      expires_at: expiresAt.toISOString()
    }
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      if (decoded.type !== 'client_auth') {
        return null
      }
      return { userId: decoded.userId }
    } catch (error) {
      return null
    }
  }

  /**
   * Generate secure random token for email verification/password reset
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): ValidationResult {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate registration data
   */
  private validateRegistrationData(data: RegisterData): ValidationResult {
    const errors: string[] = []

    // Email validation
    if (!data.email || !this.validateEmail(data.email)) {
      errors.push('Valid email address is required')
    }

    // Password validation
    const passwordValidation = this.validatePassword(data.password)
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors)
    }

    // Name validation
    if (!data.first_name || data.first_name.trim().length < 2) {
      errors.push('First name must be at least 2 characters long')
    }

    if (!data.last_name || data.last_name.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long')
    }

    // Phone validation (optional)
    if (data.phone && data.phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Invalid phone number format')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Register a new client user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validate input data
      const validation = this.validateRegistrationData(data)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      const supabase = await createClient()

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('customers')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        }
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password)

      // Generate email verification token
      const emailVerificationToken = this.generateSecureToken()

      // Prepare user data with defaults
      const userData = {
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone?.trim() || null,
        preferences: {
          language: data.preferences?.language || 'fr',
          currency: data.preferences?.currency || 'DZD',
          notifications: {
            email: data.preferences?.notifications?.email ?? true,
            sms: data.preferences?.notifications?.sms ?? false,
            marketing: data.preferences?.notifications?.marketing ?? false
          }
        },
        email_verification_token: emailVerificationToken,
        email_verified: false
      }

      // Insert user into database
      const { data: newUser, error: insertError } = await supabase
        .from('customers')
        .insert(userData)
        .select('id, email, first_name, last_name, phone, preferences, email_verified, created_at, updated_at')
        .single()

      if (insertError) {
        console.error('Database error during registration:', insertError)
        return {
          success: false,
          error: 'Failed to create user account'
        }
      }

      // Generate JWT token
      const { token, expires_at } = this.generateToken(newUser.id)

      // Create session in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await supabase
        .from('customer_sessions')
        .insert({
          customer_id: newUser.id,
          token_hash: tokenHash,
          expires_at: expires_at
        })

      // TODO: Send email verification email
      // await this.sendEmailVerification(newUser.email, emailVerificationToken)

      return {
        success: true,
        data: {
          user: newUser,
          token,
          expires_at
        }
      }

    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during registration'
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Basic validation
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        }
      }

      if (!this.validateEmail(credentials.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        }
      }

      const supabase = await createClient()

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('customers')
        .select('id, email, password_hash, first_name, last_name, phone, preferences, email_verified, created_at, updated_at')
        .eq('email', credentials.email.toLowerCase())
        .single()

      if (userError || !user) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.password_hash)
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Check if email is verified (optional - can be enforced later)
      // if (!user.email_verified) {
      //   return {
      //     success: false,
      //     error: 'Please verify your email address before logging in'
      //   }
      // }

      // Generate JWT token
      const { token, expires_at } = this.generateToken(user.id)

      // Create session in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await supabase
        .from('customer_sessions')
        .insert({
          customer_id: user.id,
          token_hash: tokenHash,
          expires_at: expires_at
        })

      // Update last login
      await supabase
        .from('customers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = user

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
          expires_at
        }
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during login'
      }
    }
  }

  /**
   * Validate session token and get user
   */
  async validateSession(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return {
          success: false,
          error: 'No token provided'
        }
      }

      // Verify JWT token
      const decoded = this.verifyToken(token)
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid or expired token'
        }
      }

      const supabase = await createClient()

      // Check if session exists in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const { data: session, error: sessionError } = await supabase
        .from('customer_sessions')
        .select('customer_id, expires_at')
        .eq('token_hash', tokenHash)
        .eq('customer_id', decoded.userId)
        .single()

      if (sessionError || !session) {
        return {
          success: false,
          error: 'Session not found'
        }
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        await supabase
          .from('customer_sessions')
          .delete()
          .eq('token_hash', tokenHash)

        return {
          success: false,
          error: 'Session expired'
        }
      }

      // Get user data
      const { data: user, error: userError } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, phone, preferences, email_verified, created_at, updated_at')
        .eq('id', decoded.userId)
        .single()

      if (userError || !user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Update session last used
      await supabase
        .from('customer_sessions')
        .update({ last_used: new Date().toISOString() })
        .eq('token_hash', tokenHash)

      return {
        success: true,
        data: {
          user,
          token,
          expires_at: session.expires_at
        }
      }

    } catch (error) {
      console.error('Session validation error:', error)
      return {
        success: false,
        error: 'Session validation failed'
      }
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!token) {
        return { success: true } // Already logged out
      }

      const supabase = await createClient()
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      // Delete session from database
      await supabase
        .from('customer_sessions')
        .delete()
        .eq('token_hash', tokenHash)

      return { success: true }

    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: 'Failed to logout'
      }
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!email || !this.validateEmail(email)) {
        return {
          success: false,
          error: 'Valid email address is required'
        }
      }

      const supabase = await createClient()

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('customers')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single()

      if (userError || !user) {
        // Don't reveal if user exists or not for security
        return {
          success: true // Always return success
        }
      }

      // Generate password reset token
      const resetToken = this.generateSecureToken()
      const resetExpires = new Date()
      resetExpires.setHours(resetExpires.getHours() + 1) // 1 hour expiry

      // Update user with reset token
      await supabase
        .from('customers')
        .update({
          password_reset_token: resetToken,
          password_reset_expires: resetExpires.toISOString()
        })
        .eq('id', user.id)

      // TODO: Send password reset email
      // await this.sendPasswordResetEmail(user.email, resetToken)

      return { success: true }

    } catch (error) {
      console.error('Password reset request error:', error)
      return {
        success: false,
        error: 'Failed to process password reset request'
      }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!token || !newPassword) {
        return {
          success: false,
          error: 'Token and new password are required'
        }
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      const supabase = await createClient()

      // Find user with valid reset token
      const { data: user, error: userError } = await supabase
        .from('customers')
        .select('id, password_reset_expires')
        .eq('password_reset_token', token)
        .single()

      if (userError || !user) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        }
      }

      // Check if token is expired
      if (new Date(user.password_reset_expires) < new Date()) {
        return {
          success: false,
          error: 'Reset token has expired'
        }
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword)

      // Update password and clear reset token
      await supabase
        .from('customers')
        .update({
          password_hash: passwordHash,
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('id', user.id)

      // Invalidate all existing sessions for security
      await supabase
        .from('customer_sessions')
        .delete()
        .eq('customer_id', user.id)

      return { success: true }

    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: 'Failed to reset password'
      }
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string, 
    updates: Partial<Pick<ClientUser, 'first_name' | 'last_name' | 'phone' | 'preferences'>>
  ): Promise<{ success: boolean; data?: ClientUser; error?: string }> {
    try {
      const supabase = await createClient()

      // Validate updates
      if (updates.first_name && updates.first_name.trim().length < 2) {
        return {
          success: false,
          error: 'First name must be at least 2 characters long'
        }
      }

      if (updates.last_name && updates.last_name.trim().length < 2) {
        return {
          success: false,
          error: 'Last name must be at least 2 characters long'
        }
      }

      if (updates.phone && updates.phone.trim().length > 0) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(updates.phone.replace(/[\s\-\(\)]/g, ''))) {
          return {
            success: false,
            error: 'Invalid phone number format'
          }
        }
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, preferences, email_verified, created_at, updated_at')
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return {
          success: false,
          error: 'Failed to update profile'
        }
      }

      return {
        success: true,
        data: updatedUser
      }

    } catch (error) {
      console.error('Profile update error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Clean expired sessions (utility function)
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .rpc('clean_expired_customer_sessions')

      if (error) {
        console.error('Error cleaning expired sessions:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Clean expired sessions error:', error)
      return 0
    }
  }
}

// Export singleton instance
export const clientAuthService = new ClientAuthService()
export default clientAuthService