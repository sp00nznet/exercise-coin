# Exercise Coin

Get rewarded with cryptocurrency for exercising. Track your steps, earn Exercise Coin.

## Overview

Exercise Coin is a multipart fitness application that rewards users with cryptocurrency for physical activity. The system tracks exercise through a mobile app, validates the activity through a middleware server, and triggers cryptocurrency mining based on verified exercise.

### How It Works

```
Walking → Mobile App → Server Validation → Coin Mining → Reward Payout
```

1. **Track**: Mobile app monitors your steps and exercise activity
2. **Validate**: Server analyzes exercise patterns to ensure legitimate activity (60+ seconds sustained exercise)
3. **Mine**: Valid exercise triggers your personal coin daemon to mine for a duration proportional to exercise time
4. **Earn**: Any coins mined during your exercise window are credited to your wallet

## Architecture

```
├── mobile-app/          # React Native iOS/Android app
│   ├── src/
│   │   ├── screens/     # App screens (Home, Exercise, Wallet, Profile)
│   │   ├── hooks/       # Step counter and custom hooks
│   │   ├── stores/      # Zustand state management
│   │   └── services/    # API client
│
├── server/              # Node.js Express middleware
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # MongoDB schemas (User, ExerciseSession, Transaction)
│   │   ├── services/    # Business logic (ExerciseDetection, CoinDaemon)
│   │   ├── routes/      # API endpoints
│   │   └── middleware/  # Auth, validation, error handling
│
└── coin-daemon/         # F7CoinV4 fork configuration
    ├── config/          # Daemon configuration templates
    └── scripts/         # Daemon management scripts
```

## Features

### Mobile App
- Step tracking with pedometer sensors
- Real-time exercise session monitoring
- Wallet balance and transaction history
- User leaderboards
- Progress statistics

### Server
- User authentication (JWT)
- Exercise session management
- Anti-cheat detection (prevents paint mixer attacks)
- Per-user daemon management
- Transaction logging
- Rate limiting and security

### Anti-Cheat System
- Detects unnatural step patterns
- Validates step rate variance (catches mechanical devices)
- Identifies periodic patterns
- Checks for impossible acceleration
- Requires minimum sustained exercise duration

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 7+
- F7CoinV4 daemon (build from source)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin

# Start services
docker-compose up -d

# View logs
docker-compose logs -f server
```

### Manual Setup

#### Server
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

#### Mobile App
```bash
cd mobile-app
npm install
npm start
# Scan QR code with Expo Go app
```

#### Coin Daemon
```bash
# 1. Build F7CoinV4 fork
git clone https://github.com/sp00nznet/F7CoinV4.git
cd F7CoinV4
# Follow build instructions

# 2. Generate new genesis block for Exercise Coin
cd ../coin-daemon/scripts
./generate-genesis.sh

# 3. Update source with new genesis and rebuild
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Exercise
- `POST /api/exercise/session/start` - Start exercise session
- `POST /api/exercise/session/steps` - Record step data
- `POST /api/exercise/session/end` - End session and trigger mining
- `GET /api/exercise/sessions` - Get session history
- `GET /api/exercise/stats` - Get exercise statistics

### Wallet
- `GET /api/wallet/balance` - Get coin balance
- `GET /api/wallet/address` - Get wallet address
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/daemon/status` - Get daemon status

### User
- `GET /api/user/dashboard` - Get dashboard data
- `GET /api/user/leaderboard` - Get top earners

## Configuration

### Environment Variables

```env
# Server
PORT=3000
MONGODB_URI=mongodb://localhost:27017/exercise-coin
JWT_SECRET=your-secret-key

# Coin Daemon (Exercise Coin unique ports)
COIN_DAEMON_HOST=localhost
COIN_DAEMON_PORT=39338

# Exercise Detection
MIN_EXERCISE_DURATION_SECONDS=60
MINING_SECONDS_PER_EXERCISE_SECOND=0.5
```

## Network Parameters

Exercise Coin uses **unique network parameters** to avoid conflicts with F7CoinV4 and other altcoins.

| Parameter       | Mainnet | Testnet |
|-----------------|---------|---------|
| P2P Port        | 39339   | 39340   |
| RPC Port        | 39338   | 39341   |
| Address Prefix  | 33 (E)  | 111 (m) |
| Bech32 Prefix   | exc     | texc    |

**Important**: When building the coin daemon from F7CoinV4 source, you MUST update these parameters and generate a new genesis block. See `coin-daemon/config/network-params.md` for detailed instructions.

## Exercise Validation Rules

To qualify for mining rewards:
1. Exercise for at least 60 consecutive seconds
2. Maintain a walking/running pace (1-5 steps per second)
3. Show natural variance in step rate
4. No suspicious patterns detected

## License

MIT
