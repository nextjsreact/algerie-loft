# Design Document

## Overview

This design implements domain configuration and routing for the Loft Algérie application to use `loftalgerie.com` as the primary domain with the public website as the landing page. The solution involves configuring Vercel domain settings, updating Next.js routing, and ensuring seamless user experience across all application features.

## Architecture

### Domain Configuration Strategy

The implementation uses a **root-level redirect approach** where:
- Root domain (`loftalgerie.com`) redirects to `/public` 
- All public routes maintain clean URLs (`loftalgerie.com/services`, `loftalgerie.com/about`)
- Admin routes remain accessible through their existing paths
- Multilingual routing is preserved with locale prefixes

### Routing Flow

```
loftalgerie.com → /public (redirect)
loftalgerie.com/services → /[locale]/public/services
loftalgerie.com/about → /[locale]/public/about
loftalgerie.com/admin → /admin (preserved)
loftalgerie.com/login → /login (preserved)
```

## Components and Interfaces

### 1. Vercel Configuration

**File: `vercel.json`**
- Domain configuration
- Redirect rules for root to public
- SSL and security headers
- Performance optimizations

**File: `next.config.js` Updates**
- Domain-specific configurations
- Asset optimization for custom domain
- Internationalization settings

### 2. Next.js Routing Updates

**Root Page Handler**
- Create `/app/page.tsx` that redirects to public
- Handle locale detection and routing
- Preserve existing functionality

**Middleware Updates**
- Update middleware to handle domain-specific routing
- Maintain authentication flows
- Preserve public route access

### 3. SEO and Meta Configuration

**Domain-Specific Meta Tags**
- Update meta tags for custom domain
- Configure Open Graph and Twitter cards
- Set canonical URLs for SEO

## Data Models

### Domain Configuration Object

```typescript
interface DomainConfig {
  domain: string;
  defaultRoute: string;
  publicRoutes: string[];
  adminRoutes: string[];
  locales: string[];
  redirects: RedirectRule[];
}

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  locale?: boolean;
}
```

### Route Mapping

```typescript
interface RouteMapping {
  public: {
    root: string;
    services: string;
    portfolio: string;
    about: string;
    contact: string;
  };
  admin: {
    dashboard: string;
    login: string;
    protected: string[];
  };
}
```

## Error Handling

### Domain Resolution Errors
- Fallback to default routing if domain configuration fails
- Error logging for domain-related issues
- Graceful degradation for DNS problems

### Redirect Loop Prevention
- Implement redirect cycle detection
- Maximum redirect limits
- Fallback mechanisms for routing failures

### SSL Certificate Issues
- Automatic HTTPS enforcement
- Certificate validation checks
- Fallback to HTTP in development

## Testing Strategy

### Domain Testing
- Test root domain redirect functionality
- Verify all public routes work with custom domain
- Validate admin routes remain accessible
- Test multilingual routing with custom domain

### Performance Testing
- Measure redirect performance impact
- Test loading times for landing page
- Validate CDN and caching behavior

### Cross-Browser Testing
- Test domain functionality across browsers
- Validate mobile responsiveness on custom domain
- Test PWA functionality if applicable

### Integration Testing
- Test Vercel deployment with custom domain
- Validate SSL certificate installation
- Test DNS propagation and resolution

## Implementation Approach

### Phase 1: Vercel Configuration
1. Create Vercel configuration files
2. Set up domain redirects and rules
3. Configure SSL and security settings

### Phase 2: Next.js Routing
1. Create root page redirect handler
2. Update middleware for domain routing
3. Preserve existing authentication flows

### Phase 3: SEO and Optimization
1. Update meta tags and canonical URLs
2. Configure sitemap for custom domain
3. Optimize performance for landing page

### Phase 4: Testing and Validation
1. Test all routing scenarios
2. Validate performance and SEO
3. Ensure backward compatibility

## Security Considerations

### HTTPS Enforcement
- Force HTTPS redirects for all traffic
- Configure HSTS headers
- Validate SSL certificate chain

### Domain Validation
- Implement domain whitelist validation
- Prevent domain spoofing attacks
- Secure cookie domain settings

### Route Protection
- Maintain existing authentication middleware
- Preserve admin route protection
- Validate public route access controls

## Performance Optimizations

### Caching Strategy
- Configure CDN caching for public routes
- Optimize static asset delivery
- Implement browser caching headers

### Redirect Optimization
- Use 301 redirects for SEO benefits
- Minimize redirect chains
- Optimize redirect response times

### Asset Optimization
- Configure domain-specific asset URLs
- Optimize images and static files
- Implement lazy loading for landing page