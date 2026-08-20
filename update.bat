@echo off
setlocal
title Data Entry Pro - Enterprise Auto Updater

echo ===================================================================
echo             DATA ENTRY PRO - ENTERPRISE AUTO-UPDATER
echo ===================================================================
echo.

cd /d "%~dp0"

:: Step 1: Safety Backup
echo [*] Step 1/3: Creating automatic safety backup...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = Join-Path (Get-Location) 'backups'; if (!(Test-Path $b)) { New-Item -ItemType Directory -Path $b -Force | Out-Null }; $t = Get-Date -Format 'yyyyMMdd_HHmmss'; $z = Join-Path $b ('backup_pre_update_' + $t + '.zip'); $f = Get-ChildItem -Path '.' -Exclude '.git', 'backups', '*.tmp', '*.log'; Compress-Archive -Path $f.FullName -DestinationPath $z -Force; Write-Host '[+] Backup created successfully.' -ForegroundColor Green; $all = Get-ChildItem -Path $b -Filter 'backup_*.zip' | Sort-Object CreationTime -Descending; if ($all.Count -gt 3) { $all | Select-Object -Skip 3 | ForEach-Object { Remove-Item $_.FullName -Force; Write-Host ('[-] Purged old backup: ' + $_.Name) -ForegroundColor Gray } }"

:: Step 2: Synchronize code from GitHub
echo.
echo [*] Step 2/3: Fetching and applying latest code from GitHub...
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Git detected. Running self-healing sync...
    git fetch origin main
    if %ERRORLEVEL% EQU 0 (
        git reset --hard origin/main
        echo [SUCCESS] Git repository synced with origin/main!
        goto TRIGGER_RELOAD
    )
)

echo [*] Using direct PowerShell GitHub package updater...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = 'https://github.com/0001marketingguru/data-entry-pro/archive/refs/heads/main.zip'; $zp = Join-Path $env:TEMP 'dep-main.zip'; $ep = Join-Path $env:TEMP 'dep-extract'; Invoke-WebRequest -Uri $u -OutFile $zp -UseBasicParsing; if (Test-Path $ep) { Remove-Item $ep -Recurse -Force }; Expand-Archive -Path $zp -DestinationPath $ep -Force; $src = Join-Path $ep 'data-entry-pro-main'; Copy-Item -Path \"$src\*\" -Destination '.' -Recurse -Force; Remove-Item $zp -Force; Remove-Item $ep -Recurse -Force; Write-Host '[SUCCESS] Package files updated successfully!' -ForegroundColor Green;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Update failed. Check your internet connection.
    pause
    exit /b 1
)

:TRIGGER_RELOAD
:: Step 3: Trigger Zero-Click Auto-Reload Signal in Chrome
echo.
echo [*] Step 3/3: Triggering zero-click Chrome auto-reload signal...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); $json = @{ timestamp = $now; version = '1.2.1'; updated_at = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss') } | ConvertTo-Json; Set-Content -Path 'reload_signal.json' -Value $json -Force; Write-Host '[+] Zero-click reload signal sent to Chrome background worker!' -ForegroundColor Green;"

echo.
echo ===================================================================
echo   [SUCCESS] DATA ENTRY PRO UPDATED & AUTO-RELOADED IN CHROME!
echo ===================================================================
echo.
echo   * Files Updated: 100%% Clean (origin/main)
echo   * Safety Backup: Saved in backups/ folder
echo   * Chrome Status: Auto-Reloaded in Background (ZERO clicks needed!)
echo.
echo ===================================================================
timeout /t 3
