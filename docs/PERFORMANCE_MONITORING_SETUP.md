# Performance Monitoring Setup Guide

This document describes the performance monitoring implementation for the public website, including Core Web Vitals tracking, error monitoring with Sentry, and Google Analytics 4 integration.

## Overview

The monitoring system includes:
- **Core Web Vitals tracking** for performance metrics
- **Sentry integration** for error tracking and performance monitoring
- **Google Analytics 4** for user behavior and conversion tracking
- **Custom performance monitoring** for detailed insights

## Configuration

### Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# App Version (for release tracking)
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional: Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

### Google Analytics Setup

1. Create a GA4 property in Google Analytics
2. Copy the Measurement ID (G-XXXXXXXXXX)
3. Add it to your environment variables
4. The system will automatically track:
   - Page views
   - Form submissions
   - Contact interactions
   - Property views
   - Service inquiries
   - Search usage
   - Language changes
   - Core Web Vitals

### Sentry Setup

1. Create a Sentry project at https://sentry.io
2. Copy the DSN from your project settings
3. Add it to your environment variables
4. The system will automatically track:
   - JavaScript errors
   - Performance issues
   - Core Web Vitals problems
   - API errors
   - Long tasks and layout shifts

## Features

### Core Web Vitals Tracking

The system automatically tracks all Core Web Vitals metrics:

- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: Loading performance
- **TTFB (Time to First Byte)**: Server response time

Metrics are sent to:
- Google Analytics for trend analysis
- Custom API endpoint for detailed logging
- Sentry for performance issue tracking

### Error Tracking

Sentry integration provides:
- Automatic error capture
- Performance monitoring
- Session replay (with privacy controls)
- Release tracking
- Custom error filtering

### Performance Monitoring

Custom performance monitoring includes:
- Long task detection (>50ms)
- Layout shift monitoring
- Resource loading performance
- Navigation timing analysis

### Analytics Events

The system tracks these custom events:

```typescript
// Form submissions
trackFormSubmission('contact-form', true);

// Contact interactions
trackContact('email', '/contact');

// Property views
trackPropertyView('property-123', 'apartment');

// Service inquiries
trackServiceInquiry('property-management');

// Search usage
trackSearch('luxury apartments', 15);

// Language changes
trackLanguageChange('en', 'fr');
```

## Usage

### In Components

Use the analytics hook in your components:

```typescript
import { useAnalytics } from '@/components/providers/analytics-provider';

function ContactForm() {
  const { trackFormSubmission, trackContact } = useAnalytics();
  
  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      trackFormSubmission('contact-form', true);
      trackContact('form', '/contact');
    } catch (error) {
      trackFormSubmission('contact-form', false);
    }
  };
  
  return (
    // Your form JSX
  );
}
```

### Manual Performance Tracking

For custom performance measurements:

```typescript
import { measurePerformance } from '@/lib/monitoring/performance';

// Measure synchronous operations
const result = measurePerformance('data-processing', () => {
  return processData(data);
});

// Measure asynchronous operations
const result = await measurePerformance('api-call', async () => {
  return await fetch('/api/data');
});
```

## Development Tools

### Monitoring Dashboard

In development mode, a monitoring dashboard is available in the bottom-right corner showing:
- Real-time Web Vitals metrics
- Recent errors
- Performance measurements

### Console Logging

All monitoring events are logged to the console in development mode for debugging.

## Production Considerations

### Privacy

- Sentry session replay masks all text and inputs by default
- No personally identifiable information is sent to analytics
- Error messages are filtered to exclude sensitive data

### Performance Impact

- Web Vitals tracking has minimal performance impact
- Sentry is configured with appropriate sampling rates:
  - Production: 10% trace sampling, 1% session replay
  - Development: 100% trace sampling, 10% session replay

### Data Retention

- Google Analytics: Standard retention policies
- Sentry: 30-day retention on free plan
- Custom analytics: Configurable based on your storage

## Monitoring Alerts

### Sentry Alerts

Configure alerts for:
- Error rate increases
- Performance degradation
- New error types
- Poor Web Vitals scores

### Google Analytics Alerts

Set up alerts for:
- Traffic drops
- Conversion rate changes
- Page load time increases

## API Endpoints

### Web Vitals Collection

`POST /api/analytics/web-vitals`

Collects Core Web Vitals data and sends to monitoring systems.

## Troubleshooting

### Common Issues

1. **Analytics not tracking**: Check GA_ID environment variable
2. **Sentry not working**: Verify SENTRY_DSN is correct
3. **Console errors**: Check browser console for initialization errors

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed logs for all monitoring activities.

## Best Practices

1. **Test in development** before deploying monitoring changes
2. **Monitor performance impact** of tracking code
3. **Regularly review** Sentry and GA data for insights
4. **Set up alerts** for critical performance thresholds
5. **Document custom events** for team consistency

## Integration with CI/CD

The monitoring system integrates with your deployment pipeline:
- Source maps are uploaded to Sentry automatically
- Release tracking helps correlate errors with deployments
- Performance budgets can be enforced in CI

## Support

For issues with the monitoring setup:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Test in development mode first
4. Review Sentry and GA documentation for advanced configuration