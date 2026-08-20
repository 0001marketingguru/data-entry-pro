@echo off
title Updating Data Entry Pro...
echo ========================================================
echo   Updating Data Entry Pro to the Latest GitHub Release
echo ========================================================
echo.

:: Navigate to script directory
cd /d "%~dp0"

:: Pull latest changes from main branch
git pull origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Data Entry Pro is now up to date!
    echo ========================================================
    echo.
    echo   Next Step:
    echo   1. Go to chrome://extensions/ in Google Chrome.
    echo   2. Click the [Reload] icon on the Data Entry Pro card.
    echo.
) else (
    echo ========================================================
    echo   [ERROR] Update failed. Check your internet connection.
    echo ========================================================
)

pause
