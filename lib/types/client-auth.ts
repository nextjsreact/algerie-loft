// Types for client reservation flow authentication

export interface ClientUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  preferences: ClientUserPreferences
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface ClientUserPreferences {
  language: string
  currency: string
  notifications: {
    email: boolean
    sms: boolean
    marketing: boolean
  }
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
  preferences?: Partial<ClientUserPreferences>
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

export interface ClientUserSession {
  id: string
  customer_id: string
  token_hash: string
  expires_at: string
  created_at: string
  last_used: string
  user_agent?: string
  ip_address?: string
}

// Password validation schema for client users
export const clientPasswordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
}

// Default preferences for new client users
export const defaultClientPreferences: ClientUserPreferences = {
  language: 'fr',
  currency: 'DZD',
  notifications: {
    email: true,
    sms: false,
    marketing: false
  }
}