# Architecture Overview

This document describes the system architecture of Exercise Coin.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

Exercise Coin is a distributed system with three main components:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              EXERCISE COIN                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │
│  │              │     │              │     │                          │   │
│  │  Mobile App  │────▶│    Server    │────▶│  Coin Daemon (per user)  │   │
│  │  (iOS/Android)     │  (Express)   │     │      (F7CoinV4)          │   │
│  │              │◀────│              │◀────│                          │   │
│  └──────────────┘     └──────┬───────┘     └──────────────────────────┘   │
│                              │                                             │
│                              ▼                                             │
│                       ┌──────────────┐                                     │
│                       │   MongoDB    │                                     │
│                       │   Database   │                                     │
│                       └──────────────┘                                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Mobile Application

**Technology Stack:**
- React Native with Expo
- Zustand for state management
- Expo Sensors for pedometer access

**Key Responsibilities:**
- Step counting via device sensors
- Session management
- User authentication
- Wallet display

```
mobile-app/
├── App.js                 # Entry point, navigation setup
└── src/
    ├── screens/           # UI screens
    │   ├── HomeScreen.js
    │   ├── ExerciseScreen.js
    │   ├── WalletScreen.js
    │   └── ProfileScreen.js
    ├── hooks/
    │   └── useStepCounter.js  # Pedometer integration
    ├── stores/
    │   ├── authStore.js       # Authentication state
    │   └── exerciseStore.js   # Exercise session state
    └── services/
        └── api.js             # HTTP client
```

### Backend Server

**Technology Stack:**
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication

**Key Responsibilities:**
- User authentication & authorization
- Exercise session validation
- Anti-cheat detection
- Daemon orchestration
- Transaction logging

```
server/
└── src/
    ├── index.js              # Server entry point
    ├── controllers/          # Request handlers
    │   ├── authController.js
    │   ├── exerciseController.js
    │   ├── walletController.js
    │   └── userController.js
    ├── models/               # Database schemas
    │   ├── User.js
    │   ├── ExerciseSession.js
    │   └── Transaction.js
    ├── services/             # Business logic
    │   ├── ExerciseDetectionService.js
    │   └── CoinDaemonService.js
    ├── routes/               # API routes
    ├── middleware/           # Auth, validation, errors
    └── utils/
        └── logger.js
```

### Coin Daemon

**Technology Stack:**
- F7CoinV4 fork (C++)
- Bitcoin-derived cryptocurrency

**Key Responsibilities:**
- Blockchain consensus
- Mining operations
- Wallet management
- Transaction processing

```
coin-daemon/
├── config/
│   ├── exercisecoin.conf.example
│   └── network-params.md
└── scripts/
    ├── generate-genesis.sh
    ├── start-daemon.sh
    ├── stop-daemon.sh
    └── mine.sh
```

---

## Data Flow

### Exercise Session Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  START  │───▶│  TRACK  │───▶│VALIDATE │───▶│  MINE   │───▶│ REWARD  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
  App starts    App sends      Server runs   Daemon mines   Transaction
  session       step data      anti-cheat    for duration   recorded
                every 10s      algorithms
```

### Detailed Sequence

```
User          Mobile App         Server           Database        Daemon
 │                │                 │                 │              │
 │  Start Run     │                 │                 │              │
 │───────────────▶│                 │                 │              │
 │                │  POST /session/start              │              │
 │                │────────────────▶│                 │              │
 │                │                 │  Create session │              │
 │                │                 │────────────────▶│              │
 │                │  { sessionId }  │                 │              │
 │                │◀────────────────│                 │              │
 │                │                 │                 │              │
 │  Walking...    │  Track steps    │                 │              │
 │                │  locally        │                 │              │
 │                │                 │                 │              │
 │                │  POST /session/steps (every 10s)  │              │
 │                │────────────────▶│                 │              │
 │                │                 │  Append data    │              │
 │                │                 │────────────────▶│              │
 │                │                 │                 │              │
 │  Stop Run      │                 │                 │              │
 │───────────────▶│                 │                 │              │
 │                │  POST /session/end                │              │
 │                │────────────────▶│                 │              │
 │                │                 │                 │              │
 │                │                 │  Analyze steps  │              │
 │                │                 │  (anti-cheat)   │              │
 │                │                 │                 │              │
 │                │                 │  If valid:      │              │
 │                │                 │─────────────────────────────▶│
 │                │                 │                 │   Mine for   │
 │                │                 │                 │   duration   │
 │                │                 │◀─────────────────────────────│
 │                │                 │  Mining result  │              │
 │                │                 │                 │              │
 │                │                 │  Save transaction              │
 │                │                 │────────────────▶│              │
 │                │                 │                 │              │
 │                │  { coinsEarned }│                 │              │
 │                │◀────────────────│                 │              │
 │  See rewards!  │                 │                 │              │
 │◀───────────────│                 │                 │              │
```

---

## Security Architecture

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User registers/logs in                                   │
│     └──▶ Server validates credentials                        │
│          └──▶ JWT token generated (7 day expiry)             │
│               └──▶ Token stored in secure storage (mobile)   │
│                                                              │
│  2. Subsequent requests                                      │
│     └──▶ Token in Authorization header                       │
│          └──▶ Server verifies signature                      │
│               └──▶ Request processed if valid                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Anti-Cheat System

The exercise detection service implements multiple layers of validation:

```
┌──────────────────────────────────────────────────────────────┐
│                    ANTI-CHEAT LAYERS                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Duration Check                                     │
│  ├── Minimum 60 consecutive seconds required                 │
│  └── Gaps reset the consecutive counter                      │
│                                                              │
│  Layer 2: Rate Validation                                    │
│  ├── 1-5 steps per second (human walking/running)            │
│  └── >10 steps/second = superhuman, rejected                 │
│                                                              │
│  Layer 3: Variance Analysis                                  │
│  ├── Natural walking has step rate variance                  │
│  └── Too consistent = mechanical device (paint mixer)        │
│                                                              │
│  Layer 4: Pattern Detection                                  │
│  ├── Periodic patterns detected (robotic)                    │
│  └── Identical consecutive readings flagged                  │
│                                                              │
│  Layer 5: Acceleration Check                                 │
│  ├── Sudden jumps in step rate flagged                       │
│  └── Impossible accelerations = tampering                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Network Isolation

```
┌──────────────────────────────────────────────────────────────┐
│                 NETWORK SECURITY                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Unique Parameters (prevent cross-chain attacks):            │
│  ├── P2P Port: 39339 (mainnet), 39340 (testnet)             │
│  ├── RPC Port: 39338 (mainnet), 39341 (testnet)             │
│  ├── Magic Bytes: 0xe5c0019e (unique identifier)             │
│  ├── Address Prefix: 33 (addresses start with 'E')          │
│  └── Genesis Block: Unique to Exercise Coin                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Architecture (Single Server)

Suitable for up to ~1,000 concurrent users.

### Horizontal Scaling

For larger deployments:

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Server 1    │  │   Server 2    │  │   Server 3    │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ MongoDB Replica │
                  │      Set        │
                  └─────────────────┘
```

### Daemon Scaling

Each user requires their own daemon instance. For large scale:

1. **Containerization**: Run daemons in Docker containers
2. **Orchestration**: Use Kubernetes for daemon management
3. **Resource Limits**: CPU/memory limits per daemon
4. **Shared Mining Pool**: Alternative architecture for efficiency

---

## Database Schema

### Collections

```
┌─────────────────────────────────────────────────────────────┐
│                        MONGODB                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  users                                                      │
│  ├── _id: ObjectId                                          │
│  ├── email: String (unique)                                 │
│  ├── username: String (unique)                              │
│  ├── password: String (hashed)                              │
│  ├── walletAddress: String                                  │
│  ├── daemonPort: Number                                     │
│  ├── daemonStatus: String                                   │
│  ├── totalCoinsEarned: Number                               │
│  ├── totalSteps: Number                                     │
│  └── timestamps                                             │
│                                                             │
│  exercisesessions                                           │
│  ├── _id: ObjectId                                          │
│  ├── userId: ObjectId (ref: users)                          │
│  ├── startTime: Date                                        │
│  ├── endTime: Date                                          │
│  ├── status: String (active|completed|invalid|rewarded)     │
│  ├── stepData: [{ timestamp, stepCount, stepsPerSecond }]   │
│  ├── coinsEarned: Number                                    │
│  └── timestamps                                             │
│                                                             │
│  transactions                                               │
│  ├── _id: ObjectId                                          │
│  ├── userId: ObjectId (ref: users)                          │
│  ├── exerciseSessionId: ObjectId (ref: exercisesessions)    │
│  ├── type: String (mining_reward|transfer|withdrawal)       │
│  ├── amount: Number                                         │
│  ├── status: String (pending|confirmed|failed)              │
│  └── timestamps                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
