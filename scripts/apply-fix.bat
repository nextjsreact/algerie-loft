@echo off
REM This script applies the fix using psql with the corrected connection string

echo Applying bill update function fix...

REM Extract the connection string from environment variables
for /f "tokens=*" %%a in ('type .env ^| findstr DATABASE_URL') do set DB_URL=%%a
if "%DB_URL%"=="" (
  for /f "tokens=*" %%a in ('type .env ^| findstr POSTGRES_URL') do set DB_URL=%%a
)

REM Extract just the value part
set DB_URL=%DB_URL:*==%

echo Using database URL: %DB_URL%

REM Apply the fix
psql "%DB_URL%" -f database\fix-bill-update-function.sql

if %ERRORLEVEL% NEQ 0 (
  echo Failed to apply fix. Please check your database connection.
  echo Try using the Supabase dashboard to run the SQL:
  echo 1. Go to https://supabase.com/dashboard
  echo 2. Select your project
  echo 3. Go to SQL Editor
  echo 4. Copy and paste the contents of database\fix-bill-update-function.sql
  echo 5. Click Run
) else (
  echo Fix applied successfully!
)

pause
