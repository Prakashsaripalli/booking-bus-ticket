$ErrorActionPreference = "Stop"

function Import-BatEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*set\s+"?([^=]+)=(.*)"?\s*$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value.EndsWith('"')) {
                $value = $value.TrimEnd('"')
            }
            $value = [System.Text.RegularExpressions.Regex]::Replace($value, '%([^%]+)%', {
                param($match)
                $referencedName = $match.Groups[1].Value
                $expanded = [Environment]::GetEnvironmentVariable($referencedName)
                if ([string]::IsNullOrEmpty($expanded)) {
                    return $match.Value
                }
                return $expanded
            })
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Import-BatEnv ".\\db.env.bat"
Import-BatEnv ".\\smtp.env.bat"

if (-not $env:PORT) { $env:PORT = "8000" }
if (-not $env:FRONTEND_DIR) {
    $env:FRONTEND_DIR = (Resolve-Path (Join-Path $scriptDir "..")).Path
}

$jarPath = Join-Path $scriptDir "target\\backend-java-1.0.0.jar"
if (-not (Test-Path $jarPath)) {
    $mavenCandidates = @(
        (Join-Path $scriptDir "..\\.tools\\apache-maven-3.9.9\\bin\\mvn.cmd"),
        "mvn"
    )

    $mavenCommand = $mavenCandidates | Where-Object { $_ -eq "mvn" -or (Test-Path $_) } | Select-Object -First 1
    if (-not $mavenCommand) {
        Write-Host "Jar not found and Maven is unavailable. Build with .tools\\apache-maven-3.9.9\\bin\\mvn.cmd -DskipTests package"
        exit 1
    }

    Write-Host "Jar not found. Building backend..."
    & $mavenCommand -q -DskipTests package
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $jarPath)) {
        Write-Host "Backend build failed."
        exit 1
    }
}

Write-Host "Starting Java Backend..."
Write-Host "PORT=$env:PORT"
Write-Host "FRONTEND_DIR=$env:FRONTEND_DIR"
java -jar $jarPath
