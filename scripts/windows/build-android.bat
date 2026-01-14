@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: Exercise Coin - Windows Android Build Script
:: One-click Android APK/AAB build
:: ============================================================================

title Exercise Coin Android Build

:: Colors
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo %CYAN%============================================================================%RESET%
echo %CYAN%      Exercise Coin - Android Build Script                                 %RESET%
echo %CYAN%      Build APK or AAB for Google Play                                     %RESET%
echo %CYAN%============================================================================%RESET%
echo.

:: Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "MOBILE_APP=%PROJECT_ROOT%\mobile-app"

cd /d "%PROJECT_ROOT%"
echo %YELLOW%[INFO]%RESET% Project root: %CD%
echo.

:: ============================================================================
:: Step 1: Check Dependencies
:: ============================================================================

echo %CYAN%[STEP 1/8]%RESET% Checking dependencies...
echo.

:: Check for Node.js
echo %YELLOW%[CHECK]%RESET% Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js not found!
    echo %YELLOW%Run deploy-server.bat first or install Node.js from https://nodejs.org/%RESET%
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo %GREEN%[OK]%RESET% Node.js: %%i

:: Check for npm
echo %YELLOW%[CHECK]%RESET% npm...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo %GREEN%[OK]%RESET% npm: %%i

:: Check for Java (required for Android builds)
echo %YELLOW%[CHECK]%RESET% Java JDK...
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Java not found!
    echo.
    echo %YELLOW%Installing Java JDK via winget...%RESET%
    winget install Microsoft.OpenJDK.17 --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install Java.
        echo %YELLOW%Please install Java JDK 17 manually from: https://adoptium.net/%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%[OK]%RESET% Java JDK installed!
    echo %YELLOW%[INFO]%RESET% Please restart this script for Java to be available.
    pause
    exit /b 0
) else (
    for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr /i "version"') do echo %GREEN%[OK]%RESET% %%i
)

:: Check JAVA_HOME
echo %YELLOW%[CHECK]%RESET% JAVA_HOME...
if "%JAVA_HOME%"=="" (
    echo %YELLOW%[WARN]%RESET% JAVA_HOME not set. Attempting to detect...
    for /f "tokens=*" %%i in ('where java') do (
        set "JAVA_PATH=%%~dpi"
        for %%j in ("!JAVA_PATH!..") do set "JAVA_HOME=%%~fj"
    )
    if "!JAVA_HOME!"=="" (
        echo %RED%[ERROR]%RESET% Could not detect JAVA_HOME.
        echo %YELLOW%Please set JAVA_HOME environment variable manually.%RESET%
    ) else (
        echo %GREEN%[OK]%RESET% JAVA_HOME detected: !JAVA_HOME!
        setx JAVA_HOME "!JAVA_HOME!" >nul 2>&1
    )
) else (
    echo %GREEN%[OK]%RESET% JAVA_HOME: %JAVA_HOME%
)

:: Check for Android SDK
echo %YELLOW%[CHECK]%RESET% Android SDK...
set "ANDROID_HOME_FOUND=0"
if defined ANDROID_HOME (
    if exist "%ANDROID_HOME%\platform-tools" (
        set "ANDROID_HOME_FOUND=1"
        echo %GREEN%[OK]%RESET% ANDROID_HOME: %ANDROID_HOME%
    )
)
if defined ANDROID_SDK_ROOT (
    if exist "%ANDROID_SDK_ROOT%\platform-tools" (
        set "ANDROID_HOME_FOUND=1"
        set "ANDROID_HOME=%ANDROID_SDK_ROOT%"
        echo %GREEN%[OK]%RESET% ANDROID_SDK_ROOT: %ANDROID_SDK_ROOT%
    )
)
if "%ANDROID_HOME_FOUND%"=="0" (
    :: Check common locations
    set "SDK_LOCATIONS=%LOCALAPPDATA%\Android\Sdk;%USERPROFILE%\AppData\Local\Android\Sdk;C:\Android\sdk"
    for %%p in (%SDK_LOCATIONS%) do (
        if exist "%%p\platform-tools" (
            set "ANDROID_HOME=%%p"
            set "ANDROID_HOME_FOUND=1"
            echo %GREEN%[OK]%RESET% Found Android SDK: %%p
            setx ANDROID_HOME "%%p" >nul 2>&1
        )
    )
)
if "%ANDROID_HOME_FOUND%"=="0" (
    echo %YELLOW%[WARN]%RESET% Android SDK not found!
    echo.
    echo %YELLOW%Please install Android Studio from: https://developer.android.com/studio%RESET%
    echo %YELLOW%Or install command-line tools from: https://developer.android.com/studio#command-tools%RESET%
    echo.
    set /p CONTINUE_WITHOUT_SDK="Continue anyway? (Y/N): "
    if /i "!CONTINUE_WITHOUT_SDK!" neq "Y" (
        pause
        exit /b 1
    )
)

echo.

:: ============================================================================
:: Step 2: Check Mobile App Directory
:: ============================================================================

echo %CYAN%[STEP 2/8]%RESET% Checking mobile app directory...
echo.

if not exist "%MOBILE_APP%" (
    echo %RED%[ERROR]%RESET% Mobile app directory not found at: %MOBILE_APP%
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Mobile app found: %MOBILE_APP%
cd /d "%MOBILE_APP%"

echo.

:: ============================================================================
:: Step 3: Install Dependencies
:: ============================================================================

echo %CYAN%[STEP 3/8]%RESET% Installing npm dependencies...
echo.

call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERROR]%RESET% Failed to install dependencies!
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET% Dependencies installed!

echo.

:: ============================================================================
:: Step 4: Install EAS CLI
:: ============================================================================

echo %CYAN%[STEP 4/8]%RESET% Installing/Updating EAS CLI...
echo.

call npm install -g eas-cli
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%[WARN]%RESET% EAS CLI install failed. Trying with sudo/admin...
) else (
    echo %GREEN%[OK]%RESET% EAS CLI installed!
)

:: Check EAS version
where eas >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%i in ('eas --version') do echo %GREEN%[OK]%RESET% EAS CLI: %%i
)

echo.

:: ============================================================================
:: Step 5: Configure App (if needed)
:: ============================================================================

echo %CYAN%[STEP 5/8]%RESET% Checking app configuration...
echo.

:: Create app.json if it doesn't exist
if not exist "app.json" (
    echo %YELLOW%[INFO]%RESET% Creating app.json...
    (
        echo {
        echo   "expo": {
        echo     "name": "Exercise Coin",
        echo     "slug": "exercise-coin",
        echo     "version": "1.0.0",
        echo     "orientation": "portrait",
        echo     "icon": "./assets/icon.png",
        echo     "userInterfaceStyle": "automatic",
        echo     "splash": {
        echo       "image": "./assets/splash.png",
        echo       "resizeMode": "contain",
        echo       "backgroundColor": "#10b981"
        echo     },
        echo     "assetBundlePatterns": ["**/*"],
        echo     "ios": {
        echo       "supportsTablet": true,
        echo       "bundleIdentifier": "com.exercisecoin.app"
        echo     },
        echo     "android": {
        echo       "adaptiveIcon": {
        echo         "foregroundImage": "./assets/adaptive-icon.png",
        echo         "backgroundColor": "#10b981"
        echo       },
        echo       "package": "com.exercisecoin.app",
        echo       "permissions": [
        echo         "android.permission.ACTIVITY_RECOGNITION",
        echo         "android.permission.ACCESS_FINE_LOCATION",
        echo         "android.permission.ACCESS_COARSE_LOCATION",
        echo         "android.permission.CAMERA"
        echo       ]
        echo     },
        echo     "plugins": [
        echo       "expo-camera",
        echo       "expo-location",
        echo       "expo-sensors"
        echo     ],
        echo     "extra": {
        echo       "eas": {
        echo         "projectId": "exercise-coin"
        echo       }
        echo     }
        echo   }
        echo }
    ) > app.json
    echo %GREEN%[OK]%RESET% app.json created
) else (
    echo %GREEN%[OK]%RESET% app.json exists
)

:: Create eas.json if it doesn't exist
if not exist "eas.json" (
    echo %YELLOW%[INFO]%RESET% Creating eas.json...
    (
        echo {
        echo   "cli": {
        echo     "version": "^>5.0.0"
        echo   },
        echo   "build": {
        echo     "development": {
        echo       "developmentClient": true,
        echo       "distribution": "internal",
        echo       "android": {
        echo         "buildType": "apk"
        echo       }
        echo     },
        echo     "preview": {
        echo       "distribution": "internal",
        echo       "android": {
        echo         "buildType": "apk"
        echo       }
        echo     },
        echo     "production": {
        echo       "android": {
        echo         "buildType": "app-bundle"
        echo       }
        echo     }
        echo   },
        echo   "submit": {
        echo     "production": {}
        echo   }
        echo }
    ) > eas.json
    echo %GREEN%[OK]%RESET% eas.json created
) else (
    echo %GREEN%[OK]%RESET% eas.json exists
)

echo.

:: ============================================================================
:: Step 6: Select Build Type
:: ============================================================================

echo %CYAN%[STEP 6/8]%RESET% Select build type...
echo.
echo   1. Development APK (debug, fast build)
echo   2. Preview APK (release APK for testing)
echo   3. Production AAB (for Google Play Store)
echo   4. Local APK Build (no Expo account needed)
echo.

set /p BUILD_TYPE="Enter choice (1-4): "

echo.

:: ============================================================================
:: Step 7: Build
:: ============================================================================

echo %CYAN%[STEP 7/8]%RESET% Building Android app...
echo.

if "%BUILD_TYPE%"=="1" (
    echo %YELLOW%[BUILD]%RESET% Building Development APK...
    call eas build --platform android --profile development --non-interactive
) else if "%BUILD_TYPE%"=="2" (
    echo %YELLOW%[BUILD]%RESET% Building Preview APK...
    call eas build --platform android --profile preview --non-interactive
) else if "%BUILD_TYPE%"=="3" (
    echo %YELLOW%[BUILD]%RESET% Building Production AAB...
    call eas build --platform android --profile production --non-interactive
) else if "%BUILD_TYPE%"=="4" (
    echo %YELLOW%[BUILD]%RESET% Building Local APK...
    echo.
    echo %YELLOW%[INFO]%RESET% This will build locally without Expo cloud.
    echo %YELLOW%[INFO]%RESET% Requires Android SDK and Gradle.
    echo.

    :: Check if android folder exists
    if not exist "android" (
        echo %YELLOW%[INFO]%RESET% Running expo prebuild to generate android folder...
        call npx expo prebuild --platform android
    )

    cd android

    :: Build debug APK
    echo %YELLOW%[BUILD]%RESET% Running Gradle build...
    call gradlew.bat assembleRelease

    if %ERRORLEVEL% equ 0 (
        echo.
        echo %GREEN%[OK]%RESET% Build successful!
        echo %GREEN%[OK]%RESET% APK location: android\app\build\outputs\apk\release\

        :: Copy APK to project root
        set "APK_PATH=app\build\outputs\apk\release\app-release.apk"
        if exist "!APK_PATH!" (
            copy "!APK_PATH!" "..\..\ExerciseCoin.apk" >nul
            echo %GREEN%[OK]%RESET% Copied to: ExerciseCoin.apk
        )
    ) else (
        echo %RED%[ERROR]%RESET% Build failed!
    )

    cd ..
) else (
    echo %RED%[ERROR]%RESET% Invalid choice!
    pause
    exit /b 1
)

echo.

:: ============================================================================
:: Step 8: Done
:: ============================================================================

echo %CYAN%[STEP 8/8]%RESET% Build complete!
echo.

if "%BUILD_TYPE%" neq "4" (
    echo %GREEN%============================================================================%RESET%
    echo %GREEN%   BUILD SUBMITTED TO EXPO!                                                %RESET%
    echo %GREEN%============================================================================%RESET%
    echo.
    echo %CYAN%Your build has been submitted to Expo's build service.%RESET%
    echo.
    echo %YELLOW%Check build status:%RESET%
    echo   eas build:list
    echo.
    echo %YELLOW%Download when complete:%RESET%
    echo   eas build:download
    echo.
    echo %YELLOW%Or visit:%RESET% https://expo.dev
) else (
    echo %GREEN%============================================================================%RESET%
    echo %GREEN%   LOCAL BUILD COMPLETE!                                                   %RESET%
    echo %GREEN%============================================================================%RESET%
    echo.
    echo %CYAN%APK Location:%RESET%
    echo   %YELLOW%mobile-app\android\app\build\outputs\apk\release\%RESET%
    echo.
    echo %CYAN%Install on device:%RESET%
    echo   adb install ExerciseCoin.apk
)

echo.
echo Press any key to exit...
pause >nul
