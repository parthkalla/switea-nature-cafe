@echo off
setlocal enabledelayedexpansion
title RoastFuze Swiggy and Zomato Sync Bridge Setup
color 0a

echo =====================================================================
echo          ROASTFUZE POS -- SWIGGY AND ZOMATO SYNC BRIDGE SETUP
echo =====================================================================
echo.
echo [1/3] Copying sync bridge engine to local system...

:: Target directory in user AppData
set "DEST_DIR=%LOCALAPPDATA%\RoastFuze\SyncBridge"
if not exist "%DEST_DIR%" (
    mkdir "%DEST_DIR%"
)

:: Copy extension files
if exist "%~dp0..\extension\manifest.json" (
    xcopy /E /I /Y "%~dp0..\extension" "%DEST_DIR%" >nul 2>&1
) else if exist "E:\roastfuze\extension\manifest.json" (
    xcopy /E /I /Y "E:\roastfuze\extension" "%DEST_DIR%" >nul 2>&1
) else if exist "E:\Switea\extension\manifest.json" (
    xcopy /E /I /Y "E:\Switea\extension" "%DEST_DIR%" >nul 2>&1
)

echo [OK] Files copied to: %DEST_DIR%
echo.

echo [2/3] Detecting Google Chrome...
set "CHROME_EXE="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if "%CHROME_EXE%"=="" (
    set "CHROME_EXE=chrome.exe"
)

echo [OK] Chrome found: "%CHROME_EXE%"
echo.

echo [3/3] Creating Desktop Shortcut 'RoastFuze POS with Sync'...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\RoastFuze POS with Sync.lnk'); $Shortcut.TargetPath = '%CHROME_EXE%'; $Shortcut.Arguments = '--user-data-dir=\"%LOCALAPPDATA%\RoastFuze\ChromeProfile\" --load-extension=\"%DEST_DIR%\" \"http://localhost:5170/admin/marketplace\"'; $Shortcut.Description = 'RoastFuze POS with Swiggy & Zomato Realtime Sync'; $Shortcut.Save()" >nul 2>&1

echo [OK] Desktop shortcut created successfully!
echo.
echo =====================================================================
echo   SUCCESS: Launching Chrome with RoastFuze Sync Bridge active...
echo =====================================================================
echo.

:: Launch with dedicated profile so it works even if another Chrome window is open
start "" "%CHROME_EXE%" --user-data-dir="%LOCALAPPDATA%\RoastFuze\ChromeProfile" --load-extension="%DEST_DIR%" "http://localhost:5170/admin/marketplace"

echo Press any key to close this installer window...
pause >nul
