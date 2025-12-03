# 🎯 Final Migration Steps

## Current Status

✅ **Completed:**
- Unified `owners` table created with all fields
- Data migrated from `loft_owners` (internal owners)
- Data migrated from `partner_profiles` (partner owners)
- Temporary `new_owner_id` column added to `lofts` table
- Application code updated to use `owners` table
- RLS policies configured

⏳ **Pending:**
- Execute finalization script in Supabase
- Remove old tables and columns

---

## 📋 Execute Finalization

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**

### Step 2: Run Finalization Script

1. Open the file: `finalize-migration.sql`
2. Copy the entire content
3. Paste it into Supabase SQL Editor
4. Click **Run**

### Step 3: Verify Success

The script will:
- ✅ Remove old `owner_id` column (pointed to loft_owners)
- ✅ Remove `partner_id` column (pointed to partner_profiles)
- ✅ Rename `new_owner_id` to `owner_id`
- ✅ Drop `loft_owners` table
- ✅ Drop `partner_profiles` table
- ✅ Drop `partners` table (if exists)

You should see success messages in the SQL Editor output.

### Step 4: Verify Migration

Run the verification script:

```bash
node verify-migration-complete.js
```

This will check:
- Old tables are removed
- New `owner_id` column exists in `lofts`
- Relationship `lofts -> owners` works correctly
- All data is intact

### Step 5: Restart Application

```bash
npm run dev
```

---

## 🧪 Test the Migration

After restarting, test these features:

1. **View Lofts List**
   - Go to `/lofts`
   - Verify all lofts display correctly

2. **Create New Loft**
   - Go to `/lofts/new`
   - Check that owner dropdown shows all owners
   - Create a test loft

3. **Edit Existing Loft**
   - Open any loft
   - Verify owner information displays
   - Try changing the owner

4. **Partner Dashboard**
   - Login as a partner
   - Verify their properties show correctly

---

## 📊 Database Structure (After Migration)

### Before:
```
loft_owners (internal owners)
partner_profiles (partner owners)
partners (legacy)
lofts.owner_id -> loft_owners
lofts.partner_id -> partner_profiles
```

### After:
```
owners (unified table)
lofts.owner_id -> owners
```

---

## 🔄 Rollback (If Needed)

If something goes wrong, you have backups:
- `backup-loft-owners.json`
- `backup-partner-profiles.json`

To restore:
1. Don't panic! 😊
2. The finalization script is wrapped in a transaction
3. If it fails, nothing will be changed
4. Contact support if you need help restoring from backups

---

## 📝 What Changed in the Code

The application code already uses the new structure:

### Lofts Actions (`app/actions/lofts.ts`)
```typescript
// ✅ Already updated
.select("*, owner:owners(name)")
```

### Owners Actions (`app/actions/owners.ts`)
```typescript
// ✅ Already updated
.from("owners")
```

### API Routes
All API routes use `owner_id` which will work after finalization.

---

## ✅ Success Criteria

Migration is complete when:
- [ ] Finalization script executed successfully
- [ ] Verification script shows all green checkmarks
- [ ] Application starts without errors
- [ ] Lofts page displays correctly
- [ ] Owner dropdown works in loft creation
- [ ] Partner dashboard shows properties

---

## 🆘 Troubleshooting

### Issue: "Column new_owner_id does not exist"
**Solution:** The finalization was successful! This is expected.

### Issue: "Table loft_owners does not exist"
**Solution:** The finalization was successful! This is expected.

### Issue: "Cannot read property 'name' of null"
**Solution:** Some lofts don't have owners assigned. This is normal for test data.

### Issue: Owner dropdown is empty
**Solution:** 
1. Check RLS policies on `owners` table
2. Verify you're logged in as admin/superuser
3. Run: `SELECT * FROM owners;` in Supabase SQL Editor

---

## 📞 Need Help?

If you encounter any issues:
1. Check the verification script output
2. Look at Supabase logs
3. Check browser console for errors
4. Review the backup files

---

**Ready to proceed?** Run `complete-migration.bat` for a quick guide!
