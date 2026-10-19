@echo off
title Switea Nature Cafe - Launcher
color 0A

echo ====================================================================
echo        SWITEA NATURE CAFE - RESTAURANT MANAGEMENT SYSTEM
echo ====================================================================
echo.
echo [1/4] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js is installed.
echo.

echo [2/4] Checking dependencies...
if not exist "%~dp0backend\node_modules" (
    echo [NOTICE] Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
)

if not exist "%~dp0frontend\node_modules" (
    echo [NOTICE] Installing frontend dependencies...
    cd /d "%~dp0frontend"
    call npm install
)

echo [OK] Dependencies verified.
echo.

echo [3/4] Starting Backend API Server (Port 5000)...
start "Switea Backend [Port 5000]" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

echo [3/4] Starting Frontend Dev Server (Port 5173)...
start "Switea Frontend [Port 5173]" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo [4/4] Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo ====================================================================
echo    SWITEA NATURE CAFE IS NOW RUNNING!
echo ====================================================================
echo.
echo  * Customer Website:  http://localhost:5173/
echo  * Digital Menu:      http://localhost:5173/menu
echo  * Table 01 Demo QR:  http://localhost:5173/menu?table=sw-tbl-g01-nature
echo  * Admin Portal:      http://localhost:5173/admin
echo  * Backend API:       http://localhost:5000/api
echo.
echo  Default Login Credentials:
echo  - Owner / Admin:     owner@switea.com   / Password123!
echo  - Kitchen Display:   kitchen@switea.com / Password123!
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo Keep the backend and frontend command windows open while using Switea.
echo Press any key to exit this launcher window.
pause >nul
