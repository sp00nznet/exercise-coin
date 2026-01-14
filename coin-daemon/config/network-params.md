# Exercise Coin Network Parameters

These parameters are **UNIQUE** to Exercise Coin and must be used when building from the F7CoinV4 source to avoid conflicts with other altcoins.

## Network Ports

| Parameter | Mainnet | Testnet |
|-----------|---------|---------|
| P2P Port  | 39339   | 39340   |
| RPC Port  | 39338   | 39341   |

## Address Prefixes

| Parameter      | Mainnet | Testnet | Result     |
|----------------|---------|---------|------------|
| Address Prefix | 33      | 111     | E... / m...|
| Script Prefix  | 85      | 196     | e... / 2...|
| Secret Prefix  | 161     | 239     | -          |
| Bech32 Prefix  | exc     | texc    | exc1... / texc1... |

## Network Magic Bytes

Use unique magic bytes to prevent cross-network communication:

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

## Source Code Changes Required

When building from F7CoinV4, update these files:

### chainparams.cpp

```cpp
// Mainnet
class CMainParams : public CChainParams {
public:
    CMainParams() {
        strNetworkID = "main";

        // Network magic
        pchMessageStart[0] = 0xe5;
        pchMessageStart[1] = 0xc0;
        pchMessageStart[2] = 0x01;
        pchMessageStart[3] = 0x9e;

        // Ports
        nDefaultPort = 39339;
        nRPCPort = 39338;

        // Address prefixes
        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 33);  // E
        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 85);  // e
        base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 161);

        // Bech32
        bech32_hrp = "exc";

        // Genesis block - MUST BE REGENERATED
        // Use generate-genesis.sh to create unique genesis
    }
};

// Testnet
class CTestNetParams : public CChainParams {
public:
    CTestNetParams() {
        strNetworkID = "test";

        // Network magic
        pchMessageStart[0] = 0xe5;
        pchMessageStart[1] = 0xc0;
        pchMessageStart[2] = 0x01;
        pchMessageStart[3] = 0x7e;

        // Ports
        nDefaultPort = 39340;
        nRPCPort = 39341;

        // Address prefixes
        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1, 111); // m/n
        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1, 196); // 2
        base58Prefixes[SECRET_KEY] = std::vector<unsigned char>(1, 239);

        // Bech32
        bech32_hrp = "texc";
    }
};
```

## Genesis Block

**CRITICAL**: You MUST generate a new genesis block. Do NOT reuse F7CoinV4's genesis.

Run the genesis generator:
```bash
./scripts/generate-genesis.sh
```

Then update the source with the output hash values before final compilation.

## Verification Checklist

Before deployment, verify:
- [ ] Genesis block hash is unique to Exercise Coin
- [ ] Merkle root is unique
- [ ] Network magic bytes are set correctly
- [ ] Ports don't conflict (39338-39341)
- [ ] Address prefixes produce expected formats (E... for mainnet)
- [ ] Bech32 addresses start with exc1... or texc1...
- [ ] No connections to F7CoinV4 or other networks possible
