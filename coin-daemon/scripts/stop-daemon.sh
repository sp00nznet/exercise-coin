#!/bin/bash

# Stop Exercise Coin daemon for a specific user
# Usage: ./stop-daemon.sh <user_id>

set -e

USER_ID=$1

if [ -z "$USER_ID" ]; then
    echo "Usage: $0 <user_id>"
    exit 1
fi

DATA_DIR="${EXERCISECOIN_DATA_DIR:-/var/lib/exercisecoin}/users/$USER_ID"
PID_FILE="$DATA_DIR/exercisecoind.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "No daemon running for user $USER_ID (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! kill -0 "$PID" 2>/dev/null; then
    echo "Daemon not running (stale PID file)"
    rm "$PID_FILE"
    exit 0
fi

echo "Stopping daemon for user $USER_ID (PID: $PID)..."

# Graceful shutdown
kill -TERM "$PID"

# Wait for shutdown (max 30 seconds)
for i in {1..30}; do
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "Daemon stopped successfully"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo "Daemon did not stop gracefully, forcing..."
kill -9 "$PID" 2>/dev/null || true
rm -f "$PID_FILE"

echo "Daemon stopped"
