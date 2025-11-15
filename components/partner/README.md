# Partner Components

This directory contains components specific to the partner dashboard.

## PartnerLayout

The `PartnerLayout` component is a wrapper that provides authentication, authorization, and consistent layout for all partner dashboard pages.

### Features

- **Authentication Check**: Automatically verifies user session on mount
- **Authorization**: Ensures only users with 'partner' role can access
- **Session Management**: Periodically checks session validity (every 5 minutes)
- **Graceful Redirects**: Redirects to login on session expiration or unauthorized access
- **Loading States**: Shows loading spinner while verifying authentication
- **Error Handling**: Displays error messages and redirects on failures
- **Sidebar Integration**: Includes PartnerSidebar with user profile

### Usage

```tsx
import { PartnerLayout } from '@/components/partner/partner-layout'

export default function PartnerDashboardPage({ params }: { params: { locale: string } }) {
  return (
    <PartnerLayout locale={params.locale}>
      <div className="container mx-auto p-6">
        <h1>Dashboard Content</h1>
        {/* Your dashboard content here */}
      </div>
    </PartnerLayout>
  )
}
```

### Props

- `children` (ReactNode, required): The page content to render
- `locale` (string, required): The current locale (e.g., 'fr', 'en', 'ar')
- `showSidebar` (boolean, optional): Whether to show the sidebar (default: true)

### Authentication Flow

1. Component mounts and fetches session from `/api/auth/session`
2. If no session or invalid session → Redirect to login
3. If session exists but user role is not 'partner' → Redirect to unauthorized
4. If session is valid and user is partner → Render content with sidebar
5. Periodic session checks every 5 minutes to detect expiration

### Error Handling

- **401 Unauthorized**: Redirects to login with return URL
- **Network Errors**: Shows error message and redirects after 2 seconds
- **Invalid Role**: Redirects to unauthorized page

## PartnerSidebar

The `PartnerSidebar` component provides navigation for the partner dashboard.

### Features

- **Translated Navigation**: Uses next-intl for multilingual support
- **Active State**: Highlights current page
- **User Profile**: Shows user info with avatar and dropdown menu
- **Responsive**: Collapses on mobile with hamburger menu
- **Logout**: Integrated logout functionality

### Usage

The sidebar is automatically included in `PartnerLayout`. You don't need to use it directly unless you're creating a custom layout.

```tsx
import { PartnerSidebar } from '@/components/partner/partner-sidebar'

<PartnerSidebar 
  locale="fr"
  userProfile={{
    name: "John Doe",
    email: "john@example.com",
    avatar: "/path/to/avatar.jpg" // optional
  }}
/>
```

### Navigation Items

The sidebar includes the following navigation items:

- Dashboard
- Properties (Mes propriétés)
- Bookings (Réservations)
- Revenue (Revenus)
- Analytics (Analytiques)
- Messages
- Settings (Paramètres)

Each item is automatically translated based on the current locale.

## Translation Keys

All partner components use translation keys from the `partner` namespace:

```json
{
  "partner": {
    "navigation": {
      "dashboard": "Tableau de bord",
      "properties": "Mes propriétés",
      "bookings": "Réservations",
      "revenue": "Revenus",
      "analytics": "Analytiques",
      "messages": "Messages",
      "settings": "Paramètres",
      "profile": "Profil",
      "logout": "Déconnexion"
    },
    "branding": {
      "title": "Portail Partenaire",
      "subtitle": "Gestion de propriétés"
    }
  }
}
```

## Requirements

- Next.js 14+
- next-intl for translations
- Supabase for authentication
- shadcn/ui components (Sidebar, Avatar, DropdownMenu)

## Related Files

- `components/partner/partner-layout.tsx` - Main layout wrapper
- `components/partner/partner-sidebar.tsx` - Navigation sidebar
- `components/ui/sidebar.tsx` - Base sidebar components
- `lib/auth.ts` - Authentication utilities
- `app/api/auth/session/route.ts` - Session API endpoint
