# 🔔 Bill Due Date Notification System Setup Guide

This guide will help you set up an automated bill notification system that alerts users when utility bills are due or overdue based on the bill frequency settings in your loft management system.

## 📋 Overview

The bill notification system provides:
- ✅ **Automated Alerts**: Get notified 7, 3, and 1 days before bills are due
- ✅ **Overdue Notifications**: Immediate alerts for overdue bills
- ✅ **Real-time Dashboard**: Visual dashboard showing upcoming and overdue bills
- ✅ **Auto-Update**: Automatically calculates next due dates when bills are marked as paid
- ✅ **Multi-Utility Support**: Water, Energy, Phone, and Internet bills
- ✅ **Smart Scheduling**: Supports monthly, quarterly, semi-annual, and annual frequencies

## 🚀 Quick Setup

### Step 1: Run Database Schema
Execute the database schema to create the necessary functions and triggers:

```sql
-- Run this in your Supabase SQL editor
-- File: database/bill-notifications-schema.sql
```

### Step 2: Set Up Scheduled Job
Add the bill notification checker to your cron jobs or task scheduler:

**For Linux/Mac (crontab):**
```bash
# Run daily at 9:00 AM
0 9 * * * cd /path/to/your/project && npx tsx scripts/check-bill-notifications.ts
```

**For Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Set to run daily at 9:00 AM
4. Action: Start a program
5. Program: `npx`
6. Arguments: `tsx scripts/check-bill-notifications.ts`
7. Start in: Your project directory

### Step 3: Test the System
Run the notification checker manually to test:

```bash
npx tsx scripts/check-bill-notifications.ts
```

## 📊 Dashboard Integration

The bill alerts are automatically displayed on your dashboard with:
- **Upcoming Bills**: Shows bills due in the next 30 days
- **Overdue Bills**: Highlights bills that are past due
- **Quick Actions**: Mark bills as paid directly from the dashboard

## 🔧 Configuration

### Bill Frequency Options
The system supports these frequency types:
- `monthly` / `mensuel` - Every month
- `quarterly` / `trimestriel` - Every 3 months
- `semi-annual` / `semestriel` - Every 6 months
- `annual` / `annuel` - Every year
- `bi-monthly` / `bimestriel` - Every 2 months

### Notification Timing
By default, notifications are sent:
- **7 days before** due date (Info notification)
- **3 days before** due date (Info notification)
- **1 day before** due date (Warning notification)
- **On due date** (Warning notification)
- **After due date** (Error notification)

## 🎯 How It Works

### 1. Automatic Due Date Calculation
When you mark a bill as paid, the system automatically:
- Creates a transaction record
- Calculates the next due date based on frequency
- Updates the loft's bill due date

### 2. Daily Notification Checks
The scheduled job runs daily and:
- Scans all lofts for upcoming due dates
- Sends notifications to loft owners and admins
- Checks for overdue bills and sends alerts

### 3. Real-time Dashboard Updates
The dashboard component:
- Fetches upcoming and overdue bills using database functions
- Displays color-coded alerts based on urgency
- Allows quick bill payment marking

## 📝 Database Functions

The system includes these database functions:

### `get_upcoming_bills(days_ahead)`
Returns bills due within the specified number of days.

```sql
SELECT * FROM get_upcoming_bills(30); -- Next 30 days
```

### `get_overdue_bills()`
Returns all overdue bills.

```sql
SELECT * FROM get_overdue_bills();
```

### `calculate_next_due_date(current_date, frequency)`
Calculates the next due date based on frequency.

```sql
SELECT calculate_next_due_date('2024-01-15'::DATE, 'monthly');
```

## 🔍 Troubleshooting

### Common Issues

**1. Notifications not being sent**
- Check if the scheduled job is running
- Verify database permissions
- Check the application logs

**2. Wrong due dates calculated**
- Verify the frequency values in the loft records
- Check if the `calculate_next_due_date` function is working
- Ensure date formats are correct

**3. Dashboard not showing bills**
- Check if the database functions exist
- Verify RLS policies allow access
- Check browser console for errors

### Debug Commands

```bash
# Test the notification service
npx tsx -e "import('./lib/services/bill-notifications.js').then(m => m.checkBillDueNotifications())"

# Check upcoming bills in database
# Run in Supabase SQL editor:
SELECT * FROM get_upcoming_bills(30);

# Check overdue bills
SELECT * FROM get_overdue_bills();
```

## 📈 Monitoring

### Key Metrics to Monitor
- Number of notifications sent daily
- Response time of notification checks
- Number of overdue bills
- User engagement with notifications

### Logs to Watch
- `Bill due notifications processed` - Daily summary
- `Bill due notification sent` - Individual notifications
- `Next bill date updated` - Automatic updates

## 🔒 Security Considerations

- Notifications are only sent to loft owners and admin users
- RLS policies ensure users only see their own loft bills
- Database functions have proper permission controls
- Sensitive bill information is not exposed in logs

## 🎨 Customization

### Modify Notification Timing
Edit the `alertDays` array in `lib/services/bill-notifications.ts`:

```typescript
const alertDays = [14, 7, 3, 1] // Add 14-day advance notice
```

### Add New Utility Types
1. Add database columns to the lofts table
2. Update the validation schema
3. Add to the utility arrays in the notification service
4. Update the form components

### Custom Notification Messages
Modify the notification text in the `sendBillDueNotification` function.

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the application logs
3. Test individual components
4. Verify database schema is properly applied

---

## 🏁 Result

Your Loft Management System now has a comprehensive bill notification system that:

✅ **Prevents Missed Payments**: Automated alerts ensure bills are never forgotten  
✅ **Saves Time**: Automatic due date calculations reduce manual work  
✅ **Improves Cash Flow**: Timely bill payments maintain good vendor relationships  
✅ **Provides Visibility**: Dashboard overview of all upcoming and overdue bills  
✅ **Scales Automatically**: Works with any number of lofts and utility types  

The system runs automatically in the background, keeping your property management organized and efficient!