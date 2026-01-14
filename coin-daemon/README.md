# Exercise Coin Daemon

This directory contains the configuration and scripts for running the Exercise Coin daemon, a fork of F7CoinV4.

## Prerequisites

1. Build the F7CoinV4 source from https://github.com/sp00nznet/F7CoinV4
2. Generate a new genesis block for Exercise Coin

## Genesis Block Generation

Before using Exercise Coin, you must generate a unique genesis block to differentiate it from other altcoins:

```bash
# Run the genesis generation script
./scripts/generate-genesis.sh
```

This will output the new genesis hash and merkle root that need to be updated in the source code.

## Configuration

Copy `config/exercisecoin.conf.example` to your data directory and update the settings.

## Running the Daemon

```bash
# Start a user-specific daemon
./scripts/start-daemon.sh <user_id> <port>

# Stop a daemon
./scripts/stop-daemon.sh <user_id>
```

## Mining

Mining is controlled by the middleware server based on user exercise activity. The server will:

1. Start mining when valid exercise is detected
2. Mine for a duration proportional to exercise time
3. Stop mining and record any rewards

## Wallet Management

Each user gets their own wallet managed by their personal daemon instance.
