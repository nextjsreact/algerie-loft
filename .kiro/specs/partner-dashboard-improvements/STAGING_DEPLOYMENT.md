# Staging Deployment Guide - Partner Dashboard Improvements

## Overview

This document provides instructions for deploying the improved partner dashboard to the staging environment and verifying that all functionality works correctly.

## Pre-Deployment Checklist

### Code Review

- [x] All tasks completed and marked as done
- [x] Code reviewed and approved
- [x] No console errors in development
- [x] TypeScript compilation successful
- [x] ESLint checks passing
- [x] All tests passing

### Translation Files

- [x] French translations complete (messages/fr.json)
- [x] English translations complete (messages/en.json)
- [x] Arabic translations complete (messages/ar.json)
- [x] Translation keys validated
- [x] No missing translation warnings

### Component Files

- [x] PartnerSidebar component implemented
- [x] PartnerLayout component implemented
- [x] StatCard component implemented
- [x] QuickActions component implemented
- [x] DashboardHeader component implemented
- [x] All sub-components implemented

### Documentation

- [x] Component documentation created
- [x] Migration guide created
- [x] API documentation updated (if needed)
- [x] README updated (if needed)

---

## Deployment Steps

### Step 1: Verify Local Build

Before deploying to staging, ensure the application builds successfully locally:

```bash
# Clean previous builds
rm -rf .next

# Install dependencies (if needed)
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build the application
npm run build

# Test the production build locally
npm run start
```

**Verification:**
- Build completes without errors
- No TypeScript errors
- No ESLint errors
- Application starts successfully
- Dashboard accessible at http://localhost:3000/fr/partner/dashboard

### Step 2: Commit Changes

```bash
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Improve partner dashboard with i18n and enhanced features

- Add PartnerSidebar with full internationalization
- Implement PartnerLayout wrapper component
- Remove duplicate titles and logout buttons
- Add enhanced statistics display with StatCard
- Implement QuickActions component
- Add filtering and sorting for properties and bookings
- Improve error handling and loading states
- Add comprehensive documentation and migration guide
- Optimize performance with data caching
- Ensure data security and isolation

Closes #[ISSUE_NUMBER]"

# Push to repository
git push origin main
```

### Step 3: Deploy to Staging

#### Option A: Vercel Deployment

```bash
# Deploy to staging environment
vercel --env=staging

# Or if you have a staging branch
git push origin main:staging
```

#### Option B: Manual Deployment

If using a different hosting platform, follow your platform's deployment process.

### Step 4: Wait for Deployment

Monitor the deployment process:

```bash
# Check deployment status (Vercel)
vercel ls

# View deployment logs
vercel logs --env=staging
```

**Expected Duration:** 2-5 minutes

---

## Post-Deployment Verification

### Automated Checks

Run automated verification script:

```bash
# Run staging verification script
node .kiro/specs/partner-dashboard-improvements/verify-staging.js
```

### Manual Verification

#### 1. Access Staging Dashboard

**URL:** `https://staging.yourdomain.com/fr/partner/dashboard`

**Test Accounts:**
- Partner 1: `partner1@test.com` / `test-password`
- Partner 2: `partner2@test.com` / `test-password`

#### 2. Visual Inspection

- [ ] Page loads without errors
- [ ] Sidebar displays correctly
- [ ] Navigation items are visible
- [ ] User profile shows in sidebar footer
- [ ] Dashboard content displays properly
- [ ] No duplicate titles
- [ ] No standalone logout button
- [ ] Statistics cards display correctly
- [ ] Quick actions section visible
- [ ] Properties overview displays
- [ ] Recent bookings section displays

#### 3. Translation Testing

**French (fr):**
- [ ] Access: `https://staging.yourdomain.com/fr/partner/dashboard`
- [ ] All sidebar items in French
- [ ] Dashboard title: "Tableau de bord partenaire"
- [ ] All statistics labels in French
- [ ] All buttons and actions in French
- [ ] No English text visible

**English (en):**
- [ ] Access: `https://staging.yourdomain.com/en/partner/dashboard`
- [ ] All sidebar items in English
- [ ] Dashboard title: "Partner Dashboard"
- [ ] All statistics labels in English
- [ ] All buttons and actions in English
- [ ] No French text visible

**Arabic (ar):**
- [ ] Access: `https://staging.yourdomain.com/ar/partner/dashboard`
- [ ] All sidebar items in Arabic
- [ ] Dashboard title: "لوحة تحكم الشريك"
- [ ] RTL layout applied correctly
- [ ] All text in Arabic
- [ ] No French or English text visible

#### 4. Navigation Testing

Test all sidebar navigation items:

- [ ] Dashboard → `/[locale]/partner/dashboard`
- [ ] Properties → `/[locale]/partner/properties`
- [ ] Bookings → `/[locale]/partner/bookings`
- [ ] Revenue → `/[locale]/partner/revenue`
- [ ] Analytics → `/[locale]/partner/analytics`
- [ ] Messages → `/[locale]/partner/messages`
- [ ] Settings → `/[locale]/partner/settings`

**Verify:**
- Active state highlights current page
- Locale is preserved in navigation
- No 404 errors

#### 5. Functionality Testing

**Statistics Display:**
- [ ] Total properties count displays
- [ ] Active properties count displays
- [ ] Bookings count displays
- [ ] Monthly revenue displays
- [ ] Occupancy rate displays
- [ ] All values are accurate

**Quick Actions:**
- [ ] "Add Property" button works
- [ ] "Manage Properties" button works
- [ ] "View Calendar" button works
- [ ] "Financial Reports" button works
- [ ] All buttons navigate correctly

**Properties Overview:**
- [ ] Properties list displays
- [ ] Property cards show correct information
- [ ] Status badges display correctly
- [ ] Filtering works (if implemented)
- [ ] Sorting works (if implemented)
- [ ] Empty state shows when no properties

**Recent Bookings:**
- [ ] Bookings list displays
- [ ] Booking cards show correct information
- [ ] Status badges display correctly
- [ ] Payment status displays correctly
- [ ] Filtering works (if implemented)
- [ ] Empty state shows when no bookings

**User Profile:**
- [ ] User name displays in sidebar footer
- [ ] User email displays
- [ ] Avatar displays (or initials fallback)
- [ ] Dropdown menu opens on click
- [ ] Settings option works
- [ ] Logout option works

#### 6. Authentication & Authorization

**Login Flow:**
- [ ] Can login as partner user
- [ ] Redirected to dashboard after login
- [ ] Session persists across page refreshes

**Authorization:**
- [ ] Partner users can access dashboard
- [ ] Non-partner users are redirected
- [ ] Unauthenticated users redirected to login

**Data Isolation:**
- [ ] Partner 1 sees only their properties
- [ ] Partner 2 sees only their properties
- [ ] No data leakage between partners

#### 7. Responsive Design

**Desktop (1920x1080):**
- [ ] Sidebar fully visible
- [ ] Content properly laid out
- [ ] All elements accessible
- [ ] No horizontal scroll

**Tablet (768x1024):**
- [ ] Sidebar adapts correctly
- [ ] Content reflows properly
- [ ] Touch interactions work
- [ ] No layout issues

**Mobile (375x667):**
- [ ] Sidebar collapses to hamburger menu
- [ ] Mobile menu opens/closes correctly
- [ ] Content stacks vertically
- [ ] All features accessible
- [ ] Touch targets adequate size

#### 8. Error Handling

**Network Errors:**
- [ ] Simulate network failure
- [ ] Error message displays
- [ ] Retry button appears
- [ ] Retry functionality works

**Loading States:**
- [ ] Loading skeletons display
- [ ] Smooth transition to content
- [ ] No layout shift

**Empty States:**
- [ ] Empty properties state displays correctly
- [ ] Empty bookings state displays correctly
- [ ] Call-to-action buttons work

#### 9. Performance Testing

**Page Load:**
- [ ] Initial load < 3 seconds
- [ ] Time to interactive < 3 seconds
- [ ] No blocking resources

**API Calls:**
- [ ] Dashboard stats API responds < 1 second
- [ ] Properties API responds < 1 second
- [ ] Bookings API responds < 1 second
- [ ] Parallel loading works

**Browser Console:**
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No network errors
- [ ] No missing translation warnings

#### 10. Cross-Browser Testing

**Chrome:**
- [ ] Dashboard loads correctly
- [ ] All features work
- [ ] No visual issues

**Firefox:**
- [ ] Dashboard loads correctly
- [ ] All features work
- [ ] No visual issues

**Safari:**
- [ ] Dashboard loads correctly
- [ ] All features work
- [ ] No visual issues

**Edge:**
- [ ] Dashboard loads correctly
- [ ] All features work
- [ ] No visual issues

---

## Database Verification

### Check Partner Data

```sql
-- Verify partner users exist
SELECT 
  id,
  email,
  role,
  created_at
FROM users
WHERE role = 'partner'
ORDER BY created_at DESC
LIMIT 10;

-- Check partner properties
SELECT 
  l.id,
  l.name,
  l.owner_id,
  u.email as owner_email,
  l.status,
  l.price_per_night
FROM lofts l
JOIN users u ON u.id = l.owner_id
WHERE u.role = 'partner'
ORDER BY l.created_at DESC
LIMIT 10;

-- Check partner bookings
SELECT 
  r.id,
  r.booking_reference,
  r.check_in,
  r.check_out,
  r.status,
  r.total_price,
  l.name as loft_name,
  u.email as partner_email
FROM reservations r
JOIN lofts l ON l.id = r.loft_id
JOIN users u ON u.id = l.owner_id
WHERE u.role = 'partner'
ORDER BY r.created_at DESC
LIMIT 10;
```

### Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('lofts', 'reservations', 'transactions')
  AND schemaname = 'public';

-- Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('lofts', 'reservations', 'transactions')
ORDER BY tablename, policyname;
```

---

## Performance Monitoring

### Metrics to Track

1. **Page Load Time**
   - Target: < 2 seconds
   - Measure: Time to first contentful paint

2. **API Response Time**
   - Target: < 500ms
   - Measure: Time from request to response

3. **Error Rate**
   - Target: < 0.5%
   - Measure: Errors / Total requests

4. **User Engagement**
   - Measure: Page views, session duration
   - Track: Navigation patterns

### Monitoring Tools

```bash
# Vercel Analytics
# Access: https://vercel.com/[your-team]/[your-project]/analytics

# Check performance metrics
vercel logs --env=staging | grep "GET /fr/partner/dashboard"

# Monitor error rates
vercel logs --env=staging | grep "ERROR"
```

---

## Issue Tracking

### Known Issues

Document any issues found during staging verification:

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Example: Translation key missing | Low | Open | Add key to ar.json |
| | | | |

### Issue Template

```markdown
## Issue: [Brief Description]

**Severity:** [Critical / High / Medium / Low]

**Environment:** Staging

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [...]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Browser/Device:**
[e.g., Chrome 120 on Windows 11]

**Locale:**
[e.g., fr, en, ar]

**Proposed Solution:**
[If known]
```

---

## Rollback Plan

If critical issues are found in staging:

### Step 1: Document Issues

- List all critical issues
- Assess impact and severity
- Determine if rollback is necessary

### Step 2: Decide on Action

**Option A: Fix Forward**
- Issues are minor and can be fixed quickly
- Deploy fixes to staging
- Re-verify functionality

**Option B: Rollback**
- Issues are critical and require significant work
- Rollback to previous version
- Fix issues in development
- Redeploy when ready

### Step 3: Execute Rollback (if needed)

```bash
# Revert to previous deployment
vercel rollback [previous-deployment-url] --env=staging

# Or revert git commits
git revert HEAD
git push origin main:staging
```

---

## Sign-Off

### Staging Verification Complete

**Verified By:** [Name]  
**Date:** [Date]  
**Time:** [Time]

**Summary:**
- [ ] All functionality verified
- [ ] All translations working
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Issues Found:** [Number]
- Critical: [Number]
- High: [Number]
- Medium: [Number]
- Low: [Number]

**Recommendation:**
- [ ] Proceed to production deployment
- [ ] Fix issues before production
- [ ] Rollback and reassess

**Notes:**
[Any additional notes or observations]

---

## Next Steps

After successful staging verification:

1. **Review Results**: Team review of staging verification
2. **Address Issues**: Fix any issues found during testing
3. **Update Documentation**: Update docs based on findings
4. **Plan Production**: Schedule production deployment
5. **Prepare Communication**: Draft user communication
6. **Production Deployment**: Follow production deployment guide

---

*For questions or issues, contact the development team.*
