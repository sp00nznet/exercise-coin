@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: Exercise Coin - Local Android Build (No Expo Account Required)
:: Quick APK build for testing
:: ============================================================================

title Exercise Coin - Local Android Build

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo %CYAN%============================================================================%RESET%
echo %CYAN%      Exercise Coin - Local Android Build                                  %RESET%
echo %CYAN%      Build APK without Expo account                                       %RESET%
echo %CYAN%============================================================================%RESET%
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "MOBILE_APP=%PROJECT_ROOT%\mobile-app"

cd /d "%PROJECT_ROOT%"

:: Check Node
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js not found! Run deploy-server.bat first.
    pause
    exit /b 1
)

:: Check Java
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[INFO]%RESET% Installing Java JDK...
    winget install Microsoft.OpenJDK.17 --silent --accept-package-agreements --accept-source-agreements
    echo %YELLOW%Please restart this script after Java installation.%RESET%
    pause
    exit /b 0
)

:: Check Android SDK
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)

if not defined ANDROID_HOME (
    echo %RED%[ERROR]%RESET% Android SDK not found!
    echo.
    echo %YELLOW%Please install Android Studio from:%RESET%
    echo   https://developer.android.com/studio
    echo.
    echo %YELLOW%Or set ANDROID_HOME environment variable.%RESET%
    pause
    exit /b 1
)

echo %GREEN%[OK]%RESET% Android SDK: %ANDROID_HOME%

:: Navigate to mobile app
cd /d "%MOBILE_APP%"
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Mobile app directory not found!
    pause
    exit /b 1
)

:: Install dependencies
echo.
echo %YELLOW%[NPM]%RESET% Installing dependencies...
call npm install

:: Generate android folder
if not exist "android" (
    echo.
    echo %YELLOW%[EXPO]%RESET% Generating Android project...
    call npx expo prebuild --platform android --clean
)

:: Build APK
echo.
echo %YELLOW%[BUILD]%RESET% Building APK...
cd android

call gradlew.bat assembleRelease
if %ERRORLEVEL% neq 0 (
    echo.
    echo %YELLOW%[INFO]%RESET% Release build failed. Trying debug build...
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% neq 0 (
        echo %RED%[ERROR]%RESET% Build failed!
        cd ..
        pause
        exit /b 1
    )
    set "APK_TYPE=debug"
    set "APK_PATH=app\build\outputs\apk\debug\app-debug.apk"
) else (
    set "APK_TYPE=release"
    set "APK_PATH=app\build\outputs\apk\release\app-release.apk"
)

cd ..

:: Copy APK
if exist "android\!APK_PATH!" (
    copy "android\!APK_PATH!" "ExerciseCoin-!APK_TYPE!.apk" >nul
    echo.
    echo %GREEN%============================================================================%RESET%
    echo %GREEN%   BUILD SUCCESSFUL!                                                       %RESET%
    echo %GREEN%============================================================================%RESET%
    echo.
    echo %CYAN%APK Location:%RESET%
    echo   %YELLOW%%MOBILE_APP%\ExerciseCoin-!APK_TYPE!.apk%RESET%
    echo.
    echo %CYAN%Install on device:%RESET%
    echo   adb install ExerciseCoin-!APK_TYPE!.apk
    echo.
    echo %CYAN%Or drag the APK to your Android device.%RESET%
) else (
    echo %RED%[ERROR]%RESET% APK not found at expected location!
)

echo.
pause
