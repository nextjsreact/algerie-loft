# Reservation Data Consistency Test Suite
# PowerShell script for comprehensive testing

param(
    [switch]$Verbose,
    [switch]$GenerateReport,
    [string]$OutputPath = "test-reports"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reservation Data Consistency Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to run a command and capture output
function Invoke-TestCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression $Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return @{ Success = $true; Output = $result }
        } else {
            Write-Host "❌ $Description failed" -ForegroundColor Red
            return @{ Success = $false; Output = $result }
        }
    } catch {
        Write-Host "❌ $Description failed with exception: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Output = $_.Exception.Message }
    }
}

# Check prerequisites
Write-Host "🔍 Checking test environment..." -ForegroundColor Blue

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js and try again" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    Write-Host "Please ensure npm is installed" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js and npm are available" -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version
Write-Host "📦 Node.js version: $nodeVersion" -ForegroundColor Cyan

# Check if vitest is available
$vitestCheck = Invoke-TestCommand "npx vitest --version" "Checking Vitest availability"
if (-not $vitestCheck.Success) {
    Write-Host "⚠️  Vitest not found, installing..." -ForegroundColor Yellow
    $installResult = Invoke-TestCommand "npm install --save-dev vitest" "Installing Vitest"
    if (-not $installResult.Success) {
        Write-Host "❌ Failed to install vitest" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Test environment ready" -ForegroundColor Green
Write-Host ""

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    Write-Host "📁 Created output directory: $OutputPath" -ForegroundColor Cyan
}

# Run individual test suites if verbose mode
if ($Verbose) {
    Write-Host "🔍 Running individual test suites..." -ForegroundColor Blue
    Write-Host ""
    
    $testSuites = @(
        @{ Name = "Cache Service Tests"; Command = "npx vitest run __tests__/services/loft-cache-service.test.ts" },
        @{ Name = "System Health Monitor Tests"; Command = "npx vitest run __tests__/services/system-health-monitor.test.ts" },
        @{ Name = "Performance Monitor Tests"; Command = "npx vitest run __tests__/services/reservation-performance-monitor.test.ts" },
        @{ Name = "API Endpoints Tests"; Command = "npx vitest run __tests__/api/monitoring/performance.test.ts" },
        @{ Name = "Integration Tests"; Command = "npx vitest run __tests__/integration/reservation-data-consistency.test.ts" },
        @{ Name = "System Validation Tests"; Command = "npx vitest run __tests__/reservation-system-validation.test.ts" }
    )
    
    $results = @()
    
    foreach ($suite in $testSuites) {
        $result = Invoke-TestCommand $suite.Command $suite.Name
        $results += @{
            Name = $suite.Name
            Success = $result.Success
            Output = $result.Output
        }
        Write-Host ""
    }
    
    # Summary of individual tests
    Write-Host "📊 Individual Test Suite Results:" -ForegroundColor Blue
    Write-Host "=================================" -ForegroundColor Blue
    
    $passedSuites = 0
    foreach ($result in $results) {
        $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
        Write-Host "$status $($result.Name)" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
        if ($result.Success) { $passedSuites++ }
    }
    
    Write-Host ""
    Write-Host "Passed: $passedSuites/$($results.Count) suites" -ForegroundColor Cyan
    Write-Host ""
}

# Run comprehensive test suite
Write-Host "🚀 Running comprehensive test suite..." -ForegroundColor Blue
Write-Host ""

$mainTestResult = Invoke-TestCommand "npx tsx scripts/run-reservation-tests.ts" "Comprehensive Test Execution"

Write-Host ""

# Generate additional reports if requested
if ($GenerateReport) {
    Write-Host "📄 Generating additional reports..." -ForegroundColor Blue
    
    # Generate test coverage if possible
    $coverageResult = Invoke-TestCommand "npx vitest run --coverage" "Generating Test Coverage"
    
    # Generate performance report
    Write-Host "📊 Performance analysis..." -ForegroundColor Yellow
    $performanceData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TestDuration = "N/A"
        SystemInfo = @{
            OS = $env:OS
            Processor = $env:PROCESSOR_IDENTIFIER
            Memory = "N/A"
        }
    }
    
    $performanceJson = $performanceData | ConvertTo-Json -Depth 3
    $performanceReportPath = Join-Path $OutputPath "performance-analysis.json"
    $performanceJson | Out-File -FilePath $performanceReportPath -Encoding UTF8
    
    Write-Host "✅ Performance analysis saved to: $performanceReportPath" -ForegroundColor Green
}

# Display results
Write-Host "📋 Test Execution Summary:" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue

if ($mainTestResult.Success) {
    Write-Host "🎉 All tests passed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Cache Service: Functional" -ForegroundColor Green
    Write-Host "✅ Health Monitoring: Active" -ForegroundColor Green
    Write-Host "✅ Performance Monitoring: Working" -ForegroundColor Green
    Write-Host "✅ API Endpoints: Tested" -ForegroundColor Green
    Write-Host "✅ Integration: Verified" -ForegroundColor Green
    Write-Host "✅ Database Optimization: Implemented" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 The reservation system is ready for deployment!" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some tests failed. Please review the issues." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Review the test report for specific failures" -ForegroundColor White
    Write-Host "2. Fix the identified issues" -ForegroundColor White
    Write-Host "3. Re-run the tests" -ForegroundColor White
    Write-Host "4. Verify all components are working" -ForegroundColor White
}

# Show report locations
Write-Host ""
Write-Host "📄 Reports Available:" -ForegroundColor Blue
$reportPath = Join-Path $OutputPath "reservation-system-test-report.md"
$jsonReportPath = Join-Path $OutputPath "reservation-system-test-report.json"

if (Test-Path $reportPath) {
    Write-Host "📋 Markdown Report: $reportPath" -ForegroundColor Cyan
}
if (Test-Path $jsonReportPath) {
    Write-Host "📊 JSON Report: $jsonReportPath" -ForegroundColor Cyan
}

# Offer to open the report
Write-Host ""
$openReport = Read-Host "Would you like to open the test report? (y/N)"
if ($openReport -eq "y" -or $openReport -eq "Y") {
    if (Test-Path $reportPath) {
        try {
            Start-Process $reportPath
            Write-Host "📖 Opening test report..." -ForegroundColor Green
        } catch {
            Write-Host "❌ Could not open report automatically. Please open: $reportPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Report file not found: $reportPath" -ForegroundColor Red
    }
}

# Exit with appropriate code
if ($mainTestResult.Success) {
    Write-Host ""
    Write-Host "✅ Test execution completed successfully" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Test execution completed with failures" -ForegroundColor Red
    exit 1
}