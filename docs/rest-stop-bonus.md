# Rest Stop Bonus System

When hiking friends take a break together, they earn bonus coins!

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Venue Types](#venue-types)
- [API Reference](#api-reference)
- [Configuration](#configuration)

---

## Overview

The Rest Stop Bonus rewards users who exercise together and then stop to rest at a venue (restaurant, cafe, etc.). It's designed to encourage social fitness activities.

### Key Features

| Feature | Description |
|---------|-------------|
| Social Bonus | Both users must be at the same venue |
| Venue Detection | Uses location to find nearby places |
| Multipliers | Different venue types give different bonuses |
| Cooldown | Prevent abuse with 4-hour cooldown |

---

## How It Works

### Scenario

1. Two friends are hiking together (both have active exercise sessions)
2. They stop at a restaurant for lunch
3. Both users open the app and check in
4. The app detects they're at the same venue
5. Both users receive bonus coins!

### Requirements

To earn a rest stop bonus:

- Both users must have an active exercise session
- Each user must have exercised for at least 15 minutes
- Users must be within 50 meters of each other
- Both must be at a recognized venue
- Neither user can have claimed a bonus in the last 4 hours

### Bonus Messages

Messages encourage healthy choices! Examples:

**Healthy Venues (Celebrating!):**
| Venue Type | Example Message |
|------------|-----------------|
| Health Food | "AMAZING CHOICE! Healthy food = TRIPLE POINTS!" |
| Salad Bar | "LEGENDARY CHOICE! Greens after gains = MAX BONUS!" |
| Juice Bar | "SMART! Fresh juice = Fresh gains! Big bonus!" |
| Sushi | "Sushi squad! Omega-3 bonus!" |

**Moderate Venues:**
| Venue Type | Example Message |
|------------|-----------------|
| Cafe | "Coffee break! Hydration bonus!" |
| Restaurant | "Hope you picked something healthy!" |

**Less Healthy Venues (Gentle Nudges!):**
| Venue Type | Example Message |
|------------|-----------------|
| Fast Food | "Small bonus. Your body deserves better!" |
| Burger | "Tiny bonus! A salad would've been 3X!" |
| Fried Chicken | "Very small! Grilled chicken = 5X more!" |
| Pizza | "Pizza bonus is modest. Try veggies next time!" |

---

## Venue Types

**Philosophy: 🥗 Salad > 🍔 Burger**

Healthy choices get MUCH bigger bonuses! Your body worked hard - fuel it right!

### Healthy Options (Big Bonuses!)

| Venue Type | Multiplier | Example |
|------------|------------|---------|
| Health Food | 3.0x | Whole Foods, Sweetgreen |
| Juice Bar | 2.8x | Jamba Juice, local juice spots |
| Salad Bar | 2.5x | Chopt, salad-focused spots |
| Vegetarian | 2.5x | Veggie restaurants |
| Poke Bowl | 2.3x | Pokeworks, poke spots |
| Acai | 2.3x | Acai bowl cafes |
| Organic | 2.5x | Organic cafes |
| Mediterranean | 1.8x | Greek, Lebanese restaurants |
| Sushi | 1.7x | Sushi restaurants |

### Moderate Options

| Venue Type | Multiplier | Example |
|------------|------------|---------|
| Cafe | 1.5x | Coffee shops |
| Asian | 1.4x | Thai, Vietnamese, Chinese |
| Restaurant | 1.3x | Sit-down restaurants |
| Deli | 1.2x | Sandwich shops |

### Less Healthy (Small Bonuses)

| Venue Type | Multiplier | Example |
|------------|------------|---------|
| Brewery | 1.0x | Brewpubs |
| Pizza | 0.8x | Pizza places |
| Ice Cream | 0.7x | Ice cream shops |
| Fast Food | 0.5x | McDonald's, Burger King |
| Burger | 0.5x | Burger joints |
| Fried Chicken | 0.4x | KFC, Popeyes |
| Donut | 0.4x | Donut shops |

### Bonus Calculation

```
Base Bonus: 5-25 EXC (random)
Final Bonus = Base Bonus × Venue Multiplier

Example - Healthy Choice:
- Base roll: 15 EXC
- Venue: Salad Bar (2.5x)
- Final: 37.5 EXC per person

Example - Unhealthy Choice:
- Base roll: 15 EXC
- Venue: Fast Food (0.5x)
- Final: 7.5 EXC per person

DIFFERENCE: 5X more for choosing salad over burger!
```

---

## API Reference

### Check Eligibility

```
GET /api/rest-stop/check?sessionId=xxx&latitude=40.7&longitude=-74.0&venueName=Subway&venueType=fast_food
```

Response:
```json
{
  "success": true,
  "eligible": true,
  "message": "You're eligible for a rest stop bonus!"
}
```

### Claim Bonus

```
POST /api/rest-stop/claim
{
  "sessionId": "...",
  "friendUserId": "...",
  "friendSessionId": "...",
  "venue": {
    "name": "Subway",
    "type": "fast_food",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "placeId": "ChIJ..."
  }
}
```

Response:
```json
{
  "success": true,
  "bonus": {
    "id": "...",
    "totalBonus": 20,
    "perPersonBonus": 10,
    "venueMultiplier": 1.0,
    "message": "Refueling after your workout! Smart choice!",
    "venue": {
      "name": "Subway",
      "type": "fast_food"
    }
  }
}
```

### Get Bonus History

```
GET /api/rest-stop/history?limit=20
```

---

## Configuration

Settings in `server/src/config/tokenomics.js`:

```javascript
REST_STOP: {
  ENABLED: true,
  MIN_EXERCISE_MINUTES: 15,    // Minimum exercise before bonus
  MIN_REST_MINUTES: 5,         // Minimum time stopped
  MAX_REST_MINUTES: 60,        // Maximum window to claim
  VENUE_RADIUS_METERS: 50,     // How close users must be

  MIN_BONUS: 5,                // Minimum bonus amount
  MAX_BONUS: 25,               // Maximum bonus amount

  // HEALTHY CHOICES = BIG BONUSES!
  VENUE_MULTIPLIERS: {
    // Healthy options (3.0x - 1.7x)
    health_food: 3.0,
    juice_bar: 2.8,
    salad_bar: 2.5,
    vegetarian: 2.5,
    poke_bowl: 2.3,
    acai: 2.3,
    organic: 2.5,
    mediterranean: 1.8,
    sushi: 1.7,

    // Moderate options (1.5x - 1.2x)
    cafe: 1.5,
    asian: 1.4,
    restaurant: 1.3,
    deli: 1.2,

    // Less healthy (1.0x - 0.4x)
    brewery: 1.0,
    pizza: 0.8,
    ice_cream: 0.7,
    fast_food: 0.5,
    burger: 0.5,
    fried_chicken: 0.4,
    donut: 0.4,

    default: 0.8
  },

  COOLDOWN_HOURS: 4            // Hours between bonuses
}
```

---

## Database Schema

### RestStopBonus Model

```javascript
{
  users: [{
    userId: ObjectId,
    sessionId: ObjectId,
    exerciseMinutes: Number,
    bonusReceived: Number
  }],
  venue: {
    name: String,
    type: String,
    location: {
      type: 'Point',
      coordinates: [Number]
    },
    placeId: String
  },
  totalBonus: Number,
  venueMultiplier: Number,
  message: String,
  status: 'pending' | 'awarded' | 'expired' | 'invalid',
  claimedAt: Date
}
```
