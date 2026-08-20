@echo off
setlocal enabledelayedexpansion
title Data Entry Pro - Instant Rollback Utility

echo ===================================================================
echo             DATA ENTRY PRO - INSTANT ROLLBACK UTILITY
echo ===================================================================
echo.

cd /d "%~dp0"

powershell -Command "
$backupDir = Join-Path (Get-Location) 'backups';
if (!(Test-Path $backupDir)) {
    Write-Host '[ERROR] No backups directory found. Rollback cannot proceed.' -ForegroundColor Red;
    exit 1;
}

$backups = Get-ChildItem -Path $backupDir -Filter 'backup_*.zip' | Sort-Object CreationTime -Descending;
if ($backups.Count -eq 0) {
    Write-Host '[ERROR] No backup ZIP archives found in backups/ directory.' -ForegroundColor Red;
    exit 1;
}

Write-Host 'Available Restore Snapshots:' -ForegroundColor Cyan;
for ($i = 0; $i -lt $backups.Count; $i++) {
    Write-Host \" [$($i+1)] $($backups[$i].Name) (Created: $($backups[$i].CreationTime.ToString('yyyy-MM-dd HH:mm:ss')))\";
}

$selectedBackup = $backups[0];
Write-Host '';
Write-Host \"[*] Restoring most recent backup: $($selectedBackup.Name)...\" -ForegroundColor Yellow;

try {
    $tempRestore = Join-Path $env:TEMP 'data-entry-pro-restore';
    if (Test-Path $tempRestore) { Remove-Item $tempRestore -Recurse -Force };
    
    Expand-Archive -Path $selectedBackup.FullName -DestinationPath $tempRestore -Force;
    Copy-Item -Path \"$tempRestore\*\" -Destination '.' -Recurse -Force;
    Remove-Item $tempRestore -Recurse -Force;

    # Trigger Zero-Click Chrome Auto-Reload
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();
    $json = @{ timestamp = $now; version = 'rollback'; restored_from = $selectedBackup.Name; restored_at = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss') } | ConvertTo-Json;
    Set-Content -Path 'reload_signal.json' -Value $json -Force;

    Write-Host '';
    Write-Host '===================================================================' -ForegroundColor Green;
    Write-Host '  [SUCCESS] RESTORED TO PREVIOUS VERSION & AUTO-RELOADED IN CHROME!' -ForegroundColor Green;
    Write-Host '===================================================================' -ForegroundColor Green;
    Write-Host '  * Restored from: ' $selectedBackup.Name;
    Write-Host '  * Chrome Status: Auto-Reloaded in Background (0 Clicks Required)';
    Write-Host '===================================================================';
} catch {
    Write-Error \"Restore failed: $($_.Exception.Message)\";
    exit 1;
}
"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Rollback failed. See details above.
)

echo.
pause
