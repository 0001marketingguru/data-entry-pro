@echo off
setlocal enabledelayedexpansion
title Data Entry Pro - Enterprise Auto Updater

echo ===================================================================
echo             DATA ENTRY PRO - ENTERPRISE AUTO-UPDATER
echo ===================================================================
echo.

cd /d "%~dp0"

:: Step 1: Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Git detected on system. Synchronizing from GitHub...
    echo [*] Fetching latest release from origin/main...
    git fetch origin main
    if !ERRORLEVEL! EQU 0 (
        echo [*] Applying updates and clearing local conflicts...
        git reset --hard origin/main
        echo.
        echo [SUCCESS] Files updated to the latest GitHub commit!
        goto FINISH
    ) else (
        echo [!] Git sync failed. Attempting direct GitHub ZIP fallback...
    )
)

:: Step 2: Fallback - PowerShell GitHub Release Downloader
echo [*] Downloading latest release package directly via PowerShell...
powershell -Command "
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
    $repo = '0001marketingguru/data-entry-pro';
    $url = 'https://github.com/' + $repo + '/archive/refs/heads/main.zip';
    $zipPath = Join-Path $env:TEMP 'data-entry-pro-main.zip';
    $extractPath = Join-Path $env:TEMP 'data-entry-pro-extract';
    
    Write-Host 'Downloading repository package...';
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing;
    
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force };
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force;
    
    $sourceDir = Join-Path $extractPath 'data-entry-pro-main';
    Copy-Item -Path \"$sourceDir\*\" -Destination '.' -Recurse -Force;
    
    Remove-Item $zipPath -Force;
    Remove-Item $extractPath -Recurse -Force;
    Write-Host 'Update extracted successfully!' -ForegroundColor Green;
} catch {
    Write-Error $_.Exception.Message;
    exit 1;
}
"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ===================================================================
    echo  [ERROR] Update failed. Please check your internet connection.
    echo ===================================================================
    pause
    exit /b 1
)

:FINISH
echo.
echo ===================================================================
echo                UPDATE COMPLETED SUCCESSFULLY!
echo ===================================================================
echo.
echo [*] Launching Chrome Extensions page to apply updates...
start chrome chrome://extensions/

echo.
echo [!] FINAL STEP IN GOOGLE CHROME:
echo     Click the [Reload] icon on the Data Entry Pro card.
echo.
echo ===================================================================
pause
