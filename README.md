<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="Exercise Coin" width="150" />
</p>

<h1 align="center">🏃‍♂️ Exercise Coin 💰</h1>

<p align="center">
  <strong>Get Fit. Get Paid. Have Fun.</strong><br>
  <em>The cryptocurrency that rewards your sweat equity</em>
</p>

<p align="center">
  <a href="#-features">✨ Features</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-how-it-works">⚙️ How It Works</a> •
  <a href="#-treasure-system">🗺️ Treasure</a> •
  <a href="#-social-features">👥 Social</a> •
  <a href="#-exchange">💱 Exchange</a> •
  <a href="#-documentation">📚 Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/iOS-Swift%20%7C%20SwiftUI-orange?style=for-the-badge&logo=swift" alt="iOS" />
  <img src="https://img.shields.io/badge/Android-Kotlin%20%7C%20Compose-green?style=for-the-badge&logo=android" alt="Android" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge" alt="Node Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square" alt="Made with Love" />
  <img src="https://img.shields.io/badge/Powered%20by-☕-brown?style=flat-square" alt="Powered by Coffee" />
</p>

---

## 🌟 Overview

**Exercise Coin** transforms your daily physical activity into real cryptocurrency rewards! Using your smartphone's pedometer, we track your exercise sessions, validate they're legitimate through advanced anti-cheat algorithms, and reward you with **EXC coins** mined on your personal blockchain node.

> 💡 *Walk the dog? Earn coins. Morning jog? Earn coins. Hiking with friends? Earn BONUS coins!*

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  📱 Mobile  │────▶│  🖥️ Server │────▶│  ⛏️ Coin   │────▶│  💳 Wallet │
│     App     │     │  Validates  │     │   Daemon    │     │   Payout   │
│ Track Steps │     │  Exercise   │     │   Mining    │     │            │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📱 Native Mobile Apps
| Feature | Description |
|---------|-------------|
| 👟 **Step Tracking** | Native pedometer (CMPedometer / SensorManager) |
| 📊 **Live Stats** | Real-time progress with background tracking |
| 💰 **Wallet** | View balance & transaction history |
| 🏆 **Achievements** | Unlock badges & milestones |
| 📍 **Treasure Map** | MapKit (iOS) / Google Maps (Android) |
| 🤝 **Send Coins** | QR codes via AVFoundation / CameraX |

</td>
<td width="50%" valign="top">

### 🖥️ Backend Services
| Feature | Description |
|---------|-------------|
| 🔐 **JWT Auth** | Secure authentication system |
| 🛡️ **Anti-Cheat** | Advanced fraud detection |
| ⛏️ **Per-User Mining** | Individual daemon processes |
| 🗄️ **MongoDB** | Scalable data persistence |
| 🚦 **Rate Limiting** | DDoS protection |
| 👑 **Admin Portal** | Full monitoring dashboard |

</td>
</tr>
</table>

---

## 📱 Native Mobile Apps

Exercise Coin features fully native mobile apps built with modern technologies for optimal performance and user experience.

### Platform Comparison

| Feature | iOS (Swift/SwiftUI) | Android (Kotlin/Compose) |
|---------|---------------------|--------------------------|
| **Step Counting** | CMPedometer (CoreMotion) | SensorManager + ForegroundService |
| **Secure Storage** | Keychain Services | EncryptedSharedPreferences |
| **Maps** | MapKit | Google Maps Compose |
| **QR Scanning** | AVFoundation | CameraX + ML Kit |
| **QR Generation** | CoreImage | ZXing |
| **Location** | CLLocationManager | FusedLocationProviderClient |
| **Background Tracking** | Background Modes | Foreground Service |

### iOS App Architecture

```
ExerciseCoin-iOS/
├── App/                    # App entry point, ContentView
├── Core/
│   ├── Network/           # URLSession-based API client
│   ├── Storage/           # Keychain for JWT tokens
│   └── Services/          # CMPedometer, CLLocationManager
├── Features/              # SwiftUI views + ViewModels
│   ├── Auth/              # Login, Register
│   ├── Home/              # Dashboard
│   ├── Exercise/          # Step tracking sessions
│   ├── Wallet/            # Balance, transactions
│   ├── TreasureMap/       # MapKit integration
│   ├── SendReceive/       # QR codes, transfers
│   ├── Achievements/      # Progress tracking
│   └── Profile/           # Settings, leaderboard
├── Navigation/            # Tab-based navigation
└── SharedUI/              # Theme, reusable components
```

### Android App Architecture

```
ExerciseCoin-Android/
├── core/
│   ├── network/           # Retrofit + OkHttp
│   ├── storage/           # EncryptedSharedPreferences
│   └── services/          # ForegroundService for steps
├── di/                    # Hilt dependency injection
├── features/              # Compose screens + ViewModels
│   ├── auth/              # Login, Register
│   ├── home/              # Dashboard
│   ├── exercise/          # Step tracking sessions
│   ├── wallet/            # Balance, transactions
│   ├── treasure/          # Google Maps integration
│   ├── transfer/          # QR codes, P2P
│   ├── achievements/      # Progress tracking
│   └── profile/           # Settings, leaderboard
├── navigation/            # Compose Navigation
└── ui/                    # Material 3 theme, components
```

### Required Permissions

**iOS (Info.plist):**
- `NSMotionUsageDescription` - Step counting
- `NSLocationWhenInUseUsageDescription` - Treasure map
- `NSCameraUsageDescription` - QR scanning

**Android (AndroidManifest.xml):**
- `ACTIVITY_RECOGNITION` - Step counting
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_HEALTH` - Background tracking
- `ACCESS_FINE_LOCATION` - Treasure map
- `CAMERA` - QR scanning

---

## 🗺️ Treasure System

Discover a whole new way to earn and share coins!

### 🎁 Geo-Drops
Drop coins at real-world locations for others to discover!

```
📍 You're at a beautiful hiking spot
    ↓
💎 Drop some coins as a gift
    ↓
🗺️ Others see it on their treasure map
    ↓
🏃 They hike to that location
    ↓
🎉 They collect your treasure!
```

### 🎲 Random Drops - Tiered System!
Every **Sunday**, our **Random Drop Daemon** creates treasure drops with a chance for HUGE rewards!

| Tier | Chance | Reward Range | Message |
|------|--------|--------------|---------|
| 🥉 **Common** | 55% | 5-25 EXC | "Nice find! Keep moving!" |
| 🥈 **Rare** | 25% | 30-77 EXC | "Great discovery!" |
| 🥇 **Epic** | 12% | 100-300 EXC | "WOW! Epic treasure!" |
| 💎 **LEGENDARY** | 8% | 500-1,000 EXC | "JACKPOT! LEGENDARY FIND!" |

Drops are scattered at exercise-friendly locations:
- 🥾 Hiking trails
- 🏞️ Parks & nature reserves
- 🚶 Walking paths
- ⛰️ Popular outdoor spots

### 🎯 Admin Drop Zones
Administrators can configure focus areas for drops using:
- 📮 **Zipcode targeting** - Enter a zipcode to focus drops
- 📍 **Point + Radius** - Click a location and set distance
- 🔷 **Draw Areas** - Draw custom polygons on a map

---

## 👥 Social Features

### 💸 Send Coins to Friends
Transfer coins instantly using multiple methods:

| Method | Use Case |
|--------|----------|
| 👤 **By Username** | Send to anyone on the platform |
| 📱 **QR Code** | Generate a code for in-person transfers |
| 📷 **Scan to Receive** | Scan someone's QR to claim coins |

### 🤗 Friendliness Miner

> *"Perfect for in-person transfers at the top of a hike!"*

When you trade coins with another user and **BOTH** of you are actively exercising, you become eligible for the **Friendliness Bonus**!

```
🏃 You're hiking with a friend
    ↓
📱 You both have the app tracking
    ↓
💸 You send them some coins
    ↓
✨ Both miners are engaged!
    ↓
🎰 Weekly lottery for bonus coins!
```

**How it works:**
- 📅 Runs every **Saturday**
- ⏱️ Mines for ~30 minutes worth of coins
- 🎲 **35% chance** of bonus per eligible transfer
- 💝 Both sender AND receiver get the bonus!
- 🎰 Multipliers based on transfer amounts (up to 3x!)

### 🍔 Rest Stop Bonus

When you're exercising with a friend and stop for a break together, you both earn bonus coins!

```
🏃 You and a friend are hiking
    ↓
🍕 You stop at a restaurant together
    ↓
📍 App detects you're at the same venue
    ↓
🎉 "Cheers guys!" Both earn 5-25 EXC!
```

**Venue Multipliers - Healthy Choices Win!**
| Venue Type | Multiplier | Message |
|------------|------------|---------|
| 🥗 **Health Food** | 3.0x | "AMAZING CHOICE! Maximum bonus!" |
| 🧃 **Juice Bar** | 2.8x | "Smart! Fresh juice = Fresh gains!" |
| 🥬 **Salad Bar** | 2.5x | "Salad over burger = HUGE bonus!" |
| 🫒 **Mediterranean** | 1.8x | "Heart-healthy choice!" |
| ☕ **Cafe** | 1.5x | "Hydration bonus!" |
| 🍺 **Brewery** | 1.0x | "You earned... a little bonus" |
| 🍕 **Pizza** | 0.8x | "Small bonus... try veggies next!" |
| 🍔 **Fast Food** | 0.5x | "Tiny bonus. Salad next time?" |
| 🍗 **Fried Chicken** | 0.4x | "Very small! Grilled = 5X more!" |

---

## 💱 Exchange

Trade your hard-earned EXC for real cryptocurrencies and fiat!

### Supported Currencies

The exchange supports multiple trading pairs, all managed by administrators:

| Type | Currencies |
|------|------------|
| 🪙 **Crypto** | BTC, ETH, LTC, USDT, DOGE |
| 💵 **Fiat** | USD, EUR (via bank transfer) |

### How It Works

```
🏃 Earn EXC through exercise
    ↓
💱 Visit the exchange
    ↓
📊 View current rates
    ↓
💸 Place buy or sell order
    ↓
✅ Admin processes your trade
    ↓
💰 Receive your currency!
```

### Features

| Feature | Description |
|---------|-------------|
| 📊 **Real-time Rates** | Admin-updated exchange rates |
| 🔒 **Secure Orders** | Escrow system for sell orders |
| 📋 **Order Tracking** | Full order history & status |
| 💰 **Low Fees** | Only 1% trading fee |

### Admin Portal

Administrators manage the exchange via a dedicated portal:
- 👛 Configure wallet addresses for each currency
- 📈 Set and update exchange rates
- 📋 Process buy/sell orders
- 📊 Monitor trading activity

---

## 🏆 Achievements System

Unlock achievements as you exercise your way to fitness!

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🐣 **First Steps** | Complete your first session | Badge |
| 📅 **Week Warrior** | 7-day exercise streak | Badge + Bonus |
| 💯 **Century Club** | Reach 100 sessions | Badge + Bonus |
| 🏃 **Marathon Master** | Walk 42.195 km total | Badge + Bonus |
| 💎 **Treasure Hunter** | Collect 10 treasures | Badge |
| 🤝 **Social Butterfly** | Send 50 transfers | Badge |
| ⛰️ **Early Bird** | Exercise before 7 AM | Badge |
| 🌙 **Night Owl** | Exercise after 10 PM | Badge |

---

## 🛡️ Anti-Cheat Protection

Our advanced detection system prevents gaming the system:

| Detection | What We Catch |
|-----------|---------------|
| 🔧 **Mechanical Devices** | Paint mixers, phone shakers |
| 🤖 **Robotic Patterns** | Too-perfect periodic motion |
| 🚀 **Impossible Speeds** | Superhuman step rates (>10/sec) |
| 📈 **Sudden Spikes** | Impossible acceleration changes |
| 🔄 **Identical Readings** | Suspiciously constant values |

---

## ⚙️ How It Works

<table>
<tr>
<td align="center" width="25%">
<h3>1️⃣</h3>
<h4>📱 Track</h4>
<p>Mobile app monitors your steps via device sensors</p>
</td>
<td align="center" width="25%">
<h3>2️⃣</h3>
<h4>✅ Validate</h4>
<p>Server analyzes patterns for 60+ seconds of sustained activity</p>
</td>
<td align="center" width="25%">
<h3>3️⃣</h3>
<h4>⛏️ Mine</h4>
<p>Your personal daemon mines proportional to exercise time</p>
</td>
<td align="center" width="25%">
<h3>4️⃣</h3>
<h4>💰 Earn</h4>
<p>Mined coins are credited to your wallet!</p>
</td>
</tr>
</table>

---

## 🚀 Quick Start

### 🐳 Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f server
```

### 🔧 Manual Installation

<details>
<summary><strong>🖥️ Server Setup</strong></summary>

```bash
cd server
cp .env.example .env
# Configure your environment variables
npm install
npm run dev
```

</details>

<details>
<summary><strong>🍎 iOS App Setup</strong></summary>

```bash
cd ExerciseCoin-iOS

# Install dependencies
bundle install

# Open in Xcode
open ExerciseCoin.xcodeproj

# Build and run
# - Select target device/simulator
# - Press Cmd+R to build and run
```

**Requirements:**
- Xcode 15+
- iOS 17.0+ deployment target
- CocoaPods or Swift Package Manager

</details>

<details>
<summary><strong>🤖 Android App Setup</strong></summary>

```bash
cd ExerciseCoin-Android

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Or open in Android Studio
# - File > Open > Select ExerciseCoin-Android folder
```

**Requirements:**
- Android Studio Hedgehog+
- JDK 17
- Android SDK 34
- Min SDK 26 (Android 8.0)

</details>

<details>
<summary><strong>📱 React Native App (Deprecated)</strong></summary>

```bash
cd mobile-app
npm install
npm start
# Scan QR code with Expo Go app
```

> ⚠️ The React Native app is deprecated. Use the native iOS/Android apps instead.

</details>

<details>
<summary><strong>⛏️ Coin Daemon Setup</strong></summary>

```bash
# Build from F7CoinV4 source
git clone https://github.com/sp00nznet/F7CoinV4.git
cd F7CoinV4

# Generate unique genesis block
cd ../coin-daemon/scripts
./generate-genesis.sh
```

</details>

<details>
<summary><strong>👑 Admin Portal Setup</strong></summary>

```bash
cd admin-portal
npm install
npm run dev
# Access at http://localhost:3001
```

</details>

---

## 🌐 Network Parameters

Exercise Coin uses unique network parameters based on F7CoinV4:

| Parameter | 🌍 Mainnet | 🧪 Testnet |
|-----------|:----------:|:----------:|
| P2P Port | `39339` | `39340` |
| RPC Port | `39338` | `39341` |
| Address Prefix | `E` | `m` |
| Bech32 Prefix | `exc` | `texc` |

### 🎰 Tokenomics

| Parameter | Value |
|-----------|-------|
| 💰 **Block Reward** | 77 EXC |
| ⏱️ **Block Time** | 30 seconds |
| 📊 **Total Supply** | 200,000,000 EXC |
| 📉 **Halving** | Every 840,000 blocks (~292 days) |
| ⚡ **Algorithm** | Scrypt |

**Mining Rewards:**
- 30 min exercise = 15 min mining = ~77 EXC (one full block!)
- ~5.13 EXC per minute of mining time

---

## 📁 Project Structure

```
exercise-coin/
│
├── 🍎 ExerciseCoin-iOS/     # Native iOS app (Swift/SwiftUI)
│   └── ExerciseCoin/
│       ├── App/             # App entry, ContentView
│       ├── Core/
│       │   ├── Network/     # APIClient, Endpoints
│       │   ├── Storage/     # KeychainManager
│       │   └── Services/    # StepCountingService, LocationService
│       ├── Features/        # Auth, Home, Exercise, Wallet, etc.
│       ├── Navigation/      # MainTabView, routing
│       └── SharedUI/        # Theme, reusable components
│
├── 🤖 ExerciseCoin-Android/ # Native Android app (Kotlin/Compose)
│   └── app/src/main/java/com/exercisecoin/
│       ├── core/
│       │   ├── network/     # Retrofit, AuthInterceptor
│       │   ├── storage/     # EncryptedSharedPreferences
│       │   └── services/    # StepCountingService (Foreground)
│       ├── di/              # Hilt modules
│       ├── features/        # auth, home, exercise, wallet, etc.
│       ├── navigation/      # Compose Navigation
│       └── ui/              # Theme, components
│
├── 📋 shared/               # Shared assets & specifications
│   ├── api-spec.yaml        # OpenAPI 3.0 specification
│   └── design-tokens.json   # Design system (colors, spacing, typography)
│
├── 📱 mobile-app/           # React Native (Expo) - DEPRECATED
│   └── src/
│       ├── screens/         # App screens
│       ├── hooks/           # Custom React hooks
│       ├── stores/          # Zustand state management
│       └── services/        # API client
│
├── 🖥️ server/               # Node.js Express backend
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── models/          # MongoDB schemas
│       ├── services/        # Business logic & daemons
│       ├── routes/          # API routes
│       ├── config/          # Tokenomics & settings
│       └── middleware/      # Auth, validation
│
├── 👑 admin-portal/         # React admin dashboard
│   └── src/
│       ├── pages/           # Dashboard pages
│       ├── components/      # Reusable components
│       └── services/        # Admin API client
│
├── 💱 exchange/             # Exchange trading platform
│   └── src/
│       ├── pages/           # Trading & admin pages
│       ├── components/      # UI components
│       ├── context/         # Auth context
│       └── services/        # Exchange API client
│
├── ⛏️ coin-daemon/          # Cryptocurrency daemon
│   ├── config/              # Configuration files
│   └── scripts/             # Management scripts
│
└── 📚 docs/                 # Documentation
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📖 [Getting Started](docs/getting-started.md) | Complete setup guide |
| 🔌 [API Reference](docs/api-reference.md) | Full API documentation |
| 📋 [API Specification](shared/api-spec.yaml) | OpenAPI 3.0 spec |
| 🎨 [Design Tokens](shared/design-tokens.json) | Shared design system |
| 🏗️ [Architecture](docs/architecture.md) | System design overview |
| 🍎 [iOS Development](ExerciseCoin-iOS/README.md) | iOS app guide |
| 🤖 [Android Development](ExerciseCoin-Android/README.md) | Android app guide |
| ⛏️ [Coin Daemon](docs/coin-daemon.md) | Blockchain setup & config |
| 🚀 [Deployment](docs/deployment.md) | Production deployment |
| 🗺️ [Treasure System](docs/treasure-system.md) | Geo-drops & treasure hunting |
| 💸 [Transfers](docs/transfers.md) | User-to-user transfers |
| 🏆 [Achievements](docs/achievements.md) | Achievement system guide |
| 👑 [Admin Portal](docs/admin-portal.md) | Admin dashboard guide |
| 🤗 [Friendliness Miner](docs/friendliness-miner.md) | Social mining bonus |
| 💱 [Exchange](docs/exchange.md) | Trading platform guide |
| 🍔 [Rest Stop Bonus](docs/rest-stop-bonus.md) | Break time bonuses |
| 🎰 [Tokenomics](docs/tokenomics.md) | Economic system details |

## 🔄 CI/CD Pipeline

The project uses GitLab CI/CD with Fastlane for automated builds and deployments.

### iOS Pipeline

| Job | Stage | Description |
|-----|-------|-------------|
| `ios:lint` | lint | SwiftLint code analysis |
| `ios:test` | test | XCTest unit tests |
| `ios:build:debug` | build | Development build |
| `ios:build:release` | build | App Store build (.ipa) |
| `ios:deploy:testflight` | deploy | TestFlight distribution |
| `ios:deploy:appstore` | deploy | App Store submission |

### Android Pipeline

| Job | Stage | Description |
|-----|-------|-------------|
| `android:lint` | lint | ktlint + detekt |
| `android:test` | test | JUnit unit tests |
| `android:build:debug` | build | Debug APK |
| `android:build:release` | build | Signed AAB |
| `android:deploy:internal` | deploy | Play Store internal track |
| `android:deploy:production` | deploy | Play Store production |

### Required CI Variables

**iOS:**
- `MATCH_PASSWORD` - Certificate encryption
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT` - App Store Connect API

**Android:**
- `ANDROID_KEYSTORE_BASE64` - Signing keystore
- `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` - Keystore credentials
- `PLAY_STORE_JSON_KEY` - Service account for Play Store

---

## ⚙️ Configuration

```env
# 🖥️ Server
PORT=3000
MONGODB_URI=mongodb://localhost:27017/exercise-coin
JWT_SECRET=your-secret-key

# ⛏️ Coin Daemon
COIN_DAEMON_HOST=localhost
COIN_DAEMON_PORT=39338

# 🏃 Exercise Detection
MIN_EXERCISE_DURATION_SECONDS=60
MINING_SECONDS_PER_EXERCISE_SECOND=0.5

# 🗺️ Treasure System
TREASURE_COLLECTION_RADIUS_METERS=100
TREASURE_DEFAULT_EXPIRY_DAYS=7

# 🤗 Friendliness Bonus
FRIENDLINESS_BONUS_CHANCE=0.3
FRIENDLINESS_MIN_BONUS=0.1
FRIENDLINESS_MAX_BONUS=1.0
```

---

## 📋 Exercise Requirements

To earn rewards, your exercise must meet these criteria:

| Requirement | Value | Why |
|-------------|-------|-----|
| ⏱️ **Min Duration** | 60 consecutive seconds | Ensures real activity |
| 👟 **Step Rate** | 1-5 steps per second | Human walking/running range |
| 📊 **Pattern Variance** | Natural variance required | Catches mechanical devices |
| 🚫 **Suspicious Patterns** | None detected | Anti-cheat validation |

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="20%">
<strong>🍎 iOS</strong><br>
Swift 5.9<br>
SwiftUI<br>
CoreMotion<br>
MapKit
</td>
<td align="center" width="20%">
<strong>🤖 Android</strong><br>
Kotlin 1.9<br>
Jetpack Compose<br>
Hilt DI<br>
Google Maps
</td>
<td align="center" width="20%">
<strong>🖥️ Backend</strong><br>
Node.js<br>
Express<br>
MongoDB
</td>
<td align="center" width="20%">
<strong>⛏️ Blockchain</strong><br>
F7CoinV4 Fork<br>
Bitcoin Core<br>
Custom Genesis
</td>
<td align="center" width="20%">
<strong>🐳 Infrastructure</strong><br>
Docker<br>
GitLab CI/CD<br>
Fastlane
</td>
</tr>
</table>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m 'Add amazing feature'

# 4. Push to the branch
git push origin feature/amazing-feature

# 5. Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>🏃‍♂️ Start exercising. Start earning. 💰</strong>
</p>

<p align="center">
  <sub>Built with 💪 sweat and ☕ code</sub>
</p>

<p align="center">
  <a href="#-exercise-coin-">⬆️ Back to Top</a>
</p>
