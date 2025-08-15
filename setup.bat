@echo off
REM Storybook Validation Script - Setup Script for Windows
REM This script installs all dependencies for both the root project and example project

echo 🚀 Setting up Storybook Validation Script...
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version detected:
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install example project dependencies
echo 📦 Installing example project dependencies...
cd example
call npm install
cd ..

echo.
echo 🎉 Setup complete! All dependencies installed.
echo.
echo Next steps:
echo 1. Run tests: npm test
echo 2. Validate a story: npm run validate ^<story_path^>
echo 3. Start your research!
echo.
echo For more information, see README.md
pause
