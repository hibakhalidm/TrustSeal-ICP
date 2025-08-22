@echo off
echo Setting up TrustSeal ICP Demo...
echo.

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo Error: npm is not installed.
    pause
    exit /b 1
)

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

echo Building project...
npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build project.
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo To start the demo:
echo   npm start
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
