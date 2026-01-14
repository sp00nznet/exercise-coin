# Coin Daemon Guide

Complete guide for setting up and managing the Exercise Coin daemon.

## Table of Contents

- [Overview](#overview)
- [Network Parameters](#network-parameters)
- [Building from Source](#building-from-source)
- [Genesis Block Generation](#genesis-block-generation)
- [Configuration](#configuration)
- [Daemon Management](#daemon-management)
- [Mining Operations](#mining-operations)
- [RPC Interface](#rpc-interface)

---

## Overview

Exercise Coin uses a fork of F7CoinV4 as its blockchain. Each user gets their own daemon instance for mining rewards.

### Key Characteristics

| Property | Value |
|----------|-------|
| Algorithm | Scrypt |
| Block Time | ~60 seconds |
| Block Reward | 50 EXC |
| Port (Mainnet) | 39339 (P2P), 39338 (RPC) |
| Port (Testnet) | 39340 (P2P), 39341 (RPC) |

---

## Network Parameters

**CRITICAL**: These parameters MUST be unique to prevent conflicts with other cryptocurrencies.

### Port Configuration

| Network | P2P Port | RPC Port |
|---------|----------|----------|
| Mainnet | 39339 | 39338 |
| Testnet | 39340 | 39341 |

### Address Prefixes

| Type | Mainnet | Testnet | Result |
|------|---------|---------|--------|
| Public Key | 33 | 111 | E... / m... |
| Script | 85 | 196 | e... / 2... |
| Secret Key | 161 | 239 | - |
| Bech32 HRP | exc | texc | exc1... / texc1... |

### Network Magic Bytes

Unique bytes to identify Exercise Coin network traffic:

```cpp
// Mainnet
pchMessageStart[0] = 0xe5;  // E
pchMessageStart[1] = 0xc0;  // X
pchMessageStart[2] = 0x01;  // C
pchMessageStart[3] = 0x9e;  // unique

// Testnet
pchMessageStart[0] = 0xe5;
pchMessageStart[1] = 0xc0;
pchMessageStart[2] = 0x01;
pchMessageStart[3] = 0x7e;
```

---

## Building from Source

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    libtool \
    autotools-dev \
    automake \
    pkg-config \
    libssl-dev \
    libevent-dev \
    bsdmainutils \
    libboost-all-dev \
    libdb-dev \
    libdb++-dev \
    libminiupnpc-dev \
    git
```

### Clone and Modify Source

```bash
# Clone F7CoinV4
git clone https://github.com/sp00nznet/F7CoinV4.git
cd F7CoinV4
```

### Apply Exercise Coin Parameters

Edit `src/chainparams.cpp`:

```cpp
class CMainParams : public CChainParams {
public:
    CMainParams() {
        strNetworkID = "main";

        // Exercise Coin network magic
        pchMessageStart[0] = 0xe5;
        pchMessageStart[1] = 0xc0;
        pchMessageStart[2] = 0x01;
        pchMessageStart[3] = 0x9e;

        // Exercise Coin ports
        nDefaultPort = 39339;
        nRPCPort = 39338;

        // Exercise Coin address prefixes
        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 33);
        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 85);
        base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 161);

        // Bech32 prefix
        bech32_hrp = "exc";

        // Genesis block (update after generation)
        // genesis = CreateGenesisBlock(...);
        // consensus.hashGenesisBlock = genesis.GetHash();
    }
};
```

### Build

```bash
./autogen.sh
./configure --without-gui
make -j$(nproc)
sudo make install
```

---

## Genesis Block Generation

Every new cryptocurrency needs a unique genesis block.

### Step 1: Run Generator Script

```bash
cd exercise-coin/coin-daemon/scripts
./generate-genesis.sh
```

Output:

```
=== Genesis Block Parameters ===

Paste these values into your coin source code:

static const char* pszTimestamp = "Exercise Coin: Get Fit, Get Paid - 2024-01-15";
static const uint32_t nGenesisTime = 1705312800;
```

### Step 2: Mine Genesis Block

Temporarily enable genesis mining in source:

```cpp
// In main.cpp or validation.cpp
if (hashGenesisBlock == uint256()) {
    // Mine genesis
    while (genesis.GetHash() > bnProofOfWorkLimit) {
        ++genesis.nNonce;
    }
    printf("Genesis Hash: %s\n", genesis.GetHash().ToString().c_str());
    printf("Merkle Root: %s\n", genesis.hashMerkleRoot.ToString().c_str());
}
```

### Step 3: Update and Rebuild

After mining, update chainparams.cpp with the actual values:

```cpp
consensus.hashGenesisBlock = uint256S("0x00000...");
genesis.hashMerkleRoot = uint256S("0x4a5e1...");
```

Rebuild without genesis mining code.

---

## Configuration

### Main Configuration File

Location: `~/.exercisecoin/exercisecoin.conf`

```ini
# RPC Settings
rpcuser=exercisecoin
rpcpassword=YOUR_SECURE_PASSWORD
rpcport=39338
rpcallowip=127.0.0.1

# Network
server=1
listen=1
port=39339

# Mining (disabled by default)
gen=0

# Wallet
wallet=wallet.dat

# Logging
debug=0
printtoconsole=0
logips=1

# Connections
maxconnections=25
```

### Per-User Configuration

For per-user daemons, each user gets their own data directory:

```bash
/var/lib/exercisecoin/users/
├── user_001/
│   ├── exercisecoin.conf
│   ├── wallet.dat
│   └── debug.log
├── user_002/
│   ├── exercisecoin.conf
│   └── ...
```

---

## Daemon Management

### Starting a Daemon

```bash
# Single user daemon
./scripts/start-daemon.sh USER_ID RPC_PORT

# Example
./scripts/start-daemon.sh abc123 39338
```

The script:
1. Creates user data directory
2. Generates unique RPC password
3. Writes configuration
4. Starts daemon process
5. Saves credentials for server

### Stopping a Daemon

```bash
./scripts/stop-daemon.sh USER_ID
```

### Checking Status

```bash
# Using RPC
exercisecoin-cli -rpcport=39338 getinfo

# Check process
ps aux | grep exercisecoind
```

---

## Mining Operations

### Manual Mining Control

```bash
# Start mining (1 thread)
exercisecoin-cli -rpcport=39338 setgenerate true 1

# Stop mining
exercisecoin-cli -rpcport=39338 setgenerate false

# Check mining status
exercisecoin-cli -rpcport=39338 getmininginfo
```

### Using Mine Script

```bash
# Start mining for duration
./scripts/mine.sh USER_ID start 60

# Stop mining
./scripts/mine.sh USER_ID stop

# Check status
./scripts/mine.sh USER_ID status

# Get balance
./scripts/mine.sh USER_ID balance
```

### Mining During Exercise

The server triggers mining automatically:

1. Exercise session ends with valid activity
2. Server calculates mining duration
3. Server calls `setgenerate true` on user's daemon
4. After duration, calls `setgenerate false`
5. Checks balance for new coins

---

## RPC Interface

### Authentication

```bash
curl --user USER:PASSWORD \
     --data-binary '{"jsonrpc":"1.0","method":"getinfo"}' \
     -H 'content-type: text/plain;' \
     http://127.0.0.1:39338/
```

### Common RPC Methods

#### Get Blockchain Info

```bash
exercisecoin-cli getblockchaininfo
```

```json
{
  "chain": "main",
  "blocks": 1234,
  "headers": 1234,
  "bestblockhash": "00000...",
  "difficulty": 0.001234,
  "verificationprogress": 1.0
}
```

#### Get New Address

```bash
exercisecoin-cli getnewaddress
```

Returns: `E7a8b9c0d1e2f3...`

#### Get Balance

```bash
exercisecoin-cli getbalance
```

Returns: `150.50000000`

#### Send Coins

```bash
exercisecoin-cli sendtoaddress "Eaddress..." 10.0
```

Returns: Transaction ID

#### List Transactions

```bash
exercisecoin-cli listtransactions "*" 10
```

---

## Troubleshooting

### Daemon Won't Start

```bash
# Check logs
tail -f ~/.exercisecoin/debug.log

# Check if port in use
lsof -i :39339
lsof -i :39338
```

### Connection Issues

```bash
# Check peers
exercisecoin-cli getpeerinfo

# Add seed node manually
exercisecoin-cli addnode "seed.exercisecoin.net" "add"
```

### Wallet Issues

```bash
# Rescan blockchain
exercisecoin-cli rescanblockchain

# Backup wallet
cp ~/.exercisecoin/wallet.dat ~/wallet-backup.dat
```

### Mining Not Working

```bash
# Check mining info
exercisecoin-cli getmininginfo

# Verify generate is enabled
exercisecoin-cli getgenerate
```
