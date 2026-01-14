# Getting Started

This guide will walk you through setting up Exercise Coin from scratch.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
  - [Database Setup](#database-setup)
  - [Server Setup](#server-setup)
  - [Mobile App Setup](#mobile-app-setup)
  - [Coin Daemon Setup](#coin-daemon-setup)
- [Verifying Your Installation](#verifying-your-installation)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18.0.0+ | Server & mobile app |
| npm | 9.0.0+ | Package management |
| MongoDB | 7.0+ | Database |
| Docker | 24.0+ | Containerization (optional) |
| Git | 2.0+ | Version control |

### Platform-Specific Requirements

**For Mobile Development:**
- iOS: macOS with Xcode 14+
- Android: Android Studio with SDK 33+
- Or use Expo Go app for quick testing

**For Coin Daemon:**
- Linux (Ubuntu 22.04 recommended)
- Build tools: `build-essential`, `libtool`, `autotools-dev`
- Libraries: `libssl-dev`, `libevent-dev`, `libboost-all-dev`

---

## Quick Start (Docker)

The fastest way to get started is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin

# 2. Create environment file
cat > .env << EOF
MONGO_PASSWORD=your-secure-password
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 3. Start all services
docker-compose up -d

# 4. Verify services are running
docker-compose ps

# 5. View server logs
docker-compose logs -f server
```

Services will be available at:
- **Server API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Coin Daemon RPC**: localhost:39338

---

## Manual Setup

### Database Setup

#### Option 1: Local MongoDB

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in your `.env` file

---

### Server Setup

```bash
# Navigate to server directory
cd server

# Copy environment template
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/exercise-coin

# Authentication
JWT_SECRET=generate-a-strong-random-string-here
JWT_EXPIRES_IN=7d

# Coin Daemon
COIN_DAEMON_HOST=localhost
COIN_DAEMON_PORT=39338
COIN_DAEMON_USER=exercisecoin
COIN_DAEMON_PASS=your-rpc-password

# Exercise Detection
MIN_EXERCISE_DURATION_SECONDS=60
STEPS_PER_SECOND_MIN=1
STEPS_PER_SECOND_MAX=5
MINING_SECONDS_PER_EXERCISE_SECOND=0.5
```

Install and run:

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

Verify the server is running:

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

### Mobile App Setup

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npm start
```

#### Running on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. App will load on your device

#### Running on Simulator

```bash
# iOS (macOS only)
npm run ios

# Android
npm run android
```

#### Configure API Endpoint

Create `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://your-server-ip:3000/api
```

For local development on device, use your computer's local IP:

```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

### Coin Daemon Setup

#### 1. Build from Source

```bash
# Install build dependencies (Ubuntu)
sudo apt-get update
sudo apt-get install -y \
    build-essential libtool autotools-dev automake \
    pkg-config libssl-dev libevent-dev bsdmainutils \
    libboost-all-dev libdb-dev libdb++-dev libminiupnpc-dev

# Clone F7CoinV4
git clone https://github.com/sp00nznet/F7CoinV4.git
cd F7CoinV4
```

#### 2. Apply Exercise Coin Parameters

Before building, update the source with Exercise Coin's unique network parameters. See [coin-daemon.md](coin-daemon.md#network-parameters) for detailed instructions.

#### 3. Generate Genesis Block

```bash
cd exercise-coin/coin-daemon/scripts
./generate-genesis.sh
```

#### 4. Build and Install

```bash
cd F7CoinV4
./autogen.sh
./configure
make -j$(nproc)
sudo make install
```

#### 5. Start Daemon

```bash
# Create data directory
mkdir -p ~/.exercisecoin

# Copy configuration
cp exercise-coin/coin-daemon/config/exercisecoin.conf.example ~/.exercisecoin/exercisecoin.conf

# Edit configuration with your RPC credentials
nano ~/.exercisecoin/exercisecoin.conf

# Start daemon
exercisecoind -daemon

# Check status
exercisecoin-cli getinfo
```

---

## Verifying Your Installation

Run these checks to ensure everything is working:

### 1. Server Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. Database Connection

```bash
curl http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","username":"testuser"}'
```

Expected: `{"message":"Registration successful","token":"...","user":{...}}`

### 3. Coin Daemon Status

```bash
exercisecoin-cli getblockchaininfo
```

Expected: Block count and chain information

### 4. Mobile App Connection

1. Open app on device
2. Register a new account
3. Should see the home dashboard

---

## Next Steps

Now that you have Exercise Coin running:

1. **[Architecture Overview](architecture.md)** - Understand how components interact
2. **[API Reference](api-reference.md)** - Explore the full API
3. **[Mobile App Guide](mobile-app.md)** - Customize the mobile app
4. **[Deployment Guide](deployment.md)** - Deploy to production

---

## Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -i :3000

# Check MongoDB connection
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Mobile app can't connect

1. Ensure server and phone are on same network
2. Check firewall allows port 3000
3. Use IP address, not `localhost`

### Coin daemon issues

```bash
# Check daemon logs
tail -f ~/.exercisecoin/debug.log

# Restart daemon
exercisecoin-cli stop
exercisecoind -daemon
```

For more help, see the [GitHub Issues](https://github.com/sp00nznet/exercise-coin/issues).
