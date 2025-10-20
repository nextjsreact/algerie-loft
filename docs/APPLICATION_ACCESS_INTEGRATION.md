# Application Access Integration

This document describes the implementation of secure application access integration between the public website and internal application.

## Overview

The application access integration provides a seamless way for users to transition between the public website and the internal application while maintaining proper authentication and session management.

## Components

### 1. Secure App Access Route (`/app`)

**File**: `app/app/page.tsx`

This route serves as the secure entry point to the internal application:
- Detects user's preferred language
- Checks authentication status
- Redirects authenticated users to the dashboard
- Redirects unauthenticated users to login with return URL

### 2. Session Manager

**File**: `lib/session-manager.ts`

Core session management functionality:
- `hasActiveSession()`: Check if user has valid session
- `getCurrentSession()`: Get current user session data
- `transitionToInternalApp()`: Handle seamless app transition
- `logoutFromBothSystems()`: Complete logout from all systems
- `onSessionChange()`: Listen for authentication state changes
- `ensureValidSession()`: Validate and refresh sessions

### 3. Session Manager Hook

**File**: `hooks/use-session-manager.ts`

React hook that provides:
- Session state management
- Authentication status
- User information
- Transition and logout functions
- Error handling

### 4. Authentication Components

#### AppAccessLink
**File**: `components/auth/app-access-link.tsx`

Button component for accessing the internal application:
- Handles authentication check
- Provides multilingual support
- Customizable styling and behavior

#### AuthStatus
**File**: `components/auth/auth-status.tsx`

Displays current authentication status:
- Shows user information when logged in
- Provides login/logout buttons
- Handles session errors gracefully

#### LogoutButton
**File**: `components/auth/logout-button.tsx`

Dedicated logout component:
- Logs out from both public and internal systems
- Optional confirmation dialog
- Loading states and error handling

### 5. Session Provider

**File**: `components/providers/session-provider.tsx`

React context provider for session management:
- Provides session context to child components
- Handles session initialization
- Manages authentication state changes

### 6. Public Header

**File**: `components/layout/public-header.tsx`

Example header component for public website:
- Integrates authentication status
- Responsive navigation
- App access functionality

### 7. API Routes

#### Session API
**File**: `app/api/auth/session/route.ts`

Server-side session management:
- `GET /api/auth/session`: Get current session status
- `DELETE /api/auth/session`: Server-side logout

## Usage Examples

### Basic App Access Link

```tsx
import { AppAccessLink } from '@/components/auth/app-access-link';

export function MyComponent() {
  return (
    <AppAccessLink 
      locale="fr" 
      variant="outline"
      size="sm"
    />
  );
}
```

### Authentication Status Display

```tsx
import { AuthStatus } from '@/components/auth/auth-status';

export function Header() {
  return (
    <header>
      <nav>
        {/* Navigation items */}
      </nav>
      <AuthStatus locale="fr" />
    </header>
  );
}
```

### Using Session Manager Hook

```tsx
import { useSessionManager } from '@/hooks/use-session-manager';

export function MyComponent() {
  const { 
    isAuthenticated, 
    user, 
    loading, 
    transitionToApp,
    logoutFromBoth 
  } = useSessionManager('fr');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.full_name || user?.email}</p>
          <button onClick={transitionToApp}>
            Access Application
          </button>
          <button onClick={logoutFromBoth}>
            Logout
          </button>
        </div>
      ) : (
        <div>Please sign in</div>
      )}
    </div>
  );
}
```

### Wrapping with Session Provider

```tsx
import { SessionProvider } from '@/components/providers/session-provider';

export function PublicLayout({ children, locale }) {
  return (
    <SessionProvider locale={locale}>
      {children}
    </SessionProvider>
  );
}
```

## Authentication Flow

### For Authenticated Users

1. User clicks "Access Application" link
2. `SessionManager.transitionToInternalApp()` is called
3. Session is validated
4. User is redirected to `/{locale}/dashboard`

### For Unauthenticated Users

1. User clicks "Access Application" link
2. `SessionManager.transitionToInternalApp()` is called
3. No valid session found
4. User is redirected to `/{locale}/login?returnUrl=/app`
5. After successful login, user is redirected back to `/app`
6. `/app` route then redirects to dashboard

### Logout Process

1. User clicks logout button
2. `SessionManager.logoutFromBothSystems()` is called
3. Supabase session is terminated
4. Local storage and session storage are cleared
5. Cookies are cleared
6. User is redirected to public homepage

## Security Features

- **Session Validation**: Automatic session validation and refresh
- **Secure Redirects**: Proper URL encoding and validation
- **Token Management**: Automatic token refresh before expiration
- **Cross-System Logout**: Complete session cleanup across all systems
- **Error Handling**: Graceful handling of authentication errors

## Multilingual Support

All components support multiple languages:
- French (fr) - Default
- English (en)
- Arabic (ar)

Language is automatically detected or can be explicitly set via props.

## Error Handling

The system handles various error scenarios:
- Network connectivity issues
- Session expiration
- Authentication failures
- Invalid tokens
- Server errors

All errors are logged and user-friendly messages are displayed.

## Requirements Fulfilled

This implementation fulfills the following requirements:

### Requirement 9.1 - Secure Link to Internal Application
✅ Authentication check for internal users
✅ Redirect mechanism to internal app
✅ Login page for unauthorized users

### Requirement 9.2 - User Session Management
✅ Session detection and management
✅ Seamless transition between public and internal app
✅ Logout functionality that affects both systems

### Requirement 9.3 - Session Persistence
✅ Maintains session across page refreshes
✅ Automatic token refresh
✅ Proper session cleanup on logout

### Requirement 9.4 - User Experience
✅ Smooth transitions without jarring redirects
✅ Clear authentication status indicators
✅ Multilingual support