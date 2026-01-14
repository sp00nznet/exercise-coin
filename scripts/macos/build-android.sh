#!/bin/bash

# ============================================================================
# Exercise Coin - macOS Android Build Script
# Build APK or AAB on macOS
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_APP="$PROJECT_ROOT/mobile-app"

echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}      Exercise Coin - Android Build (macOS)                               ${NC}"
echo -e "${CYAN}      Build APK or AAB                                                    ${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

cd "$PROJECT_ROOT"

# ============================================================================
# Check Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 1/5]${NC} Checking dependencies..."
echo ""

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Node.js..."
    brew install node
fi
echo -e "${GREEN}[OK]${NC} Node.js: $(node --version)"

# Java
echo -e "${YELLOW}[CHECK]${NC} Java..."
if ! command -v java &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Java JDK..."
    brew install openjdk@17
    echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
fi
java -version 2>&1 | head -n 1
echo -e "${GREEN}[OK]${NC} Java installed"

# Android SDK
echo -e "${YELLOW}[CHECK]${NC} Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    # Check common locations
    for SDK_PATH in "$HOME/Library/Android/sdk" "/usr/local/share/android-sdk" "$HOME/Android/Sdk"; do
        if [ -d "$SDK_PATH" ]; then
            export ANDROID_HOME="$SDK_PATH"
            echo "export ANDROID_HOME=\"$SDK_PATH\"" >> ~/.zshrc
            break
        fi
    done
fi

if [ -z "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}[WARN]${NC} Android SDK not found!"
    echo ""
    echo "Options:"
    echo "  1. Install Android Studio from: https://developer.android.com/studio"
    echo "  2. Install via Homebrew:"
    echo "     brew install --cask android-studio"
    echo "     brew install --cask android-sdk"
    echo ""
    read -p "Continue with EAS cloud build? (Y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}[OK]${NC} ANDROID_HOME: $ANDROID_HOME"
fi

echo ""

# ============================================================================
# Install Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 2/5]${NC} Installing dependencies..."
echo ""

cd "$MOBILE_APP"
npm install
echo -e "${GREEN}[OK]${NC} Dependencies installed"

echo ""

# ============================================================================
# Install EAS CLI
# ============================================================================

echo -e "${CYAN}[STEP 3/5]${NC} Installing EAS CLI..."
echo ""

npm install -g eas-cli 2>/dev/null || sudo npm install -g eas-cli
echo -e "${GREEN}[OK]${NC} EAS CLI ready"

echo ""

# ============================================================================
# Select Build Type
# ============================================================================

echo -e "${CYAN}[STEP 4/5]${NC} Select build type..."
echo ""
echo "  1. Development APK (debug)"
echo "  2. Preview APK (release)"
echo "  3. Production AAB (Google Play)"
echo "  4. Local APK Build (no Expo account)"
echo ""

read -p "Enter choice (1-4): " BUILD_TYPE
echo ""

# ============================================================================
# Build
# ============================================================================

echo -e "${CYAN}[STEP 5/5]${NC} Building..."
echo ""

case $BUILD_TYPE in
    1)
        eas build --platform android --profile development --non-interactive
        ;;
    2)
        eas build --platform android --profile preview --non-interactive
        ;;
    3)
        eas build --platform android --profile production --non-interactive
        ;;
    4)
        echo -e "${YELLOW}[BUILD]${NC} Local build..."

        # Generate android folder
        if [ ! -d "android" ]; then
            npx expo prebuild --platform android --clean
        fi

        cd android

        # Build
        if [ -n "$ANDROID_HOME" ]; then
            ./gradlew assembleRelease || ./gradlew assembleDebug

            # Find APK
            APK=$(find . -name "*.apk" -path "*/outputs/*" | head -n 1)
            if [ -n "$APK" ]; then
                cp "$APK" "$PROJECT_ROOT/ExerciseCoin.apk"
                echo ""
                echo -e "${GREEN}[OK]${NC} APK created: $PROJECT_ROOT/ExerciseCoin.apk"
            fi
        else
            echo -e "${RED}[ERROR]${NC} ANDROID_HOME not set. Cannot build locally."
            exit 1
        fi

        cd ..
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""
