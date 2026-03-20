$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend-java"
$script = Join-Path $backend "run-backend.ps1"

if (-not (Test-Path $script)) {
    Write-Host "run-backend.ps1 not found in backend-java."
    exit 1
}

Set-Location $backend
PowerShell -ExecutionPolicy Bypass -File $script
