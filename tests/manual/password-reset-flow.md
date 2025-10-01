# Password Reset Authentication Flow - Manual Test Scenarios

## Overview
This document provides comprehensive manual test scenarios for the password reset authentication flow, covering all aspects from email request to successful password update.

## Prerequisites
- Development environment running on `http://localhost:3000`
- Access to Supabase dashboard for monitoring auth events
- Test email account for receiving reset emails
- Browser developer tools for monitoring network requests

## Test Scenarios

### Scenario 1: Happy Path - Complete Password Reset Flow

**Objective:** Verify the complete password reset flow works end-to-end

**Steps:**
1. Navigate to `/fr/login`
2. Click "Mot de passe oublié ?" link
3. Enter a valid email address
4. Click "Envoyer le lien de réinitialisation"
5. Check email inbox for reset email
6. Click the reset link in the email
7. Verify redirect to `/fr/reset-password`
8. Enter a new password meeting all criteria
9. Confirm the password
10. Click "Mettre à jour le mot de passe"
11. Verify success message and auto-redirect to login
12. Login with the new password

**Expected Results:**
- ✅ Email sent successfully
- ✅ Reset link redirects to password form (not login)
- ✅ Password form displays without errors
- ✅ Password update succeeds
- ✅ Login works with new password

### Scenario 2: Invalid/Missing Code Parameter

**Objective:** Test API callback behavior with invalid code parameters

**Test Cases:**

#### 2a: Missing Code Parameter
**URL:** `http://localhost:3000/api/auth/reset-password`
**Expected:** Redirect to `/fr/forgot-password?error=invalid-link`

#### 2b: Empty Code Parameter
**URL:** `http://localhost:3000/api/auth/reset-password?code=`
**Expected:** Redirect to `/fr/forgot-password?error=invalid-link`

#### 2c: Invalid Code Format
**URL:** `http://localhost:3000/api/auth/reset-password?code=invalid-123`
**Expected:** Redirect to `/fr/forgot-password?error=expired-link`

### Scenario 3: Expired Reset Link

**Objective:** Test behavior with expired reset codes

**Steps:**
1. Generate a reset link (follow Scenario 1 steps 1-5)
2. Wait for the link to expire (or use an old link)
3. Click the expired reset link
4. Verify proper error handling

**Expected Results:**
- ✅ Redirect to `/fr/forgot-password?error=expired-link`
- ✅ Error message displayed: "Le lien de reset a expiré"
- ✅ Option to request new link available

### Scenario 4: Session Validation on Reset Password Page

**Objective:** Test session validation behavior on the reset password form

**Test Cases:**

#### 4a: Valid Session
**Steps:**
1. Complete successful auth callback (Scenario 1 steps 1-7)
2. Verify form displays correctly
3. Check session validation indicators

**Expected Results:**
- ✅ Form displays without loading state
- ✅ No error messages shown
- ✅ Password fields are enabled

#### 4b: No Session (Direct Access)
**Steps:**
1. Navigate directly to `/fr/reset-password`
2. Observe behavior

**Expected Results:**
- ✅ Error message: "Aucune session de reset trouvée"
- ✅ Links to login and forgot password available

#### 4c: Expired Session
**Steps:**
1. Complete auth callback but wait for session to expire
2. Try to submit password form

**Expected Results:**
- ✅ Error message about expired session
- ✅ Option to request new reset link

### Scenario 5: Password Validation

**Objective:** Test password validation rules and user feedback

**Test Cases:**

#### 5a: Weak Password
**Test Data:**
- Password: `123`
- Confirm: `123`

**Expected Results:**
- ✅ Validation error: "Le mot de passe doit contenir au moins 8 caractères"
- ✅ Visual indicators show failed criteria

#### 5b: Password Mismatch
**Test Data:**
- Password: `StrongPass123`
- Confirm: `DifferentPass123`

**Expected Results:**
- ✅ Error: "Les mots de passe ne correspondent pas"

#### 5c: Valid Password
**Test Data:**
- Password: `NewSecurePass123`
- Confirm: `NewSecurePass123`

**Expected Results:**
- ✅ All validation criteria show green
- ✅ Form submission succeeds

### Scenario 6: Error Handling and User Feedback

**Objective:** Test error handling throughout the flow

**Test Cases:**

#### 6a: Network Errors
**Steps:**
1. Disconnect internet during password reset request
2. Try to submit forgot password form
3. Reconnect and retry

**Expected Results:**
- ✅ Network error message displayed
- ✅ Retry functionality works

#### 6b: Supabase Service Errors
**Steps:**
1. Simulate Supabase service unavailability
2. Try password reset flow

**Expected Results:**
- ✅ Appropriate error messages
- ✅ No application crashes

### Scenario 7: URL Parameter Error Handling

**Objective:** Test forgot password form error parameter handling

**Test Cases:**

#### 7a: Invalid Link Error
**URL:** `/fr/forgot-password?error=invalid-link`
**Expected Results:**
- ✅ Error message: "Le lien de reset est invalide"
- ✅ Helpful tip about checking spam folder

#### 7b: Expired Link Error
**URL:** `/fr/forgot-password?error=expired-link`
**Expected Results:**
- ✅ Error message: "Le lien de reset a expiré"
- ✅ Clear error dismiss functionality

#### 7c: Auth Failed Error
**URL:** `/fr/forgot-password?error=auth-failed`
**Expected Results:**
- ✅ Error message: "Échec de l'authentification"
- ✅ Option to request new link

## Performance Tests

### Load Time Tests
- ✅ Reset password page loads within 2 seconds
- ✅ Form submission responds within 3 seconds
- ✅ Email sending completes within 5 seconds

### Browser Compatibility
Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Security Tests

### Session Security
- ✅ Session tokens are httpOnly
- ✅ No sensitive data in client-side code
- ✅ Proper session expiration handling

### Code Validation
- ✅ Codes are single-use
- ✅ Codes expire appropriately
- ✅ Invalid codes are rejected

## Monitoring and Logging

### Console Logs to Monitor
- "Reset password API called with code: true/false"
- "Successfully exchanged code for session"
- "Failed to exchange code for session"
- Session validation messages

### Network Requests to Verify
- POST to `/fr/forgot-password` (200 status)
- GET to `/api/auth/reset-password?code=...` (307 redirect)
- Supabase auth API calls

## Test Data

### Valid Test Emails
- `test@test.com` (development mode)
- `test@demo.com` (development mode)
- Your actual email for full testing

### Test Passwords
- **Weak:** `123` (should fail)
- **Medium:** `password123` (should fail - no uppercase)
- **Strong:** `SecurePass123!` (should pass)

## Troubleshooting Common Issues

### Issue: Redirect to Login Instead of Reset Password
**Cause:** Old API implementation still active
**Solution:** Verify API route is updated with new code exchange logic

### Issue: Session Not Found Error
**Cause:** Session not properly established by API callback
**Solution:** Check Supabase configuration and cookie settings

### Issue: Email Not Received
**Cause:** Email configuration or spam filtering
**Solution:** Check Supabase email settings and spam folder

## Success Criteria

All test scenarios should pass with:
- ✅ Proper error handling and user feedback
- ✅ Secure session management
- ✅ Intuitive user experience
- ✅ No application crashes or broken states
- ✅ Clear, actionable error messages
- ✅ Successful password reset completion