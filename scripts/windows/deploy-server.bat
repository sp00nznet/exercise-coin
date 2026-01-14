@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: Exercise Coin - Windows Server Stack Deploy Script
:: One-click installation for Server, Admin Portal, and Exchange
:: ============================================================================

title Exercise Coin Server Deployment

:: Colors for Windows 10+
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo %CYAN%============================================================================%RESET%
echo %CYAN%      Exercise Coin - Server Stack Deployment                              %RESET%
echo %CYAN%      Server + Admin Portal + Exchange                                     %RESET%
echo %CYAN%============================================================================%RESET%
echo.

:: Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
cd /d "%PROJECT_ROOT%"

echo %YELLOW%[INFO]%RESET% Project root: %CD%
echo.

:: ============================================================================
:: Step 1: Check and Install Dependencies
:: ============================================================================

echo %CYAN%[STEP 1/7]%RESET% Checking dependencies...
echo.

:: Check for Node.js
echo %YELLOW%[CHECK]%RESET% Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js not found!
    echo.
    echo %YELLOW%Installing Node.js via winget...%RESET%
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install Node.js via winget.
        echo %YELLOW%Please install Node.js manually from: https://nodejs.org/%RESET%
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    :: Refresh PATH
    set "PATH=%PATH%;%ProgramFiles%\nodejs"
    echo %GREEN%[OK]%RESET% Node.js installed!
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo %GREEN%[OK]%RESET% Node.js found: !NODE_VER!
)

:: Check for npm
echo %YELLOW%[CHECK]%RESET% npm...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% npm not found! Please reinstall Node.js.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo %GREEN%[OK]%RESET% npm found: !NPM_VER!
)

:: Check for Git
echo %YELLOW%[CHECK]%RESET% Git...
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[WARN]%RESET% Git not found. Installing via winget...
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo %YELLOW%[WARN]%RESET% Git installation skipped. Some features may not work.
    ) else (
        echo %GREEN%[OK]%RESET% Git installed!
    )
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo %GREEN%[OK]%RESET% !GIT_VER!
)

:: Check for MongoDB
echo %YELLOW%[CHECK]%RESET% MongoDB...
where mongod >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[INFO]%RESET% MongoDB not found locally.
    echo %YELLOW%[INFO]%RESET% Options:
    echo        1. Install MongoDB locally (recommended for development)
    echo        2. Use MongoDB Atlas cloud (set MONGODB_URI in .env)
    echo.
    set /p INSTALL_MONGO="Install MongoDB locally? (Y/N): "
    if /i "!INSTALL_MONGO!"=="Y" (
        echo %YELLOW%Installing MongoDB via winget...%RESET%
        winget install MongoDB.Server --silent --accept-package-agreements --accept-source-agreements
        if %ERRORLEVEL% neq 0 (
            echo %YELLOW%[WARN]%RESET% MongoDB installation via winget failed.
            echo %YELLOW%[INFO]%RESET% Download from: https://www.mongodb.com/try/download/community
        ) else (
            echo %GREEN%[OK]%RESET% MongoDB installed!
        )
    ) else (
        echo %YELLOW%[INFO]%RESET% Skipping MongoDB local install. Make sure MONGODB_URI is set!
    )
) else (
    echo %GREEN%[OK]%RESET% MongoDB found!
)

echo.

:: ============================================================================
:: Step 2: Create Environment Files
:: ============================================================================

echo %CYAN%[STEP 2/7]%RESET% Setting up environment files...
echo.

:: Server .env
if not exist "server\.env" (
    echo %YELLOW%[INFO]%RESET% Creating server\.env...
    (
        echo # Exercise Coin Server Configuration
        echo PORT=3000
        echo MONGODB_URI=mongodb://localhost:27017/exercise-coin
        echo JWT_SECRET=exercise-coin-super-secret-key-%RANDOM%%RANDOM%
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Coin Daemon
        echo COIN_DAEMON_HOST=localhost
        echo COIN_DAEMON_PORT=39338
        echo COIN_DAEMON_USER=exercisecoin
        echo COIN_DAEMON_PASS=password
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Admin
        echo ADMIN_JWT_SECRET=admin-secret-key-%RANDOM%%RANDOM%
    ) > server\.env
    echo %GREEN%[OK]%RESET% server\.env created
) else (
    echo %GREEN%[OK]%RESET% server\.env already exists
)

echo.

:: ============================================================================
:: Step 3: Install Server Dependencies
:: ============================================================================

echo %CYAN%[STEP 3/7]%RESET% Installing server dependencies...
echo.

cd server
echo %YELLOW%[NPM]%RESET% Running npm install in server...
call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Failed to install server dependencies!
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Server dependencies installed!
cd ..

echo.

:: ============================================================================
:: Step 4: Install Admin Portal Dependencies
:: ============================================================================

echo %CYAN%[STEP 4/7]%RESET% Installing admin portal dependencies...
echo.

cd admin-portal
echo %YELLOW%[NPM]%RESET% Running npm install in admin-portal...
call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Failed to install admin portal dependencies!
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Admin portal dependencies installed!
cd ..

echo.

:: ============================================================================
:: Step 5: Install Exchange Dependencies
:: ============================================================================

echo %CYAN%[STEP 5/7]%RESET% Installing exchange dependencies...
echo.

cd exchange
echo %YELLOW%[NPM]%RESET% Running npm install in exchange...
call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Failed to install exchange dependencies!
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Exchange dependencies installed!
cd ..

echo.

:: ============================================================================
:: Step 6: Build Frontend Apps
:: ============================================================================

echo %CYAN%[STEP 6/7]%RESET% Building frontend applications...
echo.

:: Build Admin Portal
echo %YELLOW%[BUILD]%RESET% Building admin portal...
cd admin-portal
call npm run build
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[WARN]%RESET% Admin portal build failed. Will use dev server instead.
) else (
    echo %GREEN%[OK]%RESET% Admin portal built!
)
cd ..

:: Build Exchange
echo %YELLOW%[BUILD]%RESET% Building exchange...
cd exchange
call npm run build
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[WARN]%RESET% Exchange build failed. Will use dev server instead.
) else (
    echo %GREEN%[OK]%RESET% Exchange built!
)
cd ..

echo.

:: ============================================================================
:: Step 7: Create Startup Scripts
:: ============================================================================

echo %CYAN%[STEP 7/7]%RESET% Creating startup scripts...
echo.

:: Create start-all.bat
(
    echo @echo off
    echo title Exercise Coin - All Services
    echo.
    echo echo Starting Exercise Coin Server Stack...
    echo echo.
    echo.
    echo :: Start MongoDB ^(if installed locally^)
    echo where mongod ^>nul 2^>^&1
    echo if %%ERRORLEVEL%% equ 0 ^(
    echo     echo Starting MongoDB...
    echo     start "MongoDB" cmd /c "mongod --dbpath C:\data\db"
    echo     timeout /t 3 /nobreak ^>nul
    echo ^)
    echo.
    echo :: Start Server
    echo echo Starting API Server on port 3000...
    echo start "Exercise Coin Server" cmd /c "cd /d %%~dp0..\..\server && npm run dev"
    echo timeout /t 5 /nobreak ^>nul
    echo.
    echo :: Start Admin Portal
    echo echo Starting Admin Portal on port 3001...
    echo start "Admin Portal" cmd /c "cd /d %%~dp0..\..\admin-portal && npm run dev"
    echo timeout /t 2 /nobreak ^>nul
    echo.
    echo :: Start Exchange
    echo echo Starting Exchange on port 3002...
    echo start "Exchange" cmd /c "cd /d %%~dp0..\..\exchange && npm run dev"
    echo.
    echo echo.
    echo echo ============================================
    echo echo   All services started!
    echo echo.
    echo echo   API Server:    http://localhost:3000
    echo echo   Admin Portal:  http://localhost:3001
    echo echo   Exchange:      http://localhost:3002
    echo echo ============================================
    echo echo.
    echo echo Press any key to stop all services...
    echo pause ^>nul
    echo.
    echo taskkill /FI "WINDOWTITLE eq Exercise Coin Server*" /F ^>nul 2^>^&1
    echo taskkill /FI "WINDOWTITLE eq Admin Portal*" /F ^>nul 2^>^&1
    echo taskkill /FI "WINDOWTITLE eq Exchange*" /F ^>nul 2^>^&1
    echo taskkill /FI "WINDOWTITLE eq MongoDB*" /F ^>nul 2^>^&1
    echo echo All services stopped.
) > "%SCRIPT_DIR%start-all.bat"
echo %GREEN%[OK]%RESET% Created start-all.bat

:: Create start-server-only.bat
(
    echo @echo off
    echo title Exercise Coin Server
    echo cd /d %%~dp0..\..\server
    echo echo Starting Exercise Coin API Server...
    echo npm run dev
) > "%SCRIPT_DIR%start-server-only.bat"
echo %GREEN%[OK]%RESET% Created start-server-only.bat

:: Create start-admin-portal.bat
(
    echo @echo off
    echo title Admin Portal
    echo cd /d %%~dp0..\..\admin-portal
    echo echo Starting Admin Portal...
    echo npm run dev
) > "%SCRIPT_DIR%start-admin-portal.bat"
echo %GREEN%[OK]%RESET% Created start-admin-portal.bat

:: Create start-exchange.bat
(
    echo @echo off
    echo title Exchange
    echo cd /d %%~dp0..\..\exchange
    echo echo Starting Exchange...
    echo npm run dev
) > "%SCRIPT_DIR%start-exchange.bat"
echo %GREEN%[OK]%RESET% Created start-exchange.bat

echo.

:: ============================================================================
:: Done!
:: ============================================================================

echo.
echo %GREEN%============================================================================%RESET%
echo %GREEN%   DEPLOYMENT COMPLETE!                                                    %RESET%
echo %GREEN%============================================================================%RESET%
echo.
echo %CYAN%Quick Start:%RESET%
echo   Run: %YELLOW%scripts\windows\start-all.bat%RESET%
echo.
echo %CYAN%URLs:%RESET%
echo   API Server:    %YELLOW%http://localhost:3000%RESET%
echo   Admin Portal:  %YELLOW%http://localhost:3001%RESET%
echo   Exchange:      %YELLOW%http://localhost:3002%RESET%
echo.
echo %CYAN%Default Admin Login:%RESET%
echo   Email:    %YELLOW%admin@exercisecoin.com%RESET%
echo   Password: %YELLOW%admin123%RESET%
echo   ^(Create via: POST /api/admin/create-first-admin^)
echo.
echo %CYAN%Individual Scripts:%RESET%
echo   - start-all.bat          - Start everything
echo   - start-server-only.bat  - API server only
echo   - start-admin-portal.bat - Admin portal only
echo   - start-exchange.bat     - Exchange only
echo.

set /p START_NOW="Start all services now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo %YELLOW%Starting services...%RESET%
    call "%SCRIPT_DIR%start-all.bat"
)

echo.
echo Press any key to exit...
pause >nul
