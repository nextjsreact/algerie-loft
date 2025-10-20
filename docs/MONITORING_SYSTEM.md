# Monitoring and Analytics System

This document describes the comprehensive monitoring and analytics system implemented for the public website.

## Overview

The monitoring system provides:
- **Uptime Monitoring**: Continuous health checks of critical endpoints
- **Error Tracking**: Enhanced error collection and alerting via Sentry
- **User Behavior Analytics**: Detailed tracking of user interactions and engagement
- **Performance Dashboards**: Real-time visualization of system health and metrics

## Components

### 1. Uptime Monitoring (`lib/monitoring/uptime.ts`)

Monitors critical endpoints and tracks:
- Response times
- Service availability
- Uptime percentages
- Automatic retries with exponential backoff

**Configuration:**
```typescript
const config = {
  endpoints: ['/', '/api/health', '/api/contact'],
  interval: 60000, // Check every minute
  timeout: 10000,  // 10 second timeout
  retries: 3       // Retry 3 times before marking as down
};
```

### 2. Error Tracking (`lib/monitoring/error-tracking.ts`)

Enhanced error tracking with:
- Error deduplication using fingerprints
- Alert thresholds for different error levels
- Context-aware error reporting
- Integration with Sentry for alerting

**Usage:**
```typescript
import { trackError, trackAPIError, trackFormError } from '@/lib/monitoring/error-tracking';

// Track general errors
trackError(new Error('Something went wrong'), {
  page: '/contact',
  component: 'ContactForm',
  userId: 'user123'
});

// Track API errors
trackAPIError('/api/contact', 'POST', 500, 'Server error');

// Track form errors
trackFormError('contact-form', 'email', 'Invalid email format');
```

### 3. User Behavior Analytics (`lib/analytics/user-behavior.ts`)

Comprehensive user behavior tracking:
- Page views and navigation patterns
- User interactions (clicks, form submissions)
- Scroll depth and engagement metrics
- Session management and activity tracking

**Features:**
- Automatic event tracking for common interactions
- Custom business event tracking
- Session-based analytics
- Real-time engagement metrics

### 4. Performance Dashboard (`components/monitoring/performance-dashboard.tsx`)

Real-time dashboard showing:
- System health overview
- Core Web Vitals metrics
- Service uptime status
- Error summaries
- User analytics

### 5. Monitoring Status (`components/monitoring/monitoring-status.tsx`)

Compact status indicator for:
- Overall system health
- Quick metrics overview
- Manual refresh capability
- Popover with detailed information

## API Endpoints

### Analytics Endpoints
- `POST /api/analytics/events` - User event tracking
- `POST /api/analytics/engagement` - Page engagement data
- `POST /api/analytics/session` - Complete session data
- `POST /api/analytics/web-vitals` - Core Web Vitals metrics

### Monitoring Endpoints
- `GET /api/monitoring/dashboard` - Dashboard data
- `GET /api/health` - Enhanced health check

## Configuration

The monitoring system is configured via `lib/monitoring/config.ts`:

```typescript
export const monitoringConfig = {
  uptime: {
    enabled: process.env.NODE_ENV === 'production',
    interval: 60000,
    endpoints: ['/', '/api/health', '/api/contact']
  },
  errorTracking: {
    enabled: true,
    alertThresholds: {
      error: [5, 10, 25, 50],
      warning: [10, 25, 50]
    }
  },
  analytics: {
    enabled: true,
    userBehavior: {
      trackScrollDepth: true,
      trackInteractions: true
    }
  }
};
```

## Integration

### Client-Side Integration

The monitoring system is automatically initialized via the `AnalyticsProvider`:

```typescript
// components/providers/analytics-provider.tsx
export function AnalyticsProvider({ children }) {
  useEffect(() => {
    initGA();
    initWebVitals();
    initMonitoring();
    initUserBehaviorAnalytics();
    setupGlobalErrorHandling();
  }, []);

  return <>{children}</>;
}
```

### Server-Side Integration

Server-side monitoring can be initialized in your main application:

```typescript
// lib/monitoring/server-init.ts
import { initServerMonitoring } from '@/lib/monitoring/server-init';

// Initialize in your server startup
initServerMonitoring();
```

## Usage Examples

### Adding Monitoring to Components

```typescript
import { useMonitoringDashboard } from '@/hooks/use-monitoring-dashboard';
import { trackError } from '@/lib/monitoring/error-tracking';

function MyComponent() {
  const { data, loading, error } = useMonitoringDashboard();

  const handleError = (error: Error) => {
    trackError(error, {
      component: 'MyComponent',
      page: '/my-page'
    });
  };

  // Component logic...
}
```

### Custom Event Tracking

```typescript
import { 
  trackContactFormView,
  trackPropertyView,
  trackServiceInquiry 
} from '@/lib/analytics/user-behavior';

// Track business events
trackContactFormView('main-contact');
trackPropertyView('prop-123', 'apartment');
trackServiceInquiry('property-management');
```

### Adding Status Indicator

```typescript
import { MonitoringStatus, MonitoringIndicator } from '@/components/monitoring/monitoring-status';

// Full status display
<MonitoringStatus showDetails={true} />

// Compact indicator
<MonitoringIndicator />
```

## Environment Variables

Required environment variables:

```env
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Google Analytics (User Behavior)
NEXT_PUBLIC_GA_ID=your_ga_id

# Site URL (Uptime Monitoring)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Alerting

The system integrates with multiple alerting channels:

1. **Sentry**: Automatic error and performance alerts
2. **Console Logging**: Development and debugging
3. **Custom Webhooks**: Slack, Discord (configurable)
4. **Email Notifications**: (configurable)

## Performance Considerations

- **Client-side**: Minimal performance impact with lazy loading and sampling
- **Server-side**: Configurable monitoring intervals and timeouts
- **Data Retention**: Automatic cleanup of old monitoring data
- **Rate Limiting**: Built-in alert rate limiting to prevent spam

## Troubleshooting

### Common Issues

1. **Uptime monitoring not working**: Check if running on server-side only
2. **Missing analytics data**: Verify environment variables are set
3. **Dashboard not loading**: Check API endpoint accessibility
4. **High error counts**: Review error thresholds in configuration

### Debug Mode

Enable debug logging in development:

```typescript
// Set in monitoring config
const config = {
  debug: process.env.NODE_ENV === 'development'
};
```

## Future Enhancements

Planned improvements:
- Database storage for historical data
- Advanced alerting rules
- Custom dashboard widgets
- A/B testing integration
- Performance regression detection
- Automated incident response