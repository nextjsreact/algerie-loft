# 🧪 Testing Guide for Loft Algérie Public Website

## 🚀 Quick Start Testing

The development server is running on `http://localhost:3001`

## 📋 SEO & Performance Testing Checklist

### 1. **SEO Meta Tags Testing**
Open your browser and navigate to `http://localhost:3001`, then:

**Check HTML Head Elements:**
- Right-click → "View Page Source"
- Look for these elements:

```html
<!-- Basic Meta Tags -->
<title>Loft Algérie - Gestion Professionnelle de Propriétés</title>
<meta name="description" content="Services professionnels de gestion de lofts...">
<meta name="keywords" content="gestion propriétés Algérie, location lofts...">

<!-- Open Graph Tags -->
<meta property="og:title" content="Loft Algérie - Gestion Professionnelle de Propriétés">
<meta property="og:description" content="Services professionnels...">
<meta property="og:image" content="/images/og-default.jpg">
<meta property="og:url" content="https://loft-algerie.com">

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@LoftAlgerie">
```

### 2. **Structured Data Testing**
**Check for JSON-LD structured data:**
- View page source and search for `application/ld+json`
- Should find Organization and Website schema markup

**Validate with Google's Rich Results Test:**
1. Go to: https://search.google.com/test/rich-results
2. Enter: `http://localhost:3001`
3. Check for valid structured data

### 3. **Sitemap Testing**
**Test sitemap generation:**
- Visit: `http://localhost:3001/sitemap.xml`
- Should see XML sitemap with all pages
- Check for proper URLs and lastModified dates

**Test robots.txt:**
- Visit: `http://localhost:3001/robots.txt`
- Should see proper directives and sitemap reference

### 4. **Performance Testing**

#### **Core Web Vitals (Browser DevTools)**
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Run "Performance" audit
4. Check Core Web Vitals scores:
   - **LCP (Largest Contentful Paint)**: < 2.5s
   - **FID (First Input Delay)**: < 100ms
   - **CLS (Cumulative Layout Shift)**: < 0.1

#### **Network Performance**
1. DevTools → Network tab
2. Reload page
3. Check:
   - Total load time
   - Number of requests
   - Total transfer size
   - Image optimization (WebP/AVIF formats)

#### **Image Optimization**
1. Check images are using Next.js Image component
2. Verify WebP/AVIF format delivery
3. Test lazy loading (scroll down to see images load)

### 5. **Analytics Testing**

#### **Google Analytics 4**
1. Open browser console (F12)
2. Look for GA4 initialization messages
3. Check `window.gtag` function exists
4. Test event tracking:
   ```javascript
   // In browser console
   gtag('event', 'test_event', { event_category: 'Test' });
   ```

#### **Web Vitals Monitoring**
1. Open browser console
2. Look for "Web Vital:" messages
3. Navigate around the site to trigger measurements

#### **Error Tracking (Sentry)**
1. Check console for Sentry initialization
2. Test error tracking:
   ```javascript
   // In browser console (will trigger error tracking)
   throw new Error('Test error for Sentry');
   ```

### 6. **Accessibility Testing**

#### **Keyboard Navigation**
- Tab through all interactive elements
- Ensure focus indicators are visible
- Test skip links

#### **Screen Reader Testing**
- Use browser's built-in screen reader
- Check for proper heading hierarchy (h1, h2, h3...)
- Verify alt text on images

#### **Color Contrast**
- Use browser DevTools accessibility panel
- Check contrast ratios meet WCAG standards

### 7. **Mobile Responsiveness**

#### **Device Testing**
1. DevTools → Toggle device toolbar
2. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1200px+)

#### **Touch Interactions**
- Test button sizes (minimum 44px)
- Check touch targets don't overlap
- Verify swipe gestures work

### 8. **Internationalization Testing**

#### **Language Switching**
- Test language switcher functionality
- Verify content changes language
- Check URL structure (/en, /fr, /ar)

#### **RTL Support (Arabic)**
- Switch to Arabic language
- Verify right-to-left layout
- Check text alignment and spacing

## 🔧 Automated Testing Commands

Run these commands in the `public-website` directory:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting check
npm run format:check

# Build test (production)
npm run build

# Start production server
npm run start
```

## 📊 Performance Benchmarks

### Target Metrics:
- **Lighthouse Performance Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### SEO Targets:
- **Lighthouse SEO Score**: 100
- **Meta tags**: All present and valid
- **Structured data**: Valid schema.org markup
- **Sitemap**: Generated and accessible
- **Mobile-friendly**: Passes Google's mobile test

## 🐛 Common Issues & Solutions

### Build Issues:
- **Permission errors**: Run as administrator or check file permissions
- **Memory issues**: Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`

### Performance Issues:
- **Slow loading**: Check image optimization and lazy loading
- **High CLS**: Verify image dimensions are specified
- **Poor LCP**: Optimize hero image loading

### SEO Issues:
- **Missing meta tags**: Check layout.tsx implementation
- **Invalid structured data**: Validate with Google's testing tool
- **Sitemap errors**: Check API route implementation

## 📈 Monitoring in Production

### Analytics Dashboards:
- Google Analytics 4: Real-time and audience reports
- Google Search Console: SEO performance and indexing
- Core Web Vitals: Performance monitoring

### Error Monitoring:
- Sentry Dashboard: Error tracking and performance
- Browser console: Client-side error logs
- Server logs: API and build errors

## ✅ Testing Completion Checklist

- [ ] All pages load without errors
- [ ] Meta tags are present and correct
- [ ] Structured data validates
- [ ] Sitemap generates properly
- [ ] Images are optimized (WebP/AVIF)
- [ ] Core Web Vitals meet targets
- [ ] Analytics tracking works
- [ ] Error tracking is functional
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards met
- [ ] Internationalization works
- [ ] Performance targets achieved

---

## 🎯 Next Steps After Testing

1. **Fix any identified issues**
2. **Deploy to staging environment**
3. **Run production performance tests**
4. **Set up monitoring dashboards**
5. **Configure production analytics**
6. **Submit sitemap to Google Search Console**