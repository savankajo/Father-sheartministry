@echo off
echo ===========================================
echo Father Heart Church App - Setup & Start
echo ===========================================
echo.
echo Installing dependencies (this may take a minute)...
call npm install
echo.
echo ===========================================
echo Starting the Application...
echo The app will open at http://localhost:5173
echo Press Ctrl+C to stop the server when done.
echo ===========================================
call npm run dev
pause
