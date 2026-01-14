<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="Exercise Coin" width="120" />
</p>

<h1 align="center">Exercise Coin</h1>

<p align="center">
  <strong>Get Fit. Get Paid.</strong><br>
  Earn cryptocurrency rewards for your physical activity.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
</p>

---

## Overview

Exercise Coin transforms your daily physical activity into cryptocurrency rewards. Using your smartphone's pedometer, we track your exercise sessions, validate they're legitimate, and reward you with EXC coins mined on your personal blockchain node.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   Server    │────▶│    Coin     │────▶│   Wallet    │
│     App     │     │  Validates  │     │   Daemon    │     │   Payout    │
│ Track Steps │     │  Exercise   │     │   Mining    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Features

<table>
<tr>
<td width="50%">

### Mobile App
- Real-time step tracking
- Exercise session monitoring
- Wallet & transaction history
- Leaderboards & achievements
- iOS & Android support

</td>
<td width="50%">

### Backend
- JWT authentication
- Anti-cheat detection
- Per-user mining daemons
- MongoDB persistence
- Rate limiting & security

</td>
</tr>
</table>

### Anti-Cheat Protection

Our system detects and prevents:
- Mechanical devices (paint mixers, shakers)
- Periodic/robotic patterns
- Impossible acceleration spikes
- Superhuman step rates

## How It Works

| Step | Action | Description |
|:----:|--------|-------------|
| 1 | **Track** | Mobile app monitors your steps via device sensors |
| 2 | **Validate** | Server analyzes patterns for 60+ seconds of sustained activity |
| 3 | **Mine** | Your personal daemon mines for time proportional to exercise |
| 4 | **Earn** | Mined coins are credited to your wallet |

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f server
```

### Manual Installation

<details>
<summary><strong>Server Setup</strong></summary>

```bash
cd server
cp .env.example .env
# Configure your environment variables
npm install
npm run dev
```

</details>

<details>
<summary><strong>Mobile App Setup</strong></summary>

```bash
cd mobile-app
npm install
npm start
# Scan QR code with Expo Go
```

</details>

<details>
<summary><strong>Coin Daemon Setup</strong></summary>

```bash
# Build from F7CoinV4 source
git clone https://github.com/sp00nznet/F7CoinV4.git
cd F7CoinV4

# Generate unique genesis block
cd ../coin-daemon/scripts
./generate-genesis.sh

# Follow instructions in coin-daemon/config/network-params.md
```

</details>

## Network Parameters

Exercise Coin uses unique network parameters to ensure complete isolation from other cryptocurrencies.

| Parameter | Mainnet | Testnet |
|-----------|:-------:|:-------:|
| P2P Port | `39339` | `39340` |
| RPC Port | `39338` | `39341` |
| Address Prefix | `E` | `m` |
| Bech32 Prefix | `exc` | `texc` |

> **Important**: See [Network Parameters Guide](docs/coin-daemon.md#network-parameters) for complete source code modifications.

## Project Structure

```
exercise-coin/
├── mobile-app/          # React Native (Expo) application
│   └── src/
│       ├── screens/     # App screens
│       ├── hooks/       # Custom React hooks
│       ├── stores/      # Zustand state management
│       └── services/    # API client
│
├── server/              # Node.js Express backend
│   └── src/
│       ├── controllers/ # Route handlers
│       ├── models/      # MongoDB schemas
│       ├── services/    # Business logic
│       ├── routes/      # API routes
│       └── middleware/  # Auth, validation
│
├── coin-daemon/         # Cryptocurrency daemon
│   ├── config/          # Configuration files
│   └── scripts/         # Management scripts
│
└── docs/                # Documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Complete setup guide |
| [API Reference](docs/api-reference.md) | Full API documentation |
| [Architecture](docs/architecture.md) | System design overview |
| [Mobile App](docs/mobile-app.md) | Mobile development guide |
| [Coin Daemon](docs/coin-daemon.md) | Blockchain setup & config |
| [Deployment](docs/deployment.md) | Production deployment |

## Configuration

```env
# Server
PORT=3000
MONGODB_URI=mongodb://localhost:27017/exercise-coin
JWT_SECRET=your-secret-key

# Coin Daemon
COIN_DAEMON_HOST=localhost
COIN_DAEMON_PORT=39338

# Exercise Detection
MIN_EXERCISE_DURATION_SECONDS=60
MINING_SECONDS_PER_EXERCISE_SECOND=0.5
```

## Exercise Requirements

To earn rewards, your exercise must meet these criteria:

| Requirement | Value |
|-------------|-------|
| Minimum Duration | 60 consecutive seconds |
| Step Rate | 1-5 steps per second |
| Pattern Variance | Natural human variance required |
| Suspicious Patterns | None detected |

## Tech Stack

- **Mobile**: React Native, Expo, Zustand
- **Backend**: Node.js, Express, MongoDB
- **Blockchain**: F7CoinV4 fork
- **Infrastructure**: Docker, Docker Compose

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with sweat and code</sub>
</p>
