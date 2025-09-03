# 🚀 Complete Automated Bill Alerts System - Setup Guide

This comprehensive guide will set up a fully automated bill notification system that monitors utility bills, sends alerts at 7, 3, and 1 days before due dates, and provides "Mark as Paid" functionality with automatic next due date calculation.

## 🎯 What You'll Get

### ✅ **Automatic Alerts System**
- **7 days before**: Info notification to prepare
- **3 days before**: Info notification as reminder  
- **1 day before**: Warning notification for urgency
- **Due today**: Warning notification for immediate action
- **Overdue**: Error notification for late bills

### ✅ **Smart Dashboard Integration**
- **Bill Monitoring Stats**: Real-time overview of all bill statuses
- **Bill Alerts Widget**: Detailed upcoming and overdue bills
- **Auto-refresh**: Updates every 5 minutes automatically

### ✅ **Loft Page Integration**
- **Mark as Paid Button**: One-click bill payment recording
- **Automatic Calculation**: Next due date calculated based on frequency
- **Visual Status**: Color-coded bill status indicators

### ✅ **Continuous Monitoring**
- **Daily Automated Checks**: Runs automatically every day
- **Real-time Notifications**: Instant alerts to users
- **Admin Summaries**: Daily overdue bill reports

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Schema
Run this SQL in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from: database/bill-notifications-schema.sql
-- This creates all necessary functions and triggers
```

### Step 2: Test the System
```bash
# Test the monitoring system
npm run check-bills

# You should see: "Bill monitoring completed successfully"
```

### Step 3: Set Up Daily Automation

**For Windows (Recommended):**
```batch
# Run the setup script
scripts/setup-windows-scheduler.bat
```

**For Linux/Mac:**
```bash
# Add to crontab - runs daily at 9:00 AM
crontab -e
# Add this line:
0 9 * * * cd /path/to/your/project && npm run check-bills
```

### Step 4: Configure Your Lofts
1. Go to any loft → Edit
2. Set bill frequencies (monthly, quarterly, etc.)
3. Set initial due dates for each utility
4. Save - the system handles everything else!

## 📊 Dashboard Features

### Bill Monitoring Stats Card
- **Overdue Bills**: Red alert with count
- **Due Today**: Orange warning with count  
- **Upcoming Bills**: Blue info for next 30 days
- **Active Lofts**: Green count of lofts with bills
- **Auto-refresh**: Updates every 5 minutes
- **Manual refresh**: Click refresh button anytime

### Bill Alerts Widget
- **Upcoming Bills**: Next 30 days with countdown
- **Overdue Bills**: Past due with days overdue
- **Quick Actions**: Mark as paid directly
- **Color Coding**: Visual urgency indicators

## 🏢 Loft Page Features

### Bill Management Section
Each loft page now shows:
- **Water Bills**: Due dates and frequency
- **Energy Bills**: Status and payment tracking
- **Phone Bills**: Automatic monitoring
- **Internet Bills**: Smart notifications

### Mark as Paid Functionality
- **One-Click Payment**: Record bill payments instantly
- **Amount Entry**: Enter actual payment amount
- **Auto-Calculation**: Next due date calculated automatically
- **Transaction Record**: Creates expense transaction
- **Notifications**: Confirms payment to owner and admins

## 🔄 How the Automation Works

### Daily Monitoring Cycle
1. **9:00 AM Daily**: Automated script runs
2. **Scan All Lofts**: Check every utility bill
3. **Calculate Days**: Determine days until due
4. **Send Alerts**: Notify at 7, 3, 1 days before
5. **Check Overdue**: Alert for past due bills
6. **Admin Summary**: Daily overdue report

### Smart Notifications
- **Loft Owners**: Get alerts for their properties
- **Admins/Managers**: Get alerts for all properties
- **Real-time Delivery**: Instant notifications
- **Smart Timing**: No spam, just timely alerts

### Automatic Updates
- **Mark as Paid**: Triggers next due date calculation
- **Frequency-Based**: Monthly, quarterly, annual support
- **Database Triggers**: Automatic when transactions created
- **Error Handling**: Robust failure recovery

## 🛠️ Advanced Configuration

### Customize Alert Timing
Edit `lib/services/bill-monitoring.ts`:
```typescript
const ALERT_DAYS = [14, 7, 3, 1] // Add 14-day advance notice
```

### Add New Utility Types
1. Add database columns to lofts table
2. Update validation schema in `lib/validations.ts`
3. Add to utility arrays in monitoring service
4. Update form components

### Modify Notification Messages
Edit notification text in `sendBillAlert` function in `lib/services/bill-monitoring.ts`

## 🔧 Windows Automation Setup

### Option 1: Automatic Setup (Recommended)
```batch
# Run this script to set up Windows Task Scheduler automatically
scripts/setup-windows-scheduler.bat
```

### Option 2: Manual Setup
1. Open **Task Scheduler**
2. Create **Basic Task**
3. **Name**: "Loft Bill Monitoring"
4. **Trigger**: Daily at 9:00 AM
5. **Action**: Start a program
6. **Program**: `cmd`
7. **Arguments**: `/c cd "C:\path\to\your\project" && npm run check-bills`
8. **Start in**: Your project directory

## 🐧 Linux/Mac Automation Setup

### Crontab Setup
```bash
# Edit crontab
crontab -e

# Add this line for daily 9 AM execution
0 9 * * * cd /path/to/your/project && npm run check-bills >> /var/log/bill-monitoring.log 2>&1

# Save and exit
```

### Systemd Service (Advanced)
```bash
# Create service file
sudo nano /etc/systemd/system/bill-monitoring.service

# Add service configuration
sudo nano /etc/systemd/system/bill-monitoring.timer

# Enable and start
sudo systemctl enable bill-monitoring.timer
sudo systemctl start bill-monitoring.timer
```

## 🔍 Testing & Verification

### Test Individual Components
```bash
# Test bill monitoring
npm run check-bills

# Test with specific loft (in Node.js console)
node -e "
const { getUpcomingBillsForLoft } = require('./app/actions/bill-notifications.js');
getUpcomingBillsForLoft('your-loft-id').then(console.log);
"
```

### Verify Database Functions
```sql
-- Test upcoming bills function
SELECT * FROM get_upcoming_bills(30);

-- Test overdue bills function  
SELECT * FROM get_overdue_bills();

-- Test date calculation
SELECT calculate_next_due_date('2024-01-15'::DATE, 'monthly');
```

### Check Notifications
1. Set a bill due date to tomorrow
2. Run `npm run check-bills`
3. Check notifications in the app
4. Verify alerts appear on dashboard

## 📈 Monitoring & Maintenance

### Key Metrics to Watch
- **Daily notification count**: Should match expected bills
- **Error rates**: Monitor for failed notifications
- **Response times**: Check monitoring performance
- **User engagement**: Track notification interactions

### Log Files to Monitor
- Application logs for notification sending
- Database logs for function execution
- System logs for scheduled job execution

### Health Checks
```bash
# Check if monitoring is working
npm run check-bills

# Verify database functions exist
# Run in Supabase SQL editor:
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%bill%';
```

## 🚨 Troubleshooting

### Common Issues

**1. Notifications not sending**
- Check if scheduled job is running
- Verify database permissions
- Check application logs

**2. Wrong due dates calculated**
- Verify frequency values in loft records
- Check `calculate_next_due_date` function
- Ensure date formats are correct

**3. Dashboard not showing bills**
- Check if database functions exist
- Verify API route is working: `/api/bill-monitoring/stats`
- Check browser console for errors

**4. Mark as Paid not working**
- Verify server action is properly imported
- Check transaction creation permissions
- Ensure loft ID is valid

### Debug Commands
```bash
# Test API endpoint
curl http://localhost:3000/api/bill-monitoring/stats

# Check database functions
psql -c "SELECT * FROM get_upcoming_bills(7);"

# Verify scheduled task (Windows)
schtasks /query /tn "Loft Bill Monitoring"

# Check cron job (Linux/Mac)
crontab -l | grep bill
```

## 🎉 Success Verification

After setup, you should see:

### ✅ Dashboard
- Bill Monitoring Stats card showing current status
- Bill Alerts widget with upcoming/overdue bills
- Auto-refreshing data every 5 minutes

### ✅ Loft Pages  
- Bill Management section on each loft
- Mark as Paid buttons for active bills
- Color-coded status indicators

### ✅ Notifications
- Real-time alerts for upcoming bills
- Overdue notifications for late payments
- Confirmation messages for payments

### ✅ Automation
- Daily monitoring running automatically
- Logs showing successful execution
- No manual intervention required

## 🏁 Final Result

Your Loft Management System now has:

🔔 **Automated Bill Alerts** - Never miss a payment deadline  
📊 **Real-time Dashboard** - Complete visibility of all bills  
⚡ **One-Click Payments** - Instant bill payment recording  
🤖 **Smart Automation** - Runs continuously without intervention  
📈 **Comprehensive Monitoring** - Track everything from one place  

The system runs automatically in the background, keeping your property management organized and ensuring all utility bills are paid on time!

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Test individual components
4. Verify database schema is applied correctly

Your automated bill management system is now complete and ready to keep your loft business running smoothly! 🚀