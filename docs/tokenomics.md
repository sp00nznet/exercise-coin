# Exercise Coin Tokenomics

Complete guide to the Exercise Coin economic system.

## Table of Contents

- [Overview](#overview)
- [Blockchain Parameters](#blockchain-parameters)
- [Earning Methods](#earning-methods)
- [Drop System](#drop-system)
- [Fee Structure](#fee-structure)

---

## Overview

Exercise Coin (EXC) is based on F7CoinV4, a Scrypt-based cryptocurrency. The tokenomics are designed to reward consistent exercise while maintaining excitement through the tiered drop system.

### Key Metrics

| Parameter | Value |
|-----------|-------|
| Total Supply | 200,000,000 EXC |
| Block Reward | 77 EXC |
| Block Time | 30 seconds |
| Halving Interval | 840,000 blocks (~292 days) |
| Algorithm | Scrypt |

---

## Blockchain Parameters

### Network Configuration

| Network | P2P Port | RPC Port |
|---------|----------|----------|
| Mainnet | 39339 | 39338 |
| Testnet | 39340 | 39341 |

### Address Format

| Type | Mainnet Prefix | Example |
|------|----------------|---------|
| Public Key | E | E7a8b9c0d1... |
| Script | e | e5f6g7h8i9... |
| Bech32 | exc1 | exc1qrst... |

---

## Earning Methods

### Exercise Mining

The primary way to earn EXC is through exercise:

```
Exercise Duration × Mining Ratio = Mining Time
Mining Time × Coins Per Minute = EXC Earned
```

| Setting | Value |
|---------|-------|
| Mining Ratio | 50% (30 min exercise = 15 min mining) |
| Coins Per Mining Minute | 5.13 EXC |
| Minimum Exercise | 60 seconds |
| Max Mining Per Session | 60 minutes |

**Example:**
- 30 minutes of exercise
- 15 minutes of mining time
- ~77 EXC earned (one block equivalent!)

### Random Treasure Drops

Weekly drops occur every Sunday. See [Drop System](#drop-system) below.

### Friendliness Bonus

Weekly bonuses every Saturday for users who transferred coins to others:
- 35% chance of receiving bonus
- 10-77 EXC base bonus
- Multipliers based on transfer amounts (up to 3x!)

### Rest Stop Bonus

Bonus when exercising with friends and stopping at a venue:
- 5-25 EXC base bonus
- Venue multipliers (up to 2x for healthy food!)
- See [Rest Stop Bonus](./rest-stop-bonus.md)

### Achievement Rewards

Unlock achievements for various milestones:

| Reward Tier | Amount |
|-------------|--------|
| Badge Only | 0 EXC |
| Small | 10 EXC |
| Medium | 25 EXC |
| Large | 77 EXC |
| Epic | 200 EXC |
| Legendary | 500 EXC |

---

## Drop System

The tiered drop system adds excitement with chances for big rewards!

### Drop Tiers

| Tier | Chance | Min | Max | Message |
|------|--------|-----|-----|---------|
| Common | 55% | 5 | 25 | "Nice find! Keep moving!" |
| Rare | 25% | 30 | 77 | "Great discovery!" |
| Epic | 12% | 100 | 300 | "WOW! Epic treasure!" |
| Legendary | 8% | 500 | 1,000 | "JACKPOT! LEGENDARY FIND!" |

### Weekly Drop Schedule

| Day | Event |
|-----|-------|
| Saturday | Friendliness Bonus (for generous users) |
| Sunday | Random Treasure Drops |

### Drop Eligibility

Treasure drops are placed in active exercise zones:
- Users must be actively exercising to find drops
- Drops expire after 14 days if unclaimed
- 25 drops generated per week

---

## Fee Structure

### Exchange Fees

| Fee Type | Rate |
|----------|------|
| Trading Fee | 1.0% |
| Withdrawal Fee | 0.5% |

### Transfer Fees

| Transfer Type | Fee |
|---------------|-----|
| User to User | Free |
| QR Payment | Free |

---

## Configuration Reference

All tokenomics settings are in `server/src/config/tokenomics.js`:

```javascript
const TOKENOMICS = {
  BLOCKCHAIN: {
    BLOCK_REWARD: 77,
    BLOCK_TIME_SECONDS: 30,
    TOTAL_SUPPLY: 200_000_000,
    HALVING_INTERVAL: 840_000,
    ALGORITHM: 'scrypt'
  },

  EXERCISE_MINING: {
    MINING_RATIO: 0.5,
    COINS_PER_MINING_MINUTE: 5.13,
    MIN_EXERCISE_SECONDS: 60,
    MAX_MINING_MINUTES_PER_SESSION: 60
  },

  RANDOM_DROPS: {
    MINING_MINUTES: 30,
    DROPS_PER_WEEK: 25,
    EXPIRY_DAYS: 14,
    TIERS: { /* ... */ }
  },

  FRIENDLINESS: {
    MINING_MINUTES: 30,
    BONUS_CHANCE: 0.35,
    MIN_BONUS: 10,
    MAX_BONUS: 77,
    MULTIPLIERS: { /* ... */ }
  },

  REST_STOP: {
    MIN_EXERCISE_MINUTES: 15,
    COOLDOWN_HOURS: 4,
    VENUE_MULTIPLIERS: { /* ... */ }
  },

  ACHIEVEMENTS: {
    REWARDS: { /* ... */ }
  },

  EXCHANGE: {
    TRADE_FEE_PERCENT: 1.0,
    WITHDRAWAL_FEE_PERCENT: 0.5
  }
};
```

---

## Halving Schedule

Block rewards halve approximately every 292 days:

| Era | Blocks | Block Reward | Cumulative Supply |
|-----|--------|--------------|-------------------|
| 1 | 0 - 839,999 | 77 EXC | 64,679,923 EXC |
| 2 | 840,000 - 1,679,999 | 38.5 EXC | 97,019,884 EXC |
| 3 | 1,680,000 - 2,519,999 | 19.25 EXC | 113,189,865 EXC |
| ... | ... | ... | ... |

This creates a deflationary model similar to Bitcoin, incentivizing early adoption while maintaining long-term value.
