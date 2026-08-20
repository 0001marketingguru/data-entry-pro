@echo off
title Setting up Desktop Shortcut for Data Entry Pro...
echo ===================================================================
echo       DATA ENTRY PRO - DESKTOP SHORTCUT INSTALLER
echo ===================================================================
echo.

cd /d "%~dp0"

powershell -Command "
$WshShell = New-Object -comObject WScript.Shell;
$desktop = [System.Environment]::GetFolderPath('Desktop');
$shortcutPath = Join-Path $desktop 'Update Data Entry Pro.lnk';
$targetBat = Join-Path (Get-Location) 'update.bat';
$iconPath = Join-Path (Get-Location) 'icons\icon128.png';

$Shortcut = $WshShell.CreateShortcut($shortcutPath);
$Shortcut.TargetPath = $targetBat;
$Shortcut.WorkingDirectory = (Get-Location).Path;
$Shortcut.Description = '1-Click Auto Updater for Data Entry Pro Claims Automation';
$Shortcut.Save();

Write-Host '[SUCCESS] Desktop shortcut created successfully on your Desktop!' -ForegroundColor Green;
Write-Host 'Location:' $shortcutPath;
"

echo.
echo ===================================================================
echo You can now double-click "Update Data Entry Pro" on your Desktop 
echo anytime you want to update to the latest version!
echo ===================================================================
pause
