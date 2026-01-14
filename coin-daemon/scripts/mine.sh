#!/bin/bash

# Control mining for a user's daemon
# Usage: ./mine.sh <user_id> <start|stop> [duration_seconds]

set -e

USER_ID=$1
ACTION=$2
DURATION=$3

if [ -z "$USER_ID" ] || [ -z "$ACTION" ]; then
    echo "Usage: $0 <user_id> <start|stop> [duration_seconds]"
    exit 1
fi

DATA_DIR="${EXERCISECOIN_DATA_DIR:-/var/lib/exercisecoin}/users/$USER_ID"
CRED_FILE="$DATA_DIR/rpc_credentials.json"

if [ ! -f "$CRED_FILE" ]; then
    echo "No credentials file found for user $USER_ID"
    exit 1
fi

# Read RPC credentials
RPC_USER=$(jq -r '.rpcuser' "$CRED_FILE")
RPC_PASS=$(jq -r '.rpcpassword' "$CRED_FILE")
RPC_PORT=$(jq -r '.rpcport' "$CRED_FILE")

rpc_call() {
    curl -s --user "$RPC_USER:$RPC_PASS" \
         --data-binary "{\"jsonrpc\":\"1.0\",\"id\":\"mine\",\"method\":\"$1\",\"params\":[$2]}" \
         -H 'content-type: text/plain;' \
         "http://127.0.0.1:$RPC_PORT/"
}

case $ACTION in
    start)
        echo "Starting mining for user $USER_ID..."
        RESULT=$(rpc_call "setgenerate" "true, 1")
        echo "Mining started: $RESULT"

        if [ -n "$DURATION" ]; then
            echo "Mining will run for $DURATION seconds..."
            sleep "$DURATION"
            echo "Stopping mining..."
            STOP_RESULT=$(rpc_call "setgenerate" "false")
            echo "Mining stopped: $STOP_RESULT"

            # Get mining results
            BALANCE=$(rpc_call "getbalance" "")
            echo "Current balance: $BALANCE"
        fi
        ;;

    stop)
        echo "Stopping mining for user $USER_ID..."
        RESULT=$(rpc_call "setgenerate" "false")
        echo "Mining stopped: $RESULT"
        ;;

    status)
        echo "Getting mining info for user $USER_ID..."
        RESULT=$(rpc_call "getmininginfo" "")
        echo "$RESULT"
        ;;

    balance)
        echo "Getting balance for user $USER_ID..."
        RESULT=$(rpc_call "getbalance" "")
        echo "$RESULT"
        ;;

    newaddress)
        echo "Generating new address for user $USER_ID..."
        RESULT=$(rpc_call "getnewaddress" "")
        echo "$RESULT"
        ;;

    *)
        echo "Unknown action: $ACTION"
        echo "Valid actions: start, stop, status, balance, newaddress"
        exit 1
        ;;
esac
