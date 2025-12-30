param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$TestArgs
)

$jestPath = "node_modules/jest/bin/jest.js"
$configPath = "jest.config.cjs"

# Use the node executable directly
$nodeExe = "node"

if ($TestArgs) {
    & $nodeExe $jestPath --config $configPath $TestArgs
} else {
    & $nodeExe $jestPath --config $configPath
}