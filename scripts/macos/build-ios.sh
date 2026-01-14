#!/bin/bash

# ============================================================================
# Exercise Coin - macOS iOS Build Script
# One-click iOS IPA build for App Store or TestFlight
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_APP="$PROJECT_ROOT/mobile-app"

echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}      Exercise Coin - iOS Build Script                                     ${NC}"
echo -e "${CYAN}      Build IPA for TestFlight or App Store                               ${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

cd "$PROJECT_ROOT"
echo -e "${YELLOW}[INFO]${NC} Project root: $PROJECT_ROOT"
echo ""

# ============================================================================
# Step 1: Check macOS
# ============================================================================

echo -e "${CYAN}[STEP 1/9]${NC} Checking platform..."
echo ""

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}[ERROR]${NC} This script requires macOS!"
    echo -e "${YELLOW}iOS builds can only be done on macOS with Xcode.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Running on macOS"

# Get macOS version
SW_VERS=$(sw_vers -productVersion)
echo -e "${GREEN}[OK]${NC} macOS version: $SW_VERS"

echo ""

# ============================================================================
# Step 2: Check Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 2/9]${NC} Checking dependencies..."
echo ""

# Check for Xcode
echo -e "${YELLOW}[CHECK]${NC} Xcode..."
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Xcode not found!"
    echo ""
    echo -e "${YELLOW}Please install Xcode from the Mac App Store:${NC}"
    echo "  https://apps.apple.com/app/xcode/id497799835"
    echo ""
    echo -e "${YELLOW}After installing, run:${NC}"
    echo "  sudo xcode-select --install"
    echo "  sudo xcodebuild -license accept"
    exit 1
fi
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo -e "${GREEN}[OK]${NC} $XCODE_VERSION"

# Check for Xcode Command Line Tools
echo -e "${YELLOW}[CHECK]${NC} Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Xcode Command Line Tools..."
    xcode-select --install
    echo -e "${YELLOW}[INFO]${NC} Please complete the installation and re-run this script."
    exit 0
fi
echo -e "${GREEN}[OK]${NC} Xcode Command Line Tools installed"

# Check for Homebrew
echo -e "${YELLOW}[CHECK]${NC} Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo -e "${GREEN}[OK]${NC} Homebrew installed"
else
    BREW_VERSION=$(brew --version | head -n 1)
    echo -e "${GREEN}[OK]${NC} $BREW_VERSION"
fi

# Check for Node.js
echo -e "${YELLOW}[CHECK]${NC} Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Node.js via Homebrew..."
    brew install node
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}[OK]${NC} Node.js: $NODE_VERSION"

# Check for npm
echo -e "${YELLOW}[CHECK]${NC} npm..."
NPM_VERSION=$(npm --version)
echo -e "${GREEN}[OK]${NC} npm: $NPM_VERSION"

# Check for CocoaPods
echo -e "${YELLOW}[CHECK]${NC} CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing CocoaPods..."
    sudo gem install cocoapods
fi
POD_VERSION=$(pod --version)
echo -e "${GREEN}[OK]${NC} CocoaPods: $POD_VERSION"

# Check for Fastlane (optional but recommended)
echo -e "${YELLOW}[CHECK]${NC} Fastlane..."
if ! command -v fastlane &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Fastlane not found. Installing..."
    brew install fastlane
fi
if command -v fastlane &> /dev/null; then
    FASTLANE_VERSION=$(fastlane --version | head -n 1)
    echo -e "${GREEN}[OK]${NC} Fastlane: $FASTLANE_VERSION"
fi

echo ""

# ============================================================================
# Step 3: Check Mobile App Directory
# ============================================================================

echo -e "${CYAN}[STEP 3/9]${NC} Checking mobile app directory..."
echo ""

if [ ! -d "$MOBILE_APP" ]; then
    echo -e "${RED}[ERROR]${NC} Mobile app directory not found at: $MOBILE_APP"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Mobile app found: $MOBILE_APP"
cd "$MOBILE_APP"

echo ""

# ============================================================================
# Step 4: Install Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 4/9]${NC} Installing npm dependencies..."
echo ""

npm install
echo -e "${GREEN}[OK]${NC} Dependencies installed!"

echo ""

# ============================================================================
# Step 5: Install EAS CLI
# ============================================================================

echo -e "${CYAN}[STEP 5/9]${NC} Installing/Updating EAS CLI..."
echo ""

npm install -g eas-cli 2>/dev/null || sudo npm install -g eas-cli
echo -e "${GREEN}[OK]${NC} EAS CLI: $(eas --version 2>/dev/null || echo 'installed')"

echo ""

# ============================================================================
# Step 6: Configure App
# ============================================================================

echo -e "${CYAN}[STEP 6/9]${NC} Checking app configuration..."
echo ""

# Create app.json if it doesn't exist
if [ ! -f "app.json" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating app.json..."
    cat > app.json << 'EOF'
{
  "expo": {
    "name": "Exercise Coin",
    "slug": "exercise-coin",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10b981"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.exercisecoin.app",
      "infoPlist": {
        "NSMotionUsageDescription": "Exercise Coin needs motion access to track your steps and exercise activity.",
        "NSLocationWhenInUseUsageDescription": "Exercise Coin needs location access to find treasure drops near you.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Exercise Coin tracks your location during exercise sessions.",
        "NSCameraUsageDescription": "Exercise Coin needs camera access to scan QR codes for coin transfers."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10b981"
      },
      "package": "com.exercisecoin.app",
      "permissions": [
        "android.permission.ACTIVITY_RECOGNITION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA"
      ]
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-sensors"
    ],
    "extra": {
      "eas": {
        "projectId": "exercise-coin"
      }
    }
  }
}
EOF
    echo -e "${GREEN}[OK]${NC} app.json created"
else
    echo -e "${GREEN}[OK]${NC} app.json exists"
fi

# Create eas.json if it doesn't exist
if [ ! -f "eas.json" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating eas.json..."
    cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
EOF
    echo -e "${GREEN}[OK]${NC} eas.json created"
else
    echo -e "${GREEN}[OK]${NC} eas.json exists"
fi

echo ""

# ============================================================================
# Step 7: Apple Developer Account Check
# ============================================================================

echo -e "${CYAN}[STEP 7/9]${NC} Apple Developer Account..."
echo ""
echo -e "${YELLOW}To build for iOS, you need an Apple Developer account.${NC}"
echo ""
echo "Options:"
echo "  1. Development build (Simulator) - No account needed"
echo "  2. Ad-hoc build (TestFlight) - Requires Apple Developer account"
echo "  3. Production build (App Store) - Requires Apple Developer account"
echo "  4. Local build (Xcode) - For development/testing"
echo ""

read -p "Enter choice (1-4): " BUILD_TYPE
echo ""

# ============================================================================
# Step 8: Build
# ============================================================================

echo -e "${CYAN}[STEP 8/9]${NC} Building iOS app..."
echo ""

case $BUILD_TYPE in
    1)
        echo -e "${YELLOW}[BUILD]${NC} Building for iOS Simulator..."
        eas build --platform ios --profile development --non-interactive
        ;;
    2)
        echo -e "${YELLOW}[BUILD]${NC} Building Ad-hoc IPA for TestFlight..."
        echo ""
        echo -e "${YELLOW}[INFO]${NC} You'll need to log in to your Apple Developer account."
        eas build --platform ios --profile preview --non-interactive
        ;;
    3)
        echo -e "${YELLOW}[BUILD]${NC} Building Production IPA for App Store..."
        echo ""
        echo -e "${YELLOW}[INFO]${NC} You'll need to log in to your Apple Developer account."
        eas build --platform ios --profile production --non-interactive
        ;;
    4)
        echo -e "${YELLOW}[BUILD]${NC} Building locally with Xcode..."
        echo ""

        # Generate iOS folder if needed
        if [ ! -d "ios" ]; then
            echo -e "${YELLOW}[INFO]${NC} Running expo prebuild to generate iOS folder..."
            npx expo prebuild --platform ios
        fi

        cd ios

        # Install CocoaPods dependencies
        echo -e "${YELLOW}[INFO]${NC} Installing CocoaPods dependencies..."
        pod install

        # Build with xcodebuild
        echo -e "${YELLOW}[BUILD]${NC} Building with xcodebuild..."

        # Find the workspace
        WORKSPACE=$(find . -name "*.xcworkspace" -maxdepth 1 | head -n 1)
        if [ -z "$WORKSPACE" ]; then
            echo -e "${RED}[ERROR]${NC} No Xcode workspace found!"
            exit 1
        fi

        # Get scheme name
        SCHEME=$(xcodebuild -list -workspace "$WORKSPACE" 2>/dev/null | grep -A 100 "Schemes:" | grep -v "Schemes:" | head -n 1 | xargs)

        echo -e "${YELLOW}[INFO]${NC} Workspace: $WORKSPACE"
        echo -e "${YELLOW}[INFO]${NC} Scheme: $SCHEME"
        echo ""

        # Build for simulator (no signing required)
        echo -e "${YELLOW}[BUILD]${NC} Building for simulator..."
        xcodebuild \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Release \
            -sdk iphonesimulator \
            -destination 'generic/platform=iOS Simulator' \
            clean build \
            | xcpretty || xcodebuild \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Release \
            -sdk iphonesimulator \
            -destination 'generic/platform=iOS Simulator' \
            clean build

        echo ""
        echo -e "${GREEN}[OK]${NC} Simulator build complete!"
        echo ""
        echo -e "${CYAN}To build a signed IPA for device:${NC}"
        echo "  1. Open $WORKSPACE in Xcode"
        echo "  2. Select your team in Signing & Capabilities"
        echo "  3. Archive from Product > Archive"
        echo "  4. Export IPA from Organizer"

        cd ..
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Invalid choice!"
        exit 1
        ;;
esac

echo ""

# ============================================================================
# Step 9: Done
# ============================================================================

echo -e "${CYAN}[STEP 9/9]${NC} Build complete!"
echo ""

if [ "$BUILD_TYPE" != "4" ]; then
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}   BUILD SUBMITTED TO EXPO!                                                ${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo -e "${CYAN}Your build has been submitted to Expo's build service.${NC}"
    echo ""
    echo -e "${YELLOW}Check build status:${NC}"
    echo "  eas build:list"
    echo ""
    echo -e "${YELLOW}Download when complete:${NC}"
    echo "  eas build:download"
    echo ""
    echo -e "${YELLOW}Submit to App Store:${NC}"
    echo "  eas submit --platform ios"
    echo ""
    echo -e "${YELLOW}Or visit:${NC} https://expo.dev"
else
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}   LOCAL BUILD COMPLETE!                                                   ${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo -e "${CYAN}To install on simulator:${NC}"
    echo "  1. Open Simulator app"
    echo "  2. Drag and drop the .app file"
    echo ""
    echo -e "${CYAN}To build for device:${NC}"
    echo "  Open mobile-app/ios/*.xcworkspace in Xcode"
fi

echo ""
echo "Press Enter to exit..."
read
