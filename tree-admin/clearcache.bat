@echo off
echo ========================================
echo     Fixing Tree Admin App Issues
echo ========================================

echo Stopping running processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next

echo.
echo Done! 
echo.
echo Now run: npm run dev
echo.
echo Visit http://localhost:3001/admin to test the app
pause 