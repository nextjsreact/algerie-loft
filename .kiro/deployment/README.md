# Deployment Monitoring and Rollback System

This system provides comprehensive monitoring, feature flags, and automated rollback capabilities for the dual-audience homepage deployment.

## Overview

The deployment system consists of three main components:

1. **Performance Monitoring** - Real-time tracking of response times, error rates, and Core Web Vitals
2. **Feature Flags** - Gradual rollout capabilities with percentage-based traffic splitting
3. **Rollback System** - Automated rollback triggers based on performance thresholds

## Quick Start

### Deploy with Monitoring

```bash
# Development deployment
npm run deploy:enhanced:dev

# Staging deployment
npm run deploy:enhanced:staging

# Production deployment (with gradual rollout)
npm run deploy:enhanced:prod
```

### Monitor Deployment

```bash
# Start monitoring systems
npm run monitoring:start

# View monitoring dashboard
npm run monitoring:dashboard
# Then open: http://localhost:3000/deployment-dashboard

# Check feature flags status
npm run feature-flags:status
```

### Emergency Procedures

```bash
# Emergency rollback (disables all features)
npm run rollback:emergency

# Manual feature flag control via API
curl -X PUT http://localhost:3000/api/deployment/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flagId": "dual_audience_homepage", "percentage": 0, "updatedBy": "admin"}'
```

## System Architecture

### Performance Monitoring

The monitoring system tracks:

- **Response Times**: Average response time per endpoint
- **Error Rates**: Percentage of requests resulting in errors
- **Core Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Health Checks**: Automated endpoint availability checks

**Configuration**: `.kiro/deployment/deployment-config.json`

### Feature Flags

Feature flags enable gradual rollout with:

- **Percentage-based rollout**: Control what percentage of users see new features
- **User targeting**: Target specific users or user groups
- **Geographic targeting**: Roll out to specific countries/regions
- **Dependency management**: Ensure dependent features are enabled together

**Available Flags**:
- `dual_audience_homepage` - Main homepage redesign
- `enhanced_hero_section` - Guest-focused hero section
- `featured_lofts_showcase` - Interactive loft cards
- `trust_social_proof` - Reviews and testimonials
- `repositioned_owner_section` - Owner value proposition
- `multilingual_currency_support` - Language and currency features
- `advanced_booking_functionality` - Enhanced booking features
- `analytics_conversion_optimization` - Analytics and A/B testing

### Rollback System

Automated rollback triggers:

- **High Error Rate** (>10%): Emergency rollback to 0%
- **Slow Response Time** (>5s): Reduce rollout by 50%
- **Poor Web Vitals** (LCP >4s): Disable performance-heavy features
- **Health Check Failures** (≥2 failures): Reduce rollout by 50%

## API Endpoints

### Monitoring

```bash
# Get monitoring dashboard data
GET /api/deployment/monitoring

# Record Web Vitals
POST /api/deployment/web-vitals
{
  "lcp": 2500,
  "fid": 100,
  "cls": 0.1,
  "fcp": 1800,
  "ttfb": 600
}

# Health check
GET /api/health
```

### Feature Flags

```bash
# Update feature flag rollout
PUT /api/deployment/feature-flags
{
  "flagId": "dual_audience_homepage",
  "percentage": 25,
  "updatedBy": "admin"
}

# Start gradual rollout
POST /api/deployment/feature-flags
{
  "flagId": "dual_audience_homepage",
  "updatedBy": "admin"
}
```

### Rollback

```bash
# Trigger manual rollback
POST /api/deployment/rollback
{
  "reason": "Performance issues detected",
  "triggeredBy": "admin"
}
```

## Gradual Rollout Strategy

For production deployments, the system uses a gradual rollout strategy:

1. **5%** for 24 hours - Initial canary deployment
2. **15%** for 24 hours - Expanded testing
3. **30%** for 24 hours - Broader rollout
4. **50%** for 48 hours - Half traffic
5. **75%** for 48 hours - Majority traffic
6. **100%** - Full rollout

Each step is monitored for:
- Error rate increases
- Performance degradation
- User experience issues

If issues are detected, the system can automatically:
- Pause the rollout
- Reduce the rollout percentage
- Trigger emergency rollback

## Monitoring Dashboard

Access the real-time monitoring dashboard at:
`http://localhost:3000/deployment-dashboard`

The dashboard shows:
- System status and health
- Performance metrics and trends
- Feature flag status and rollout percentages
- Recent rollback events
- Web Vitals performance

## Configuration

### Environment Variables

```bash
# Required for monitoring
WEBHOOK_URL=https://your-webhook-url.com/alerts
SMTP_HOST=smtp.your-provider.com
SMTP_USER=alerts@loftalgerie.com
SMTP_PASS=your-smtp-password

# Optional for enhanced monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id
```

### Deployment Configuration

Edit `.kiro/deployment/deployment-config.json` to customize:

- Performance thresholds
- Rollback triggers
- Feature flag dependencies
- Health check endpoints
- Alerting configuration

## Troubleshooting

### Common Issues

**Monitoring not starting**:
```bash
# Check if monitoring is initialized
npm run monitoring:start
```

**Feature flags not working**:
```bash
# Check feature flag status
npm run feature-flags:status

# Verify API is responding
curl http://localhost:3000/api/deployment/monitoring
```

**Rollback not triggering**:
```bash
# Check rollback system status
curl http://localhost:3000/api/health

# Manual rollback
npm run rollback:emergency
```

### Logs and Debugging

- **Application logs**: Check Next.js console output
- **Monitoring logs**: Check browser console on dashboard page
- **API logs**: Check network tab for API responses
- **Deployment logs**: Check `.kiro/deployment/deployment-report-*.json`

## Security Considerations

- **API Access**: Deployment APIs should be protected in production
- **Feature Flag Access**: Limit who can modify feature flags
- **Rollback Access**: Restrict emergency rollback capabilities
- **Monitoring Data**: Ensure sensitive data is not logged

## Best Practices

1. **Test in Staging**: Always test rollout procedures in staging first
2. **Monitor Closely**: Watch metrics during initial rollout phases
3. **Have Rollback Plan**: Always have a rollback plan ready
4. **Document Changes**: Document all feature flag changes
5. **Team Communication**: Notify team of deployment activities

## Support

For issues with the deployment monitoring system:

1. Check the troubleshooting section above
2. Review logs and monitoring dashboard
3. Contact the development team
4. Use emergency rollback if critical issues occur

## Related Documentation

- [Feature Requirements](../specs/dual-audience-homepage/requirements.md)
- [System Design](../specs/dual-audience-homepage/design.md)
- [Implementation Tasks](../specs/dual-audience-homepage/tasks.md)