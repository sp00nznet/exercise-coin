#!/bin/bash

# Genesis Block Generator for Exercise Coin
# This script generates a new genesis block to differentiate Exercise Coin from F7CoinV4

set -e

echo "================================================"
echo "Exercise Coin Genesis Block Generator"
echo "================================================"
echo ""

# Genesis message - customize this for your coin
GENESIS_MESSAGE="Exercise Coin: Get Fit, Get Paid - $(date +%Y-%m-%d)"
TIMESTAMP=$(date +%s)

echo "Genesis Message: $GENESIS_MESSAGE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Generate the epoch time for genesis
echo "Generating genesis block parameters..."
echo ""

# These values need to be mined - in production you would run a mining process
# to find a valid nonce that produces a hash below the target difficulty

cat << EOF
=== Genesis Block Parameters ===

Paste these values into your coin source code:

// main.cpp - Update these values
static const char* pszTimestamp = "$GENESIS_MESSAGE";
static const uint32_t nGenesisTime = $TIMESTAMP;

// After mining for valid genesis, update:
// - nNonce (the nonce that produces valid hash)
// - hashGenesisBlock (the resulting genesis hash)
// - hashMerkleRoot (the merkle root of genesis transaction)

=== Next Steps ===

1. Update the source code with the above values
2. Compile with genesis mining enabled
3. Run the daemon - it will mine for the genesis block
4. Copy the output hash values back into the source
5. Recompile with genesis mining disabled
6. Your Exercise Coin is ready!

EOF

echo ""
echo "Genesis parameters generated successfully!"
echo ""
echo "Remember to also update:"
echo "- Network magic bytes (to prevent cross-network communication)"
echo "- Default ports (to avoid conflicts)"
echo "- Address prefixes (for unique address format)"
