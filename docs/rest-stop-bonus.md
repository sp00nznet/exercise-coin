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

### Bonus Message

When successful, users see a fun message based on the venue:

| Venue Type | Example Message |
|------------|-----------------|
| Fast Food | "Refueling after your workout! Smart choice!" |
| Cafe | "Coffee break! You've earned it after that workout!" |
| Restaurant | "A proper sit-down meal after exercise - well deserved!" |
| Health Food | "AMAZING! Healthy food after exercise - you're doing it right!" |
| Brewery | "Post-hike beers are the best beers!" |
| Ice Cream | "Ice cream reward for all that exercise!" |

---

## Venue Types

Different venue types have different bonus multipliers:

| Venue Type | Multiplier | Example |
|------------|------------|---------|
| Fast Food | 1.0x | McDonald's, Subway |
| Cafe | 1.2x | Starbucks, local cafes |
| Ice Cream | 1.1x | Baskin Robbins |
| Brewery | 1.3x | Local brewpubs |
| Restaurant | 1.5x | Sit-down restaurants |
| Health Food | 2.0x | Whole Foods, salad bars |

### Bonus Calculation

```
Base Bonus: 5-25 EXC (random)
Final Bonus = Base Bonus × Venue Multiplier

Example:
- Base roll: 15 EXC
- Venue: Health Food (2.0x)
- Final: 30 EXC per person
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

  VENUE_MULTIPLIERS: {
    fast_food: 1.0,
    cafe: 1.2,
    restaurant: 1.5,
    health_food: 2.0,
    brewery: 1.3,
    ice_cream: 1.1
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
