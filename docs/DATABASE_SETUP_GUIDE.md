# 🚀 Loft Management System - Database Setup Guide

## 📋 Quick Setup (5 minutes)

### Step 1: Run the Complete Schema
Execute this single file in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from: database/complete-schema.sql
```

### Step 2: Verify Installation
After running the script, you should see:
```
Loft Management System database schema created successfully! 🎉
```

### Step 3: Create Your First Admin User
1. Sign up through your app's registration
2. Go to Supabase → Authentication → Users
3. Find your user and update the `raw_user_meta_data`:
```json
{
  "role": "admin",
  "full_name": "Your Name"
}
```

## ✅ What's Included

### **Core Tables:**
- ✅ **profiles** - User management with roles (admin, manager, member)
- ✅ **lofts** - Property management with utility billing fields
- ✅ **loft_owners** - Property owners (company/third-party)
- ✅ **transactions** - Financial transactions with categories
- ✅ **tasks** - Task management with teams
- ✅ **notifications** - Real-time notification system

### **Supporting Tables:**
- ✅ **zone_areas** - Geographical zones (Algiers, Oran, Constantine)
- ✅ **categories** - Transaction categories (rent, maintenance, etc.)
- ✅ **currencies** - Multi-currency support (DZD, EUR, USD)
- ✅ **payment_methods** - Payment tracking
- ✅ **teams** & **team_members** - Team management
- ✅ **internet_connection_types** - Internet service types

### **Advanced Features:**
- ✅ **Bill Tracking** - Automatic due date calculations
- ✅ **Transaction Alerts** - Reference amount monitoring
- ✅ **Real-time Notifications** - Instant alerts
- ✅ **Row Level Security** - Data protection

### **Smart Functions:**
- ✅ **get_upcoming_bills()** - Find bills due soon
- ✅ **get_overdue_bills()** - Find overdue bills
- ✅ **calculate_next_due_date()** - Auto-calculate next bill dates
- ✅ **get_transaction_category_references()** - Manage reference amounts

## 🎯 Pre-configured Data

### **Zone Areas:**
- Algiers, Oran, Constantine

### **Internet Types:**
- Fiber, ADSL, 4G/5G, Satellite

### **Transaction Categories:**
- **Income**: Rent, Deposit, Late Fees
- **Expense**: Maintenance, Utilities, Insurance, Taxes, Cleaning

### **Currencies:**
- DZD (default), EUR, USD with exchange rates

### **Payment Methods:**
- Cash, Bank Transfer, Check, Credit Card

### **Transaction Reference Amounts:**
- **Expenses**: Maintenance (5,000 DZD), Cleaning (2,000 DZD), Repairs (8,000 DZD), etc.
- **Income**: Rent (50,000 DZD), Deposits (100,000 DZD), etc.

## 🔧 Key Features Ready to Use

### **1. Bill Management**
- Set bill frequencies (monthly, quarterly, etc.) in loft forms
- Automatic due date calculations
- Alerts 7, 3, 1 days before due dates
- Overdue bill notifications

### **2. Transaction Monitoring**
- Automatic category detection from descriptions
- Alerts when amounts exceed reference +20%
- Real-time notifications to admins/managers

### **3. Task Management**
- Assign tasks to users or teams
- Track progress with status updates
- Link tasks to specific lofts

### **4. Notification System**
- Real-time notifications
- Different types: info, warning, error, success
- Mark as read functionality

## 🛠️ Customization

### **Add New Zone Areas:**
```sql
INSERT INTO zone_areas (name) VALUES ('Your City');
```

### **Add New Transaction Categories:**
```sql
INSERT INTO categories (name, description, type) VALUES 
('New Category', 'Description', 'expense');
```

### **Update Reference Amounts:**
```sql
UPDATE transaction_category_references 
SET reference_amount = 10000.00 
WHERE category = 'maintenance' AND transaction_type = 'expense';
```

## 🔍 Testing Your Setup

### **1. Check Tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **2. Test Functions:**
```sql
-- Test upcoming bills function
SELECT * FROM get_upcoming_bills(30);

-- Test overdue bills function
SELECT * FROM get_overdue_bills();

-- Test reference amounts
SELECT * FROM get_transaction_category_references();
```

### **3. Verify Seed Data:**
```sql
-- Check zone areas
SELECT * FROM zone_areas;

-- Check categories
SELECT * FROM categories;

-- Check currencies
SELECT * FROM currencies;
```

## 🚨 Troubleshooting

### **Common Issues:**

**1. Permission Errors:**
- Make sure you're running the script as a Supabase admin
- Check that RLS policies are properly set

**2. Function Errors:**
- Ensure all functions are created successfully
- Check for any syntax errors in the logs

**3. Missing Data:**
- Verify that seed data was inserted
- Check for constraint violations

### **Reset Database (if needed):**
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run the complete schema again
```

## 🎉 You're Ready!

Your Loft Management System database is now fully configured with:

- 🏢 **Complete property management**
- 💰 **Financial tracking with alerts**
- 📋 **Task management**
- 🔔 **Real-time notifications**
- 📊 **Bill monitoring**
- 🛡️ **Security policies**

Start by creating your first loft and exploring the features! 🚀