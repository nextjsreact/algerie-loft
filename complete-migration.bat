@echo off
echo ========================================
echo COMPLETE OWNERS TABLE MIGRATION
echo ========================================
echo.
echo This script will help you finalize the database migration.
echo.
echo CURRENT STATUS:
echo   [DONE] Unified owners table created
echo   [DONE] Data migrated from old tables
echo   [DONE] Temporary new_owner_id column added
echo   [TODO] Execute finalization in Supabase
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Open Supabase Dashboard
echo    https://supabase.com/dashboard
echo.
echo 2. Go to SQL Editor
echo.
echo 3. Copy the content of: finalize-migration.sql
echo.
echo 4. Paste and Run it in Supabase
echo.
echo 5. After successful execution, restart the app:
echo    npm run dev
echo.
echo ========================================
echo.
pause
