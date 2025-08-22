@echo off
echo ========================================
echo    TrustSeal ICP - WCHL 2025 Demo
echo ========================================
echo.
echo Starting TrustSeal ICP services...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Building and starting services...
echo This may take a few minutes on first run...
echo.

REM Start the services
docker-compose up --build

echo.
echo Demo stopped. Press any key to exit...
pause >nul
