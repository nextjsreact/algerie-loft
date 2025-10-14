@echo off
REM Environment Management Automation Menu
REM Provides easy access to all automation scripts

:MENU
cls
echo.
echo 🤖 Environment Management Automation
echo ====================================
echo.
echo Choose an automation task:
echo.
echo 1. Daily Environment Refresh
echo 2. Weekly Environment Refresh  
echo 3. Setup Training Environment
echo 4. Setup Development Environment
echo 5. Start Workflow Automation
echo 6. Schedule Manager
echo 7. View Automation Status
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto DAILY_REFRESH
if "%choice%"=="2" goto WEEKLY_REFRESH
if "%choice%"=="3" goto TRAINING_SETUP
if "%choice%"=="4" goto DEV_SETUP
if "%choice%"=="5" goto WORKFLOW_AUTOMATION
if "%choice%"=="6" goto SCHEDULE_MANAGER
if "%choice%"=="7" goto STATUS
if "%choice%"=="8" goto EXIT

echo Invalid choice. Please try again.
pause
goto MENU

:DAILY_REFRESH
cls
echo 🔄 Daily Environment Refresh
echo ============================
echo.
echo This will refresh test and training environments with fresh production data.
echo.
call scripts\daily-refresh.bat
pause
goto MENU

:WEEKLY_REFRESH
cls
echo 🔄 Weekly Environment Refresh
echo ==============================
echo.
echo This will perform comprehensive refresh of all environments.
echo.
call scripts\weekly-refresh.bat
pause
goto MENU

:TRAINING_SETUP
cls
echo 🎓 Training Environment Setup
echo ==============================
echo.
echo This will create a new training environment with sample data.
echo.
call scripts\setup-training-environment.bat
pause
goto MENU

:DEV_SETUP
cls
echo ⚡ Development Environment Setup
echo =====================================
echo.
echo This will create a fast development environment.
echo.
call scripts\setup-development-environment.bat
pause
goto MENU

:WORKFLOW_AUTOMATION
cls
echo 🤖 Workflow Automation
echo =======================
echo.
echo This will start automated workflows for scheduled tasks.
echo.
powershell -ExecutionPolicy Bypass -File scripts\start-automation-workflows.ps1 -Action start
pause
goto MENU

:SCHEDULE_MANAGER
cls
echo 📅 Schedule Manager
echo ===================
echo.
echo Managing scheduled automation tasks...
echo.
npx tsx lib/environment-management/automation/schedule-manager.ts status
echo.
pause
goto MENU

:STATUS
cls
echo 📊 Automation Status
echo ====================
echo.
echo Checking status of automation workflows...
echo.
powershell -ExecutionPolicy Bypass -File scripts\start-automation-workflows.ps1 -Action status
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using Environment Management Automation!
echo.
exit /b 0