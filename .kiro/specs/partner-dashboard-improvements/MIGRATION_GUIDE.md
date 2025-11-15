# Partner Dashboard Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the old partner dashboard implementation to the improved version. It includes information about changes, rollback procedures, breaking changes, and troubleshooting.

## Table of Contents

1. [What's Changed](#whats-changed)
2. [Migration Steps](#migration-steps)
3. [Breaking Changes](#breaking-changes)
4. [Rollback Instructions](#rollback-instructions)
5. [Troubleshooting](#troubleshooting)
6. [Testing Checklist](#testing-checklist)

---

## What's Changed

### Summary of Improvements

The improved partner dashboard addresses several key issues:

1. **Language Consistency**: All components now use next-intl for translations
2. **Unified Navigation**: Single, consistent sidebar across all partner pages
3. **Removed Redundancy**: Eliminated duplicate titles and logout buttons
4. **Enhanced Features**: Improved statistics, filtering, and data visualization
5. **Better UX**: Loading states, error handling, and responsive design
6. **Performance**: Optimized data fetching and component rendering

### Component Changes

| Old Component | New Component | Status | Notes |
|--------------|---------------|--------|-------|
| `PortalNavigation` | `PartnerSidebar` | Replaced | Fully internationalized sidebar |
| Individual page layouts | `PartnerLayout` | New | Unified layout wrapper |
| Hardcoded text | Translation keys | Updated | All text uses i18n |
| Basic stat cards | `StatCard` | Enhanced | Improved styling and features |
| Simple property list | `PropertiesOverview` | Enhanced | Added filtering and sorting |
| Basic booking list | `RecentBookings` | Enhanced | Added status filters |

### File Structure Changes

```
Before:
app/[locale]/partner/
├── dashboard/
│   └── page.tsx (mixed languages, duplicate elements)
└── components/
    └── PortalNavigation.tsx (simple button)

After:
app/[locale]/partner/
├── dashboard/
│   └── page.tsx (clean, uses PartnerLayout)
└── components/
    ├── PartnerLayout.tsx (new)
    ├── PartnerSidebar.tsx (improved)
    ├── StatCard.tsx (new)
    ├── QuickActions.tsx (new)
    └── ... (other enhanced components)
```

---

## Migration Steps

### Phase 1: Preparation (Before Deployment)

#### Step 1: Backup Current Implementation

```bash
# Create backup of current partner dashboard files
mkdir -p backups/partner-dashboard-old
cp -r app/[locale]/partner backups/partner-dashboard-old/
cp -r components/partner backups/partner-dashboard-old/components/
```

#### Step 2: Review Translation Files

Ensure all translation keys are present in your language files:

```bash
# Check for missing translation keys
node scripts/check-translations.js partner
```

Required translation namespaces:
- `partner.navigation.*`
- `partner.dashboard.*`
- `partner.branding.*`

#### Step 3: Database Verification

Verify that all necessary data structures are in place:

```sql
-- Check partner role exists
SELECT * FROM user_roles WHERE role = 'partner';

-- Verify RLS policies for partner data
SELECT * FROM pg_policies WHERE tablename IN ('lofts', 'reservations', 'transactions');

-- Check partner data integrity
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(l.id) as property_count
FROM users u
LEFT JOIN lofts l ON l.owner_id = u.id
WHERE u.role = 'partner'
GROUP BY u.id, u.email, u.role;
```

### Phase 2: Deployment

#### Step 1: Deploy Translation Files

```bash
# Ensure translation files are up to date
git add messages/fr.json messages/en.json messages/ar.json
git commit -m "Add partner dashboard translation keys"
```

#### Step 2: Deploy New Components

```bash
# Deploy new component files
git add components/partner/
git commit -m "Add improved partner dashboard components"
```

#### Step 3: Update Dashboard Pages

```bash
# Deploy updated dashboard pages
git add app/[locale]/partner/
git commit -m "Update partner dashboard pages to use new layout"
```

#### Step 4: Deploy to Staging

```bash
# Push to staging branch
git push origin main:staging

# Or deploy directly to staging environment
vercel --env=staging
```

#### Step 5: Verify Staging Deployment

1. Access staging dashboard: `https://staging.yourdomain.com/fr/partner/dashboard`
2. Test all navigation items
3. Verify translations in all languages (fr, en, ar)
4. Check data loading and display
5. Test responsive behavior on mobile
6. Verify authentication and authorization

### Phase 3: Production Deployment

#### Step 1: Schedule Deployment

Choose a low-traffic period:
- Recommended: Late evening or early morning
- Avoid: Peak business hours, weekends

#### Step 2: Deploy to Production

```bash
# Deploy to production
git push origin main:production

# Or use Vercel
vercel --prod
```

#### Step 3: Monitor Deployment

Watch for errors and performance issues:

```bash
# Monitor error logs
vercel logs --prod

# Check performance metrics
# Access your monitoring dashboard (e.g., Vercel Analytics, Sentry)
```

#### Step 4: Verify Production

1. Test critical user flows
2. Verify translations
3. Check data accuracy
4. Monitor error rates
5. Gather initial user feedback

---

## Breaking Changes

### 1. Component API Changes

#### PartnerSidebar Props

**Before:**
```tsx
// Old PortalNavigation - simple button
<PortalNavigation />
```

**After:**
```tsx
// New PartnerSidebar - requires locale
<PartnerSidebar locale={locale} />
```

**Migration:**
- Add `locale` prop from page params
- Remove old `PortalNavigation` component
- Update imports

#### Page Layout Structure

**Before:**
```tsx
export default function DashboardPage() {
  return (
    <div>
      <PortalNavigation />
      <h1>Dashboard Partenaire</h1>
      <h1>Portal Partner</h1>
      {/* content */}
      <button>Logout</button>
    </div>
  );
}
```

**After:**
```tsx
export default function DashboardPage({ params }: { params: { locale: string } }) {
  return (
    <PartnerLayout locale={params.locale}>
      <div className="container mx-auto p-6">
        <DashboardHeader title={t('title')} />
        {/* content */}
      </div>
    </PartnerLayout>
  );
}
```

**Migration:**
- Wrap content with `PartnerLayout`
- Remove duplicate titles
- Remove standalone logout button
- Use translation keys for all text

### 2. Translation Key Changes

#### Navigation Keys

**Before:**
```json
{
  "dashboard": "Dashboard",
  "properties": "Properties"
}
```

**After:**
```json
{
  "partner": {
    "navigation": {
      "dashboard": "Tableau de bord",
      "properties": "Mes propriétés"
    }
  }
}
```

**Migration:**
- Update all translation references to use `partner.navigation.*` namespace
- Ensure keys exist in all language files

### 3. Route Structure

No changes to route structure. All routes remain the same:
- `/[locale]/partner/dashboard`
- `/[locale]/partner/properties`
- `/[locale]/partner/bookings`
- etc.

### 4. API Endpoints

No changes to API endpoints. All existing endpoints continue to work:
- `/api/partner/dashboard/stats`
- `/api/partner/properties`
- `/api/partner/bookings`
- etc.

### 5. Database Schema

No changes to database schema. All existing tables and columns remain unchanged.

---

## Rollback Instructions

If issues arise after deployment, follow these steps to rollback to the previous version.

### Quick Rollback (Recommended)

#### Option 1: Git Revert

```bash
# Identify the commit to revert
git log --oneline

# Revert the deployment commit
git revert <commit-hash>

# Push to production
git push origin main:production
```

#### Option 2: Vercel Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Manual Rollback

If automated rollback fails, restore from backup:

#### Step 1: Restore Files

```bash
# Restore partner dashboard files from backup
cp -r backups/partner-dashboard-old/partner app/[locale]/
cp -r backups/partner-dashboard-old/components components/partner/
```

#### Step 2: Restore Translation Keys (Optional)

If translation keys were modified:

```bash
# Restore previous translation files
git checkout HEAD~1 messages/fr.json messages/en.json messages/ar.json
```

#### Step 3: Redeploy

```bash
# Commit rollback changes
git add .
git commit -m "Rollback partner dashboard to previous version"

# Deploy
git push origin main:production
```

#### Step 4: Verify Rollback

1. Access dashboard and verify old version is restored
2. Test critical functionality
3. Monitor error rates
4. Communicate status to users if necessary

### Post-Rollback Actions

1. **Investigate Issues**: Identify what caused the need for rollback
2. **Document Problems**: Create detailed issue reports
3. **Fix in Development**: Address issues in development environment
4. **Test Thoroughly**: Ensure fixes work before redeploying
5. **Plan Redeployment**: Schedule new deployment when ready

---

## Troubleshooting

### Issue 1: Translations Not Displaying

**Symptoms:**
- Components show translation keys instead of translated text
- Example: "partner.dashboard.title" instead of "Tableau de bord"

**Diagnosis:**
```bash
# Check if translation keys exist
grep -r "partner.dashboard.title" messages/
```

**Solutions:**

1. **Missing Translation Keys**
   ```bash
   # Add missing keys to all language files
   # Edit messages/fr.json, messages/en.json, messages/ar.json
   ```

2. **Incorrect Namespace**
   ```tsx
   // Wrong
   const t = useTranslations('dashboard');
   
   // Correct
   const t = useTranslations('partner.dashboard');
   ```

3. **Cache Issue**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### Issue 2: Sidebar Not Showing

**Symptoms:**
- Sidebar is missing or not visible
- Page content takes full width

**Diagnosis:**
```tsx
// Check if PartnerLayout is being used
// Look for this in your page component:
<PartnerLayout locale={params.locale}>
```

**Solutions:**

1. **Missing PartnerLayout Wrapper**
   ```tsx
   // Add PartnerLayout wrapper
   export default function Page({ params }) {
     return (
       <PartnerLayout locale={params.locale}>
         {/* content */}
       </PartnerLayout>
     );
   }
   ```

2. **showSidebar Set to False**
   ```tsx
   // Check if showSidebar prop is set
   <PartnerLayout locale={params.locale} showSidebar={true}>
   ```

3. **CSS Conflict**
   ```bash
   # Check for CSS that might hide sidebar
   # Look for: display: none, visibility: hidden, width: 0
   ```

### Issue 3: Authentication Loop

**Symptoms:**
- Constantly redirected to login page
- Cannot access dashboard even with valid credentials

**Diagnosis:**
```sql
-- Check user role in database
SELECT id, email, role FROM users WHERE email = 'partner@example.com';
```

**Solutions:**

1. **Incorrect Role**
   ```sql
   -- Update user role to partner
   UPDATE users SET role = 'partner' WHERE email = 'partner@example.com';
   ```

2. **Session Issues**
   ```tsx
   // Clear browser cookies and try again
   // Or check session validation logic
   ```

3. **RLS Policy Issues**
   ```sql
   -- Verify RLS policies allow partner access
   SELECT * FROM pg_policies WHERE tablename = 'lofts';
   ```

### Issue 4: Data Not Loading

**Symptoms:**
- Dashboard shows loading state indefinitely
- Statistics or properties not displaying

**Diagnosis:**
```bash
# Check API endpoint responses
curl -X GET https://yourdomain.com/api/partner/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Solutions:**

1. **API Endpoint Error**
   ```bash
   # Check server logs for errors
   vercel logs --prod
   ```

2. **Database Connection**
   ```bash
   # Verify database connection
   # Check environment variables
   echo $DATABASE_URL
   ```

3. **RLS Policies**
   ```sql
   -- Check if RLS policies are blocking data
   -- Temporarily disable to test
   ALTER TABLE lofts DISABLE ROW LEVEL SECURITY;
   -- Remember to re-enable after testing!
   ```

### Issue 5: Duplicate Elements Still Showing

**Symptoms:**
- Multiple titles still visible
- Logout button appears in multiple places

**Diagnosis:**
```bash
# Search for hardcoded titles
grep -r "Dashboard Partenaire" app/[locale]/partner/
grep -r "Portal Partner" app/[locale]/partner/
```

**Solutions:**

1. **Old Code Not Removed**
   ```tsx
   // Remove duplicate title elements
   // Keep only the DashboardHeader component
   ```

2. **Cache Issue**
   ```bash
   # Clear browser cache
   # Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   ```

3. **Deployment Issue**
   ```bash
   # Verify correct version is deployed
   git log --oneline -1
   vercel ls
   ```

### Issue 6: Mobile Responsiveness Issues

**Symptoms:**
- Sidebar doesn't collapse on mobile
- Layout breaks on small screens

**Diagnosis:**
```bash
# Test on different screen sizes
# Use browser dev tools responsive mode
```

**Solutions:**

1. **Missing Responsive Classes**
   ```tsx
   // Ensure Tailwind responsive classes are used
   <div className="hidden md:block"> {/* Desktop only */}
   <div className="block md:hidden"> {/* Mobile only */}
   ```

2. **SidebarProvider Missing**
   ```tsx
   // Ensure SidebarProvider wraps the layout
   <SidebarProvider>
     <PartnerSidebar />
     <main>{children}</main>
   </SidebarProvider>
   ```

### Issue 7: Performance Degradation

**Symptoms:**
- Dashboard loads slowly
- High server response times

**Diagnosis:**
```bash
# Check performance metrics
# Use Vercel Analytics or similar tool
```

**Solutions:**

1. **Optimize Data Fetching**
   ```tsx
   // Use parallel fetching
   const [stats, properties, bookings] = await Promise.all([
     fetchStats(),
     fetchProperties(),
     fetchBookings(),
   ]);
   ```

2. **Add Caching**
   ```tsx
   // Use SWR or React Query
   const { data } = useSWR('/api/partner/stats', fetcher, {
     refreshInterval: 300000, // 5 minutes
   });
   ```

3. **Implement Code Splitting**
   ```tsx
   // Lazy load heavy components
   const PropertiesOverview = lazy(() => import('./PropertiesOverview'));
   ```

---

## Testing Checklist

Use this checklist to verify the migration was successful:

### Pre-Deployment Testing (Staging)

- [ ] All translation keys display correctly in French
- [ ] All translation keys display correctly in English
- [ ] All translation keys display correctly in Arabic
- [ ] Sidebar navigation works for all menu items
- [ ] Active navigation state highlights correctly
- [ ] User profile displays in sidebar footer
- [ ] Logout functionality works from sidebar
- [ ] No duplicate titles on dashboard page
- [ ] No standalone logout button on dashboard page
- [ ] Dashboard statistics load and display correctly
- [ ] Properties overview shows partner's properties only
- [ ] Recent bookings display correctly
- [ ] Quick actions buttons navigate correctly
- [ ] Loading states display properly
- [ ] Error states display with retry option
- [ ] Mobile responsive layout works correctly
- [ ] Sidebar collapses on mobile devices
- [ ] All links include locale prefix
- [ ] Authentication redirects work correctly
- [ ] Partner role verification works
- [ ] Data isolation verified (partners see only their data)

### Post-Deployment Testing (Production)

- [ ] Dashboard accessible at correct URL
- [ ] All translations working in production
- [ ] Navigation functions correctly
- [ ] Data loads from production database
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Performance metrics acceptable
- [ ] Mobile experience verified on real devices
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] User feedback collected and reviewed

### Rollback Testing (If Needed)

- [ ] Rollback procedure documented
- [ ] Backup files verified and accessible
- [ ] Rollback tested in staging environment
- [ ] Rollback time estimated (should be < 15 minutes)
- [ ] Communication plan for users prepared

---

## Communication Plan

### Before Deployment

**To Partners:**
```
Subject: Partner Dashboard Improvements Coming Soon

Dear Partners,

We're excited to announce improvements to your partner dashboard:
- Fully translated interface in your preferred language
- Improved navigation and user experience
- Enhanced statistics and reporting
- Better mobile experience

The update will be deployed on [DATE] at [TIME].
You may experience a brief interruption (< 5 minutes).

Thank you for your patience!
```

### During Deployment

**Status Page Update:**
```
🔧 Maintenance in Progress
We're currently deploying improvements to the partner dashboard.
Expected completion: [TIME]
```

### After Deployment

**To Partners:**
```
Subject: Partner Dashboard Improvements Now Live

Dear Partners,

The improved partner dashboard is now live! 

New features:
✓ Fully translated interface
✓ Improved navigation
✓ Enhanced statistics
✓ Better mobile experience

If you experience any issues, please contact support.

Thank you!
```

### If Rollback Needed

**To Partners:**
```
Subject: Partner Dashboard - Temporary Rollback

Dear Partners,

We've temporarily rolled back the dashboard update to address
some issues. We're working on fixes and will redeploy soon.

Your dashboard continues to work normally with the previous version.

We apologize for any inconvenience.
```

---

## Support and Resources

### Documentation

- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [Design Document](./design.md)
- [Requirements Document](./requirements.md)

### Getting Help

1. **Check Documentation**: Review this guide and component documentation
2. **Search Issues**: Check GitHub issues for similar problems
3. **Contact Team**: Reach out to development team
4. **Create Issue**: If problem persists, create detailed issue report

### Issue Report Template

```markdown
## Issue Description
[Brief description of the problem]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [e.g., Chrome 120]
- Device: [e.g., Desktop, iPhone 14]
- Locale: [e.g., fr, en, ar]
- User Role: [e.g., partner]

## Screenshots
[If applicable]

## Additional Context
[Any other relevant information]
```

---

## Post-Migration Monitoring

### Metrics to Monitor

1. **Error Rates**
   - Track 4xx and 5xx errors
   - Monitor client-side JavaScript errors
   - Alert threshold: > 1% error rate

2. **Performance**
   - Page load time
   - Time to interactive
   - API response times
   - Alert threshold: > 3s load time

3. **User Engagement**
   - Dashboard page views
   - Navigation patterns
   - Feature usage
   - Session duration

4. **Translation Coverage**
   - Missing translation key logs
   - Language distribution
   - Translation fallback usage

### Monitoring Tools

- **Vercel Analytics**: Performance and usage metrics
- **Sentry**: Error tracking and monitoring
- **Custom Logging**: Translation key misses and API errors
- **User Feedback**: Support tickets and user reports

### Success Criteria

The migration is considered successful when:

- [ ] Error rate < 0.5%
- [ ] Page load time < 2 seconds
- [ ] No critical bugs reported
- [ ] Positive user feedback
- [ ] All translations working correctly
- [ ] Mobile experience satisfactory
- [ ] Performance metrics improved or maintained

---

## Lessons Learned

After migration, document:

1. **What Went Well**
   - Successful aspects of the migration
   - Effective strategies and approaches

2. **What Could Be Improved**
   - Challenges encountered
   - Areas for improvement in future migrations

3. **Action Items**
   - Follow-up tasks
   - Process improvements
   - Documentation updates

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-15 | Initial migration guide | Development Team |

---

*For questions or support, contact the development team.*
