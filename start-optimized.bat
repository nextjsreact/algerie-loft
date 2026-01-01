@echo off
echo 🚀 Starting Optimized Loft Algerie Development Server...
echo.

REM Clear caches first
echo 📦 Clearing caches...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo ✅ Caches cleared

REM Use optimized Next.js config
echo 🔧 Using optimized configuration...
if exist next.config.performance.mjs (
    copy /y next.config.performance.mjs next.config.mjs
    echo ✅ Optimized config applied
) else (
    echo ⚠️  Optimized config not found, using existing config
)

REM Set performance environment variables
echo 🌍 Setting performance environment variables...
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development

REM Start the development server
echo 🎯 Starting development server with optimizations...
echo.
echo Performance improvements active:
echo • Database connection pooling
echo • API response caching
echo • Query timeouts and retries
echo • Optimized webpack configuration
echo • Memory management improvements
echo.

npm run dev

pause