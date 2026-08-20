@echo off
setlocal enabledelayedexpansion
title Data Entry Pro - Enterprise Auto Updater

echo ===================================================================
echo             DATA ENTRY PRO - ENTERPRISE AUTO-UPDATER
echo ===================================================================
echo.

cd /d "%~dp0"

:: Step 1: Automatic Backup Snapshot Creation & Pruning
echo [*] Step 1/3: Creating automatic safety backup...
powershell -Command "
try {
    $backupDir = Join-Path (Get-Location) 'backups';
    if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null };

    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss';
    $zipName = \"backup_pre_update_$timestamp.zip\";
    $zipPath = Join-Path $backupDir $zipName;

    # Exclude git, backups, and temporary files from archive
    $filesToBackup = Get-ChildItem -Path '.' -Exclude '.git', 'backups', '*.tmp', '*.log';
    Compress-Archive -Path $filesToBackup.FullName -DestinationPath $zipPath -Force;
    Write-Host \"[+] Backup created: $zipName\" -ForegroundColor Green;

    # Prune old backups (Keep only the latest 3)
    $allBackups = Get-ChildItem -Path $backupDir -Filter 'backup_*.zip' | Sort-Object CreationTime -Descending;
    if ($allBackups.Count -gt 3) {
        $allBackups | Select-Object -Skip 3 | ForEach-Object {
            Remove-Item $_.FullName -Force;
            Write-Host \"[-] Purged old backup: $($_.Name)\" -ForegroundColor Gray;
        }
    }
} catch {
    Write-Host \"[!] Backup warning: $($_.Exception.Message)\" -ForegroundColor Yellow;
}
"

:: Step 2: Synchronize code from GitHub
echo.
echo [*] Step 2/3: Fetching and applying latest code from GitHub...
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Git detected. Running self-healing sync...
    git fetch origin main
    if !ERRORLEVEL! EQU 0 (
        git reset --hard origin/main
        echo [SUCCESS] Git repository synced with origin/main!
        goto TRIGGER_RELOAD
    )
)

echo [*] Using direct PowerShell GitHub package updater...
powershell -Command "
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
    $repo = '0001marketingguru/data-entry-pro';
    $url = 'https://github.com/' + $repo + '/archive/refs/heads/main.zip';
    $zipPath = Join-Path $env:TEMP 'data-entry-pro-main.zip';
    $extractPath = Join-Path $env:TEMP 'data-entry-pro-extract';
    
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing;
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force };
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force;
    
    $sourceDir = Join-Path $extractPath 'data-entry-pro-main';
    Copy-Item -Path \"$sourceDir\*\" -Destination '.' -Recurse -Force;
    
    Remove-Item $zipPath -Force;
    Remove-Item $extractPath -Recurse -Force;
    Write-Host '[SUCCESS] Package files updated successfully!' -ForegroundColor Green;
} catch {
    Write-Error $_.Exception.Message;
    exit 1;
}
"

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
powershell -Command "
try {
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();
    $json = @{ timestamp = $now; version = '1.2.0'; updated_at = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss') } | ConvertTo-Json;
    Set-Content -Path 'reload_signal.json' -Value $json -Force;
    Write-Host '[+] Zero-click reload signal sent to Chrome background worker!' -ForegroundColor Green;
} catch {
    Write-Host \"[!] Reload signal warning: $($_.Exception.Message)\" -ForegroundColor Yellow;
}
"

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
pause
