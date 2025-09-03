@echo off
echo Setting up Windows Task Scheduler for Loft Bill Monitoring...
echo.

REM Get current directory
set "PROJECT_DIR=%cd%"

REM Create the scheduled task
schtasks /create /tn "Loft Bill Monitoring" /tr "cmd /c cd \"%PROJECT_DIR%\" && npm run check-bills >> logs\bill-monitoring.log 2>&1" /sc daily /st 09:00 /f

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Task Scheduler has been configured!
    echo.
    echo Task Details:
    echo - Name: Loft Bill Monitoring
    echo - Schedule: Daily at 9:00 AM
    echo - Command: npm run check-bills
    echo - Log file: logs\bill-monitoring.log
    echo.
    echo To verify the task was created, run:
    echo schtasks /query /tn "Loft Bill Monitoring"
    echo.
    echo To test the task manually, run:
    echo schtasks /run /tn "Loft Bill Monitoring"
    echo.
) else (
    echo.
    echo ❌ ERROR: Failed to create scheduled task.
    echo Please run this script as Administrator.
    echo.
    echo Manual setup instructions:
    echo 1. Open Task Scheduler
    echo 2. Create Basic Task
    echo 3. Name: Loft Bill Monitoring
    echo 4. Trigger: Daily at 9:00 AM
    echo 5. Action: Start a program
    echo 6. Program: cmd
    echo 7. Arguments: /c cd "%PROJECT_DIR%" ^&^& npm run check-bills
    echo.
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo.
echo Setup complete! Your bill monitoring system will now run automatically every day at 9:00 AM.
echo.
pause