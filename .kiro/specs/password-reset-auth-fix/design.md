# Design Document

## Overview

The password reset authentication flow needs to be fixed to properly handle Supabase's authentication callback. The current implementation incorrectly processes the authentication tokens, causing users to be redirected to login instead of the reset password page. This design addresses the complete authentication flow from email link click to successful password reset.

## Architecture

### Current Flow (Broken)
1. User requests reset → Email sent with redirect to `/api/auth/reset-password`
2. API endpoint receives `code` parameter but fails to process it correctly
3. User gets redirected to login instead of reset password page

### Fixed Flow
1. User requests reset → Email sent with redirect to `/api/auth/reset-password`
2. API endpoint properly exchanges `code` for session tokens
3. Session is established and user is redirected to `/reset-password` page
4. User can successfully reset password with valid session

## Components and Interfaces

### 1. API Route Handler (`/api/auth/reset-password/route.ts`)

**Purpose:** Handle Supabase authentication callback and establish user session

**Key Methods:**
- `GET` handler to process authentication callback
- Extract `code` parameter from URL
- Exchange code for session using `supabase.auth.exchangeCodeForSession(code)`
- Set session cookies and redirect appropriately

**Error Handling:**
- Invalid/missing code → Redirect to forgot-password with error
- Token exchange failure → Redirect to forgot-password with error
- Success → Redirect to reset-password page

### 2. Reset Password Page (`/[locale]/reset-password/page.tsx`)

**Purpose:** Display password reset form for authenticated users

**Features:**
- Session validation on page load
- Password strength indicators
- Form validation and submission
- Success/error messaging

### 3. Reset Password Form Component (`/components/auth/reset-password-form.tsx`)

**Purpose:** Handle password reset form logic and validation

**Key Features:**
- Real-time password validation
- Password confirmation matching
- Session verification
- Supabase password update API calls

## Data Models

### Authentication Flow Data
```typescript
interface ResetPasswordRequest {
  code: string;           // Supabase auth code from email link
  access_token?: string;  // Generated after code exchange
  refresh_token?: string; // Generated after code exchange
}

interface PasswordResetForm {
  password: string;
  confirmPassword: string;
}

interface ValidationCriteria {
  minLength: boolean;     // 8+ characters
  hasLowercase: boolean;  // a-z
  hasUppercase: boolean;  // A-Z
  hasNumber: boolean;     // 0-9
}
```

## Error Handling

### API Route Error Scenarios
1. **Missing Code Parameter**
   - Log: "No auth code provided"
   - Action: Redirect to `/forgot-password?error=invalid-link`

2. **Invalid/Expired Code**
   - Log: "Invalid or expired auth code"
   - Action: Redirect to `/forgot-password?error=expired-link`

3. **Session Exchange Failure**
   - Log: "Failed to exchange code for session"
   - Action: Redirect to `/forgot-password?error=auth-failed`

### Form Error Scenarios
1. **Invalid Session**
   - Display: "Reset link invalid or expired"
   - Action: Show links to request new reset or return to login

2. **Password Validation Failure**
   - Display: Specific validation messages
   - Action: Highlight failed criteria

3. **Password Update Failure**
   - Display: Supabase error message
   - Action: Allow retry

## Testing Strategy

### Unit Tests
- API route handler with various code scenarios
- Password validation logic
- Form submission handling

### Integration Tests
- Complete password reset flow from email to success
- Error handling for expired/invalid links
- Session management throughout the process

### Manual Testing Scenarios
1. **Happy Path:** Request reset → Click email link → Set new password → Login
2. **Expired Link:** Use old reset link → See appropriate error
3. **Invalid Password:** Try weak password → See validation errors
4. **Network Issues:** Simulate API failures → See error handling

## Security Considerations

### Token Handling
- Supabase codes are single-use and time-limited
- Session tokens are properly secured with httpOnly cookies
- No sensitive data exposed in client-side code

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- Passwords are hashed by Supabase before storage

### Rate Limiting
- Supabase handles rate limiting for auth operations
- Consider adding client-side debouncing for form submissions

## Implementation Notes

### Supabase Configuration
- Ensure redirect URL is properly configured in Supabase dashboard
- Verify email templates include correct callback URL
- Test with both development and production environments

### URL Structure
- Reset emails redirect to: `/api/auth/reset-password?code={code}`
- Successful auth redirects to: `/{locale}/reset-password`
- Error redirects to: `/{locale}/forgot-password?error={type}`

### Internationalization
- Error messages should support multiple locales
- Success messages should be localized
- Form labels and validation messages need translation support