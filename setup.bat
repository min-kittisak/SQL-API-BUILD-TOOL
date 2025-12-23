@echo off
echo ====================================
echo SQL to API Builder - Setup Script
echo ====================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found!
node --version
echo.

echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed!
echo.

echo [3/5] Creating example config file...
if not exist db-config-template.json (
    echo {
    echo   "type": "postgresql",
    echo   "host": "localhost",
    echo   "port": 5432,
    echo   "database": "your_database",
    echo   "user": "your_user",
    echo   "password": "your_password"
    echo } > db-config-template.json
)
echo ✓ Template created!
echo.

echo [4/5] Checking for database drivers...
echo ✓ PostgreSQL driver (pg) installed
echo ✓ MySQL driver (mysql2) installed
echo ✓ SQL Server driver (mssql) installed
echo.

echo [5/5] Setup complete!
echo.
echo ====================================
echo Next Steps:
echo ====================================
echo 1. Edit db-config-template.json with your database credentials
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo 4. Upload your config file and start building!
echo.
echo For help, read QUICKSTART.md
echo ====================================
echo.
pause
