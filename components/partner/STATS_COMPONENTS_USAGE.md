# Dashboard Stats Components Usage Guide

This guide explains how to use the new reusable `StatCard` and `DashboardStats` components created for the partner dashboard improvements.

## Components Overview

### 1. StatCard Component

A reusable card component for displaying statistics with optional trend indicators.

**Location:** `components/partner/stat-card.tsx`

**Features:**
- Icon display
- Label and value
- Optional trend indicators (up, down, neutral)
- Optional subtitle
- Responsive design
- Customizable styling

**Props:**
```typescript
interface StatCardProps {
  icon: LucideIcon          // Icon component from lucide-react
  label: string             // Main label text
  value: string | number    // The stat value to display
  change?: {                // Optional trend indicator
    value: number           // Percentage change
    trend: 'up' | 'down' | 'neutral'
  }
  subtitle?: string         // Optional subtitle text
  className?: string        // Optional additional CSS classes
}
```

**Example Usage:**
```tsx
import { StatCard } from '@/components/partner/stat-card'
import { Building2 } from 'lucide-react'

<StatCard
  icon={Building2}
  label="Total Properties"
  value={25}
  subtitle="5 active"
  change={{
    value: 15,
    trend: 'up'
  }}
/>
```

### 2. DashboardStats Component

An enhanced component that displays a grid of statistics cards with loading states, error handling, and automatic data fetching.

**Location:** `components/partner/dashboard-stats.tsx`

**Features:**
- Automatic data fetching from API
- Loading skeleton
- Error handling with retry
- Trend calculation
- Translation support via next-intl
- Responsive grid layout

**Props:**
```typescript
interface DashboardStatsProps {
  userId?: string                    // Optional user ID for fetching
  stats?: PartnerStats | null        // Optional pre-fetched stats
  onRetry?: () => void              // Optional custom retry handler
}

interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  yearly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
  pending_requests: number
  unread_messages: number
}
```

**Example Usage:**

**Option 1: Automatic data fetching**
```tsx
import { DashboardStats } from '@/components/partner/dashboard-stats'

<DashboardStats userId="user-123" />
```

**Option 2: With pre-fetched data**
```tsx
import { DashboardStats } from '@/components/partner/dashboard-stats'

const stats = {
  total_properties: 10,
  active_properties: 8,
  total_bookings: 45,
  upcoming_bookings: 12,
  monthly_earnings: 15000,
  yearly_earnings: 180000,
  occupancy_rate: 75,
  average_rating: 4.5,
  total_reviews: 120,
  pending_requests: 3,
  unread_messages: 5
}

<DashboardStats stats={stats} />
```

**Option 3: With custom retry handler**
```tsx
import { DashboardStats } from '@/components/partner/dashboard-stats'

const handleRetry = async () => {
  // Custom retry logic
  await fetchDashboardData()
}

<DashboardStats 
  userId="user-123" 
  onRetry={handleRetry}
/>
```

## Integration with Existing Dashboard

To integrate these components into the existing partner dashboard page (`app/[locale]/partner/dashboard/page.tsx`):

### Step 1: Import the component
```tsx
import { DashboardStats } from '@/components/partner/dashboard-stats'
```

### Step 2: Replace the existing stats cards section

**Before:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Card>
    <CardContent className="p-6">
      {/* Manual stat card implementation */}
    </CardContent>
  </Card>
  {/* More cards... */}
</div>
```

**After:**
```tsx
<DashboardStats stats={stats} onRetry={fetchDashboardData} />
```

## Translation Keys Required

The `DashboardStats` component uses the following translation keys from `partner.dashboard.stats`:

```json
{
  "partner": {
    "dashboard": {
      "stats": {
        "totalProperties": "Total Properties",
        "activeProperties": "{count} active",
        "bookings": "Bookings",
        "upcomingBookings": "{count} upcoming",
        "monthlyRevenue": "Monthly Revenue",
        "occupancyRate": "Occupancy Rate",
        "excellentRate": "Excellent rate"
      },
      "error": {
        "title": "Loading Error",
        "message": "An error occurred while loading data",
        "retry": "Retry"
      }
    }
  }
}
```

These keys are already present in:
- `messages/fr.json`
- `messages/en.json`
- `messages/ar.json`

## Benefits

1. **Reusability**: StatCard can be used anywhere in the application
2. **Consistency**: All stats cards have the same look and feel
3. **Error Handling**: Built-in error states with retry functionality
4. **Loading States**: Smooth loading skeletons for better UX
5. **Trend Indicators**: Visual feedback on performance changes
6. **Translation Support**: Full i18n support via next-intl
7. **Type Safety**: Full TypeScript support with proper interfaces
8. **Maintainability**: Centralized component logic

## Customization

### Custom Styling
```tsx
<StatCard
  icon={Building2}
  label="Properties"
  value={10}
  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
/>
```

### Custom Trend Calculation
The `DashboardStats` component includes a `calculateTrend` function that can be customized to use real historical data from your API instead of mock calculations.

## Testing

Both components are designed to be easily testable:

```tsx
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/partner/stat-card'

test('renders stat card with value', () => {
  render(
    <StatCard
      icon={Building2}
      label="Properties"
      value={10}
    />
  )
  
  expect(screen.getByText('Properties')).toBeInTheDocument()
  expect(screen.getByText('10')).toBeInTheDocument()
})
```

## Requirements Satisfied

These components satisfy the following requirements from the spec:

- **Requirement 4.1**: Comprehensive property management capabilities with accurate metrics
- **Requirement 4.2**: Accurate statistics calculation and display
- **Requirement 5.1**: All labels and text use translation keys
- **Requirement 5.2**: Proper translation support for all interface elements
- **Requirement 7.2**: Real-time data updates with proper error handling
- **Requirement 7.3**: Accurate calculations based on partner's data
- **Requirement 7.4**: User-friendly error messages with retry options
