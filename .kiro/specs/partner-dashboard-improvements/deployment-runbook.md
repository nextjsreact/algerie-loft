# Partner Dashboard Improvements - Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the improved partner dashboard to staging and production environments. The deployment includes comprehensive translation support, improved UI/UX, and enhanced functionality.

---

## Pre-Deployment Checklist

### Code Quality Verification
- [ ] All tasks in tasks.md are marked as complete (except deployment tasks)
- [ ] No console errors in development environment
- [ ] All TypeScript compilation errors resolved
- [ ] ESLint passes without errors: `npm run lint`
- [ ] Build succeeds locally: `npm run build`
- [ ] Application starts successfully: `npm run start`

### Translation Verification
- [ ] All translation keys exist in messages/fr.json
- [ ] All translation keys exist in messages/en.json
- [ ] All translation keys exist in messages/ar.json
- [ ] No hardcoded text remains in partner dashboard components
- [ ] Run translation validation: `npm run validate:translations`

### Testing Verification
- [ ] Manual testing completed for all partner dashboard features
- [ ] Language switching works correctly (fr, en, ar)
- [ ] Sidebar navigation functions properly
- [ ] User profile dropdown works
- [ ] Dashboard statistics display correctly
- [ ] Properties and bookings sections render properly
- [ ] Responsive design verified on mobile devices
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)

### Database & API Verification
- [ ] All API endpoints tested and working
- [ ] Database queries optimized
- [ ] RLS policies verified for partner data isolation
- [ ] Session management tested
- [ ] Authentication flows verified

### Environment Configuration
- [ ] Staging environment variables configured in Vercel
- [ ] Production environment variables configured in Vercel
- [ ] Supabase URLs and keys verified
- [ ] Feature flags configured (if applicable)

---

## Task 14.3: Deploy to Staging Environment

### Step 1: Prepare Staging Branch

```bash
# Ensure you're on the main branch with latest changes
git checkout main
git pull origin main

# Create or update staging branch
git checkout -b staging
git push origin staging
```

### Step 2: Configure Staging Environment in Vercel

#### Option A: Via Vercel Dashboard

1. **Login to Vercel**
   - Go to https://vercel.com
   - Navigate to your project

2. **Configure Staging Environment**
   - Go to Settings → Git
   - Add staging branch for preview deployments
   - Or create a separate staging project

3. **Set Environment Variables**
   Navigate to Settings → Environment Variables and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<staging_supabase_url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<staging_service_role_key>
   NEXT_PUBLIC_APP_URL=<staging_url>
   NEXTAUTH_URL=<staging_url>
   NEXTAUTH_SECRET=<staging_secret>
   NODE_ENV=staging
   ```

   **Important**: Select "Preview" environment for these variables

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Set staging environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
# ... add other variables
```

### Step 3: Deploy to Staging

#### Automatic Deployment (Recommended)

```bash
# Push to staging branch - triggers automatic deployment
git push origin staging
```

Vercel will automatically:
- Detect the push
- Run build process
- Deploy to staging URL
- Provide deployment URL in GitHub PR or Vercel dashboard

#### Manual Deployment via CLI

```bash
# Deploy to preview (staging)
vercel --env=preview

# Or use the custom script
npm run deploy:staging
```

### Step 4: Verify Staging Deployment

#### A. Access Staging Environment

1. Get staging URL from Vercel dashboard or CLI output
2. Open staging URL in browser: `https://your-app-staging.vercel.app`

#### B. Functional Testing Checklist

**Authentication & Authorization**
- [ ] Login as partner user works
- [ ] Session persists correctly
- [ ] Unauthorized users are redirected
- [ ] Logout works properly

**Partner Dashboard - French (fr)**
- [ ] Navigate to `/fr/partner/dashboard`
- [ ] Verify all text is in French
- [ ] Check sidebar navigation labels
- [ ] Verify dashboard title and subtitle
- [ ] Check statistics cards display
- [ ] Verify quick actions buttons
- [ ] Test properties overview section
- [ ] Test recent bookings section

**Partner Dashboard - English (en)**
- [ ] Navigate to `/en/partner/dashboard`
- [ ] Verify all text is in English
- [ ] Test all sections as above

**Partner Dashboard - Arabic (ar)**
- [ ] Navigate to `/ar/partner/dashboard`
- [ ] Verify all text is in Arabic
- [ ] Verify RTL layout works correctly
- [ ] Test all sections as above

**Navigation & Interaction**
- [ ] Sidebar navigation works
- [ ] Active page highlighting works
- [ ] User profile dropdown functions
- [ ] Language switching works
- [ ] Mobile responsive menu works
- [ ] All links navigate correctly

**Data Display**
- [ ] Statistics load correctly
- [ ] Properties display with correct data
- [ ] Bookings show accurate information
- [ ] Loading states appear properly
- [ ] Error states display correctly

**Performance**
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] No 404 errors for assets
- [ ] Images load properly

#### C. Database Verification

```bash
# Connect to staging database and verify
# Check that partner data is isolated correctly
# Verify RLS policies are working
```

#### D. Monitor Staging Logs

```bash
# View real-time logs
vercel logs <staging-deployment-url> --follow

# Or via Vercel dashboard
# Navigate to Deployments → Select staging deployment → View Logs
```

### Step 5: Staging Testing Period

**Duration**: 24-48 hours minimum

**Activities**:
- [ ] Perform comprehensive manual testing
- [ ] Test with actual partner users (if possible)
- [ ] Monitor error rates in Vercel dashboard
- [ ] Check performance metrics
- [ ] Verify no regressions in other features
- [ ] Test edge cases and error scenarios

**Monitoring Checklist**:
- [ ] Check Vercel Analytics for errors
- [ ] Monitor API response times
- [ ] Review server logs for warnings
- [ ] Check database query performance
- [ ] Verify no memory leaks

### Step 6: Document Staging Results

Create a staging test report:

```markdown
# Staging Deployment Test Report

**Deployment Date**: [Date]
**Deployment URL**: [Staging URL]
**Tested By**: [Your Name]

## Test Results

### Functional Tests
- Authentication: ✅ Pass / ❌ Fail
- French Translation: ✅ Pass / ❌ Fail
- English Translation: ✅ Pass / ❌ Fail
- Arabic Translation: ✅ Pass / ❌ Fail
- Navigation: ✅ Pass / ❌ Fail
- Data Display: ✅ Pass / ❌ Fail

### Performance Metrics
- Page Load Time: [X] seconds
- API Response Time: [X] ms
- Error Rate: [X]%

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendation
✅ Approved for production deployment
❌ Requires fixes before production
```

### Step 7: Fix Issues (If Any)

If issues are found:

```bash
# Create fix branch
git checkout -b fix/staging-issues

# Make fixes
# ... code changes ...

# Commit and push
git add .
git commit -m "fix: resolve staging issues"
git push origin fix/staging-issues

# Merge to staging
git checkout staging
git merge fix/staging-issues
git push origin staging

# Repeat verification steps
```

---

## Task 14.4: Deploy to Production

### Prerequisites

- [ ] Staging deployment successful
- [ ] All staging tests passed
- [ ] No critical issues found
- [ ] Stakeholder approval obtained
- [ ] Rollback plan prepared
- [ ] Team notified of deployment window

### Step 1: Create Production Deployment Plan

**Deployment Window**:
- **Recommended Time**: Low-traffic period (e.g., 2 AM - 4 AM local time, or Sunday evening)
- **Scheduled Date**: [Select date]
- **Scheduled Time**: [Select time]
- **Duration**: Estimated 30-60 minutes
- **Team Availability**: Ensure key team members are available

**Communication Plan**:
- [ ] Notify all stakeholders 48 hours in advance
- [ ] Send reminder 24 hours before
- [ ] Send final reminder 2 hours before
- [ ] Prepare status update template

### Step 2: Prepare Rollback Strategy

#### A. Document Current Production State

```bash
# Note current production deployment ID
vercel ls --prod

# Save current deployment URL
# Production URL: https://your-app.vercel.app
# Deployment ID: [deployment-id]
```

#### B. Create Rollback Script

Create `scripts/rollback-production.sh`:

```bash
#!/bin/bash

# Rollback script for partner dashboard deployment
PREVIOUS_DEPLOYMENT_ID="[deployment-id-from-step-above]"

echo "Rolling back to deployment: $PREVIOUS_DEPLOYMENT_ID"
vercel promote $PREVIOUS_DEPLOYMENT_ID --prod

echo "Rollback complete. Verifying..."
curl -I https://your-app.vercel.app
```

#### C. Test Rollback Process in Staging

```bash
# Practice rollback in staging first
vercel ls --env=preview
vercel promote [previous-staging-deployment-id] --env=preview
```

### Step 3: Pre-Production Verification

**24 Hours Before Deployment**:
- [ ] Final code review completed
- [ ] All tests passing
- [ ] Staging environment stable
- [ ] Database backup completed
- [ ] Rollback script tested
- [ ] Team briefed on deployment plan

**2 Hours Before Deployment**:
- [ ] Verify staging is still working
- [ ] Check production environment health
- [ ] Confirm team availability
- [ ] Prepare monitoring dashboards

### Step 4: Production Deployment

#### A. Create Production Release

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# Create release tag
git tag -a v2.1.0-partner-dashboard -m "Partner Dashboard Improvements Release"
git push origin v2.1.0-partner-dashboard
```

#### B. Deploy to Production

**Option 1: Automatic Deployment (Recommended)**

```bash
# Merge staging to main (if using staging branch)
git checkout main
git merge staging
git push origin main

# Vercel will automatically deploy to production
```

**Option 2: Manual Deployment via CLI**

```bash
# Deploy to production
vercel --prod

# Or use custom script
npm run deploy:prod
```

**Option 3: Via Vercel Dashboard**

1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find the staging deployment that passed all tests
4. Click "Promote to Production"

#### C. Monitor Deployment Progress

```bash
# Watch deployment logs in real-time
vercel logs --prod --follow

# Or monitor via Vercel dashboard
```

### Step 5: Post-Deployment Verification

#### A. Immediate Verification (First 15 minutes)

**Health Check**:
```bash
# Check if site is accessible
curl -I https://your-app.vercel.app

# Check partner dashboard endpoint
curl -I https://your-app.vercel.app/fr/partner/dashboard
```

**Quick Smoke Tests**:
- [ ] Homepage loads
- [ ] Login works
- [ ] Partner dashboard accessible
- [ ] French version works: `/fr/partner/dashboard`
- [ ] English version works: `/en/partner/dashboard`
- [ ] Arabic version works: `/ar/partner/dashboard`
- [ ] Sidebar navigation functions
- [ ] No console errors
- [ ] No 500 errors

#### B. Comprehensive Verification (First Hour)

**Functional Tests** (Same as staging):
- [ ] Authentication flows
- [ ] All language versions
- [ ] Navigation and interactions
- [ ] Data display accuracy
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

**Performance Monitoring**:
- [ ] Check Vercel Analytics dashboard
- [ ] Monitor error rates (should be < 1%)
- [ ] Check API response times (should be < 500ms)
- [ ] Verify page load times (should be < 3s)
- [ ] Monitor database query performance

**User Monitoring**:
- [ ] Watch for user-reported issues
- [ ] Monitor support channels
- [ ] Check social media mentions
- [ ] Review feedback forms

#### C. Extended Monitoring (First 24 Hours)

**Metrics to Track**:
- Error rate trends
- Performance degradation
- User engagement metrics
- API endpoint health
- Database connection pool
- Memory usage
- CPU usage

**Monitoring Tools**:
```bash
# View production logs
vercel logs --prod

# Check specific time range
vercel logs --prod --since=1h

# Monitor specific function
vercel logs --prod --function=api/partner/dashboard
```

### Step 6: Rollback Procedure (If Needed)

**Rollback Triggers**:
- Error rate > 5%
- Critical functionality broken
- Data integrity issues
- Performance degradation > 50%
- Security vulnerability discovered

**Rollback Steps**:

```bash
# 1. Announce rollback to team
echo "Initiating rollback due to: [reason]"

# 2. Execute rollback
vercel promote [previous-deployment-id] --prod

# 3. Verify rollback successful
curl -I https://your-app.vercel.app

# 4. Monitor for stability
vercel logs --prod --follow

# 5. Notify stakeholders
# Send rollback notification email/message
```

**Post-Rollback**:
- [ ] Document rollback reason
- [ ] Identify root cause
- [ ] Create fix plan
- [ ] Schedule new deployment
- [ ] Update stakeholders

### Step 7: Success Criteria & Sign-off

**Deployment is considered successful when**:
- [ ] All smoke tests pass
- [ ] Error rate < 1%
- [ ] Performance metrics within acceptable range
- [ ] No critical bugs reported
- [ ] User feedback is positive
- [ ] 24-hour monitoring period completed without issues

**Sign-off Checklist**:
- [ ] Technical lead approval
- [ ] Product owner approval
- [ ] QA team approval
- [ ] Stakeholder notification sent
- [ ] Documentation updated
- [ ] Deployment report completed

### Step 8: Post-Deployment Activities

#### A. Update Documentation

- [ ] Update CHANGELOG.md with release notes
- [ ] Update README.md if needed
- [ ] Document any configuration changes
- [ ] Update API documentation
- [ ] Create user-facing release notes

#### B. Gather Feedback

**First Week**:
- [ ] Monitor user feedback channels
- [ ] Conduct user surveys
- [ ] Review analytics data
- [ ] Track feature adoption
- [ ] Identify improvement opportunities

**Feedback Collection Methods**:
- User surveys
- Support ticket analysis
- Analytics review
- Direct user interviews
- A/B testing results (if applicable)

#### C. Performance Analysis

Create performance report:

```markdown
# Production Deployment Performance Report

**Deployment Date**: [Date]
**Monitoring Period**: [Date Range]

## Metrics

### Performance
- Average Page Load Time: [X]s
- API Response Time (p95): [X]ms
- Error Rate: [X]%
- Uptime: [X]%

### User Engagement
- Daily Active Users: [X]
- Feature Adoption Rate: [X]%
- User Satisfaction Score: [X]/10

### Issues
- Critical: [X]
- Major: [X]
- Minor: [X]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

#### D. Cleanup Tasks

- [ ] Remove staging branch (if temporary)
- [ ] Archive old deployment logs
- [ ] Clean up test data
- [ ] Remove debug code
- [ ] Update project board/tickets

---

## Monitoring & Alerting

### Key Metrics to Monitor

**Application Health**:
- Uptime percentage
- Error rate
- Response time (p50, p95, p99)
- Request volume

**User Experience**:
- Page load time
- Time to interactive
- Core Web Vitals (LCP, FID, CLS)
- Bounce rate

**Business Metrics**:
- Partner dashboard usage
- Feature adoption
- User satisfaction
- Support ticket volume

### Monitoring Tools

**Vercel Analytics**:
- Access: Vercel Dashboard → Analytics
- Metrics: Performance, errors, traffic

**Vercel Logs**:
```bash
# Real-time logs
vercel logs --prod --follow

# Filter by severity
vercel logs --prod --level=error

# Time-based filtering
vercel logs --prod --since=1h
```

**Custom Monitoring Script**:

Create `scripts/monitor-production.sh`:

```bash
#!/bin/bash

# Monitor production health
echo "Checking production health..."

# Check homepage
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app)
echo "Homepage Status: $HOMEPAGE_STATUS"

# Check partner dashboard
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/fr/partner/dashboard)
echo "Dashboard Status: $DASHBOARD_STATUS"

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/api/health)
echo "API Status: $API_STATUS"

# Alert if any check fails
if [ "$HOMEPAGE_STATUS" != "200" ] || [ "$DASHBOARD_STATUS" != "200" ] || [ "$API_STATUS" != "200" ]; then
    echo "⚠️  ALERT: Production health check failed!"
    # Send alert notification
fi
```

### Alert Configuration

**Set up alerts for**:
- Error rate > 5%
- Response time > 3s
- Uptime < 99%
- Failed deployments
- Database connection issues

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Issue 1: Deployment Fails

**Symptoms**: Build fails, deployment doesn't complete

**Solutions**:
```bash
# Check build logs
vercel logs [deployment-url]

# Common fixes:
# 1. Clear cache and rebuild
vercel --force

# 2. Check environment variables
vercel env ls

# 3. Verify dependencies
npm ci
npm run build
```

#### Issue 2: Translation Keys Missing

**Symptoms**: English text appears in French/Arabic versions

**Solutions**:
```bash
# Validate translations
npm run validate:translations

# Check translation files
cat messages/fr.json | grep "partner.dashboard"

# Fix missing keys
# Add missing keys to translation files
```

#### Issue 3: Authentication Issues

**Symptoms**: Users can't login, session expires immediately

**Solutions**:
- Verify Supabase URL and keys in environment variables
- Check Supabase redirect URLs configuration
- Verify NEXTAUTH_URL matches deployment URL
- Check session cookie settings

#### Issue 4: Performance Degradation

**Symptoms**: Slow page loads, high response times

**Solutions**:
```bash
# Check bundle size
npm run build:analyze

# Optimize images
npm run perf:optimize-images

# Review database queries
# Check for N+1 queries
# Add database indexes if needed
```

#### Issue 5: Data Not Displaying

**Symptoms**: Empty dashboard, no statistics

**Solutions**:
- Verify API endpoints are accessible
- Check RLS policies in Supabase
- Verify partner user has correct role
- Check browser console for errors
- Review API logs for errors

---

## Emergency Contacts

**Deployment Team**:
- Technical Lead: [Name] - [Contact]
- DevOps Engineer: [Name] - [Contact]
- QA Lead: [Name] - [Contact]

**Escalation Path**:
1. On-call engineer
2. Technical lead
3. Engineering manager
4. CTO

**Support Channels**:
- Slack: #deployments
- Email: deployments@company.com
- Phone: [Emergency number]

---

## Deployment Checklist Summary

### Pre-Deployment
- [ ] Code quality verified
- [ ] Translations validated
- [ ] Testing completed
- [ ] Environment configured
- [ ] Team notified

### Staging Deployment
- [ ] Staging branch prepared
- [ ] Environment variables set
- [ ] Deployed to staging
- [ ] Functional testing completed
- [ ] Performance verified
- [ ] Issues documented and fixed

### Production Deployment
- [ ] Deployment plan created
- [ ] Rollback strategy prepared
- [ ] Pre-production verification done
- [ ] Deployed to production
- [ ] Post-deployment verification completed
- [ ] Monitoring active
- [ ] Success criteria met

### Post-Deployment
- [ ] Documentation updated
- [ ] Feedback gathered
- [ ] Performance analyzed
- [ ] Cleanup completed
- [ ] Lessons learned documented

---

## Appendix

### A. Environment Variables Reference

**Required Variables**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[random-secret]

# Environment
NODE_ENV=production
```

### B. Useful Commands

```bash
# Deployment
vercel --prod                    # Deploy to production
vercel --env=preview            # Deploy to staging
vercel promote [deployment-id]  # Promote deployment

# Monitoring
vercel logs --prod --follow     # Real-time logs
vercel ls --prod                # List deployments
vercel inspect [deployment-id]  # Inspect deployment

# Environment
vercel env ls                   # List environment variables
vercel env add [name]           # Add environment variable
vercel env rm [name]            # Remove environment variable

# Project
vercel link                     # Link local project
vercel pull                     # Pull environment variables
```

### C. Related Documentation

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- Project README: `README.md`
- Deployment Guide: `DEPLOYMENT.md`

---

**Document Version**: 1.0
**Last Updated**: [Current Date]
**Maintained By**: [Team Name]
