#!/bin/bash

# Start Exercise Coin daemon for a specific user
# Usage: ./start-daemon.sh <user_id> <rpc_port>

set -e

USER_ID=$1
RPC_PORT=$2

if [ -z "$USER_ID" ] || [ -z "$RPC_PORT" ]; then
    echo "Usage: $0 <user_id> <rpc_port>"
    exit 1
fi

# Configuration
DAEMON_PATH="${EXERCISECOIN_DAEMON:-exercisecoind}"
DATA_DIR="${EXERCISECOIN_DATA_DIR:-/var/lib/exercisecoin}/users/$USER_ID"
CONF_FILE="$DATA_DIR/exercisecoin.conf"
PID_FILE="$DATA_DIR/exercisecoind.pid"
P2P_PORT=$((RPC_PORT + 1))

# Create user data directory
mkdir -p "$DATA_DIR"

# Check if daemon is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Daemon already running for user $USER_ID (PID: $PID)"
        exit 0
    else
        rm "$PID_FILE"
    fi
fi

# Generate random RPC password for this user
RPC_PASSWORD=$(openssl rand -hex 32)

# Create configuration file
cat > "$CONF_FILE" << EOF
# Exercise Coin Configuration for User: $USER_ID
rpcuser=user_$USER_ID
rpcpassword=$RPC_PASSWORD
rpcport=$RPC_PORT
rpcallowip=127.0.0.1

server=1
listen=1
port=$P2P_PORT

gen=0
wallet=wallet.dat

debug=0
printtoconsole=0
maxconnections=10
EOF

echo "Starting daemon for user $USER_ID..."
echo "RPC Port: $RPC_PORT"
echo "P2P Port: $P2P_PORT"
echo "Data Dir: $DATA_DIR"

# Start the daemon
$DAEMON_PATH -datadir="$DATA_DIR" -conf="$CONF_FILE" -daemon -pid="$PID_FILE"

# Wait for daemon to start
sleep 2

if [ -f "$PID_FILE" ]; then
    echo "Daemon started successfully (PID: $(cat $PID_FILE))"

    # Save RPC credentials for server to use
    echo "{\"rpcuser\": \"user_$USER_ID\", \"rpcpassword\": \"$RPC_PASSWORD\", \"rpcport\": $RPC_PORT}" > "$DATA_DIR/rpc_credentials.json"
    chmod 600 "$DATA_DIR/rpc_credentials.json"
else
    echo "Failed to start daemon"
    exit 1
fi
