@echo off
REM Validation script for automation setup
REM Checks if all automation components are properly configured

echo 🔍 Automation Setup Validation
echo ===============================
echo.

set "errors=0"

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    set /a errors+=1
) else (
    echo ✅ Node.js is available
)

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    set /a errors+=1
) else (
    echo ✅ npm is available
)

REM Check tsx
echo Checking tsx...
npx tsx --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  tsx is not available (will be installed when needed)
) else (
    echo ✅ tsx is available
)

REM Check automation files
echo.
echo Checking automation files...

if exist "lib\environment-management\automation\daily-refresh.ts" (
    echo ✅ Daily refresh automation found
) else (
    echo ❌ Daily refresh automation missing
    set /a errors+=1
)

if exist "lib\environment-management\automation\weekly-refresh.ts" (
    echo ✅ Weekly refresh automation found
) else (
    echo ❌ Weekly refresh automation missing
    set /a errors+=1
)

if exist "lib\environment-management\automation\training-environment-setup.ts" (
    echo ✅ Training environment setup found
) else (
    echo ❌ Training environment setup missing
    set /a errors+=1
)

if exist "lib\environment-management\automation\development-environment-setup.ts" (
    echo ✅ Development environment setup found
) else (
    echo ❌ Development environment setup missing
    set /a errors+=1
)

REM Check batch scripts
echo.
echo Checking batch scripts...

if exist "scripts\daily-refresh.bat" (
    echo ✅ Daily refresh batch script found
) else (
    echo ❌ Daily refresh batch script missing
    set /a errors+=1
)

if exist "scripts\weekly-refresh.bat" (
    echo ✅ Weekly refresh batch script found
) else (
    echo ❌ Weekly refresh batch script missing
    set /a errors+=1
)

if exist "scripts\setup-training-environment.bat" (
    echo ✅ Training setup batch script found
) else (
    echo ❌ Training setup batch script missing
    set /a errors+=1
)

if exist "scripts\setup-development-environment.bat" (
    echo ✅ Development setup batch script found
) else (
    echo ❌ Development setup batch script missing
    set /a errors+=1
)

if exist "scripts\automation-menu.bat" (
    echo ✅ Automation menu found
) else (
    echo ❌ Automation menu missing
    set /a errors+=1
)

REM Check configuration template
echo.
echo Checking configuration...

if exist "scripts\automation-config.template.json" (
    echo ✅ Configuration template found
) else (
    echo ❌ Configuration template missing
    set /a errors+=1
)

REM Check PowerShell scripts
if exist "scripts\start-automation-workflows.ps1" (
    echo ✅ PowerShell workflow script found
) else (
    echo ❌ PowerShell workflow script missing
    set /a errors+=1
)

REM Summary
echo.
echo ===============================
if %errors% equ 0 (
    echo ✅ All automation components are properly set up!
    echo.
    echo 🚀 You can now use:
    echo    • scripts\automation-menu.bat - Interactive menu
    echo    • scripts\daily-refresh.bat - Daily refresh
    echo    • scripts\weekly-refresh.bat - Weekly refresh
    echo    • scripts\setup-training-environment.bat - Training setup
    echo    • scripts\setup-development-environment.bat - Dev setup
) else (
    echo ❌ Found %errors% issues that need to be resolved
    echo.
    echo Please fix the missing components before using automation
)

echo.
pause