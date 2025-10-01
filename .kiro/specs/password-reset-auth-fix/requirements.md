# Requirements Document

## Introduction

The current password reset functionality has a broken authentication flow. Users receive reset emails successfully, but the API callback endpoint `/api/auth/reset-password` is not properly handling Supabase's authentication tokens, causing users to be redirected back to login instead of the reset password page. This spec addresses fixing the complete password reset authentication flow to ensure users can successfully reset their passwords.

## Requirements

### Requirement 1

**User Story:** As a user who forgot their password, I want to receive a reset email and be able to click the link to access the password reset form, so that I can set a new password.

#### Acceptance Criteria

1. WHEN a user requests a password reset THEN the system SHALL send an email with a valid reset link
2. WHEN a user clicks the reset link in their email THEN the system SHALL properly authenticate the session using Supabase tokens
3. WHEN the authentication is successful THEN the system SHALL redirect the user to the reset password form page
4. WHEN the authentication fails THEN the system SHALL display an appropriate error message

### Requirement 2

**User Story:** As a user on the password reset page, I want to be able to set a new password with proper validation, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user accesses the reset password page with valid tokens THEN the system SHALL display the password reset form
2. WHEN a user enters a new password THEN the system SHALL validate it meets security requirements (8+ characters, uppercase, lowercase, number)
3. WHEN a user confirms their password THEN the system SHALL verify both passwords match
4. WHEN the password update is successful THEN the system SHALL redirect to login with a success message
5. WHEN the password update fails THEN the system SHALL display an appropriate error message

### Requirement 3

**User Story:** As a developer, I want the API auth callback to properly handle Supabase authentication tokens, so that the password reset flow works seamlessly.

#### Acceptance Criteria

1. WHEN the `/api/auth/reset-password` endpoint receives a request THEN it SHALL properly extract the `code` parameter from Supabase
2. WHEN a valid code is present THEN the system SHALL exchange it for access and refresh tokens using Supabase's `exchangeCodeForSession` method
3. WHEN the token exchange is successful THEN the system SHALL set the session and redirect to the reset password page
4. WHEN the token exchange fails THEN the system SHALL redirect to an error page with appropriate messaging
5. WHEN no code is present THEN the system SHALL redirect to the forgot password page

### Requirement 4

**User Story:** As a user, I want clear feedback throughout the password reset process, so that I understand what's happening and can take appropriate action if something goes wrong.

#### Acceptance Criteria

1. WHEN a password reset email is sent THEN the system SHALL display a confirmation message with the email address
2. WHEN a reset link is invalid or expired THEN the system SHALL display a clear error message with options to request a new link
3. WHEN a password is successfully updated THEN the system SHALL display a success message and auto-redirect to login
4. WHEN there are validation errors THEN the system SHALL display specific, actionable error messages
5. WHEN the system is processing requests THEN it SHALL show appropriate loading states