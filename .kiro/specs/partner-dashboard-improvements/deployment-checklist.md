# Partner Dashboard Deployment - Quick Checklist

## 📋 Pre-Deployment (Do This First)

### Code Quality
- [ ] `npm run lint` - No errors
- [ ] `npm run build` - Build succeeds
- [ ] `npm run start` - App starts successfully
- [ ] No console errors in browser

### Translations
- [ ] `npm run validate:translations` - All keys present
- [ ] Test French: http://localhost:3000/fr/partner/dashboard
- [ ] Test English: http://localhost:3000/en/partner/dashboard
- [ ] Test Arabic: http://localhost:3000/ar/partner/dashboard

### Manual Testing
- [ ] Login as partner works
- [ ] Sidebar navigation works
- [ ] Language switching works
- [ ] Dashboard displays data correctly
- [ ] Mobile responsive works
- [ ] User profile dropdown works

---

## 🚀 Staging Deployment (Task 14.3)

### 1. Prepare & Deploy
```bash
# Update staging branch
git checkout main
git pull origin main
git checkout staging
git merge main
git push origin staging
```

### 2. Configure Vercel (First Time Only)
- Go to Vercel Dashboard → Settings → Environment Variables
- Add staging variables (select "Preview" environment):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`

### 3. Verify Deployment
- [ ] Get staging URL from Vercel
- [ ] Test login
- [ ] Test `/fr/partner/dashboard`
- [ ] Test `/en/partner/dashboard`
- [ ] Test `/ar/partner/dashboard`
- [ ] Check Vercel logs for errors
- [ ] Monitor for 24-48 hours

### 4. Document Results
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] No critical issues
- [ ] Ready for production

---

## 🎯 Production Deployment (Task 14.4)

### 1. Pre-Production Checks
- [ ] Staging deployment successful
- [ ] All tests passed
- [ ] Team notified
- [ ] Deployment window scheduled
- [ ] Rollback plan ready

### 2. Note Current Production State
```bash
# Save this for rollback if needed
vercel ls --prod
# Note the current deployment ID: _______________
```

### 3. Deploy to Production
```bash
# Option A: Automatic (merge to main)
git checkout main
git merge staging
git push origin main

# Option B: Manual
vercel --prod

# Option C: Use script
npm run deploy:prod
```

### 4. Immediate Verification (First 15 min)
- [ ] Site accessible: https://your-app.vercel.app
- [ ] Login works
- [ ] `/fr/partner/dashboard` works
- [ ] `/en/partner/dashboard` works
- [ ] `/ar/partner/dashboard` works
- [ ] No console errors
- [ ] Check Vercel logs

### 5. Extended Monitoring (First Hour)
- [ ] Error rate < 1%
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] No user complaints
- [ ] Vercel Analytics looks good

### 6. 24-Hour Monitoring
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Watch support tickets

### 7. Sign-off
- [ ] Technical lead approval
- [ ] Product owner approval
- [ ] Update CHANGELOG.md
- [ ] Mark tasks as complete

---

## 🔄 Rollback (If Needed)

### Quick Rollback
```bash
# Use the deployment ID you noted earlier
vercel promote [previous-deployment-id] --prod

# Verify rollback
curl -I https://your-app.vercel.app
```

### When to Rollback
- Error rate > 5%
- Critical functionality broken
- Data integrity issues
- Performance degradation > 50%

---

## 📊 Success Criteria

### Staging
- ✅ All functional tests pass
- ✅ All languages work correctly
- ✅ No critical bugs
- ✅ Performance acceptable
- ✅ 24-hour stability

### Production
- ✅ All smoke tests pass
- ✅ Error rate < 1%
- ✅ Performance within range
- ✅ No critical bugs
- ✅ Positive user feedback
- ✅ 24-hour stability

---

## 🆘 Emergency Contacts

**If something goes wrong:**
1. Check Vercel logs: `vercel logs --prod --follow`
2. Check deployment runbook: `deployment-runbook.md`
3. Contact team lead
4. Execute rollback if critical

---

## 📝 Quick Commands

```bash
# View logs
vercel logs --prod --follow

# List deployments
vercel ls --prod

# Promote specific deployment
vercel promote [deployment-id] --prod

# Check environment variables
vercel env ls

# Run health check
curl -I https://your-app.vercel.app/api/health
```

---

## ✅ Final Checklist

- [ ] Staging deployed and tested
- [ ] Production deployed successfully
- [ ] All verifications completed
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team notified
- [ ] Tasks 14.3 and 14.4 marked complete

---

**Need Help?** See `deployment-runbook.md` for detailed instructions.
