@echo off
title Switea Nature Cafe - Stopper
color 0C

echo ====================================================================
echo        STOPPING SWITEA NATURE CAFE SERVERS
echo ====================================================================
echo.

echo Terminating processes on Port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Terminating processes on Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [OK] All Switea servers have been stopped.
timeout /t 2 /nobreak >nul
