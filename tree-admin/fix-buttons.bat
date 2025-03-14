@echo off
echo ========================================
echo     Fixing Button Click Issues
echo ========================================

echo Stopping running processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next

echo.
echo Deleting node_modules...
if exist node_modules rmdir /s /q node_modules

echo.
echo Reinstalling dependencies...
npm install

echo.
echo Starting the application in development mode...
echo Visit http://localhost:3001/test-buttons to test button functionality!
echo.
npm run dev 