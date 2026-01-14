# 🗺️ Treasure System

> *Hide coins in the real world. Hunt for hidden treasure. Make exercise an adventure!*

The Treasure System adds a geocaching-style gameplay layer to Exercise Coin, encouraging users to explore new locations while staying active.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Geo-Drops](#-geo-drops)
- [Random Drops](#-random-drops)
- [Treasure Map](#-treasure-map)
- [Collection Mechanics](#-collection-mechanics)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)

---

## 🌟 Overview

The Treasure System consists of three main components:

| Component | Description |
|-----------|-------------|
| 🎁 **Geo-Drops** | User-created coin drops at real locations |
| 🎲 **Random Drops** | System-generated drops at exercise spots |
| 🗺️ **Treasure Map** | Visual interface to find nearby treasures |

---

## 🎁 Geo-Drops

Users can drop coins at their current GPS location for others to find!

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    GEO-DROP FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 User at location    →    💰 Drops coins             │
│         ↓                          ↓                    │
│  📝 Add message (opt)   →    🗺️ Appears on map          │
│         ↓                          ↓                    │
│  ⏰ Set expiry          →    🏃 Others discover it      │
│         ↓                          ↓                    │
│  ✅ Confirmed           →    🎉 Collected!              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Creating a Drop

1. **Navigate** to the Treasure Map screen
2. **Tap** "Drop Treasure" button
3. **Enter** the amount to drop (deducted from your wallet)
4. **Add** an optional message (e.g., "Summit surprise! 🏔️")
5. **Confirm** the drop

### Drop Properties

| Property | Description | Default |
|----------|-------------|---------|
| `amount` | Coins to drop | Required |
| `message` | Optional note | Empty |
| `expiresAt` | When drop expires | 7 days |
| `location` | GPS coordinates | Current position |

### Code Example

```javascript
// Creating a geo-drop
const response = await api.post('/treasure/drop', {
  amount: 0.5,
  message: "Found at the top of Eagle Peak!",
  latitude: 37.7749,
  longitude: -122.4194
});

// Response
{
  "success": true,
  "drop": {
    "id": "abc123",
    "amount": 0.5,
    "location": { "type": "Point", "coordinates": [-122.4194, 37.7749] },
    "expiresAt": "2024-01-15T00:00:00Z"
  }
}
```

---

## 🎲 Random Drops

Every **Sunday at midnight UTC**, the Random Drop Daemon distributes coins across exercise-friendly locations.

### How It Works

```
┌───────────────────────────────────────────────────────────────┐
│                 RANDOM DROP DAEMON                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 Sunday midnight     →    ⛏️ Mining starts (20 min)        │
│          ↓                          ↓                         │
│  🎯 Load drop zones     →    💰 Coins mined                   │
│          ↓                          ↓                         │
│  📍 Generate locations  →    🎁 Create drops                  │
│          ↓                          ↓                         │
│  🗺️ Notify users        →    🏃 Treasure hunt begins!         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Drop Zone Priority

Admin-configured drop zones affect where random drops appear:

| Priority | Weight | Description |
|----------|--------|-------------|
| 10 | Highest | Always included |
| 7-9 | High | Very likely |
| 4-6 | Medium | Standard chance |
| 1-3 | Low | Occasional |

### Location Selection

The daemon generates drop locations using:

1. **Configured Drop Zones** (if any active)
2. **Parks & Nature Reserves** from geographic data
3. **Popular Hiking Trails** from community data
4. **Random Points** within active zone boundaries

---

## 🗺️ Treasure Map

The in-app Treasure Map shows nearby drops using an interactive map interface.

### Map Features

| Feature | Description |
|---------|-------------|
| 📍 **Markers** | Show treasure locations |
| 🔴 **User drops** | Red markers (your drops) |
| 🟢 **System drops** | Green markers (random drops) |
| 🟡 **Other users** | Yellow markers |
| 📏 **Distance** | Shows how far each drop is |

### Marker Information

Tapping a marker shows:

```
┌─────────────────────────┐
│ 💰 0.5 EXC              │
│ 📍 250m away            │
│ ⏰ Expires in 3 days    │
│ 💬 "Hidden gem!"        │
│ ─────────────────────── │
│ [Navigate] [Collect]    │
└─────────────────────────┘
```

---

## 🎯 Collection Mechanics

### Collection Requirements

To collect a treasure drop:

| Requirement | Value | Description |
|-------------|-------|-------------|
| 📏 **Distance** | ≤100m | Must be within radius |
| 👤 **Ownership** | Not yours | Can't collect own drops |
| ⏰ **Expiry** | Not expired | Must still be active |
| 📱 **GPS Accuracy** | Good signal | Location must be reliable |

### Collection Flow

```javascript
// Attempting to collect
const response = await api.post('/treasure/collect', {
  dropId: 'abc123'
});

// Success response
{
  "success": true,
  "collected": {
    "amount": 0.5,
    "message": "Hidden gem!",
    "droppedBy": "mountaineer42"
  }
}

// Error response (too far)
{
  "success": false,
  "error": "Too far from treasure",
  "distance": 342,
  "requiredDistance": 100
}
```

### Expiration Handling

When a drop expires:
1. 🚫 Removed from map
2. 💰 Coins returned to dropper (user drops only)
3. 🔥 Destroyed (system drops only)

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/treasure/drop` | Create a new drop |
| `GET` | `/api/treasure/nearby` | Get drops near location |
| `POST` | `/api/treasure/collect` | Collect a drop |
| `GET` | `/api/treasure/my-drops` | User's active drops |
| `DELETE` | `/api/treasure/drop/:id` | Cancel a drop (refund) |

### Create Drop

```http
POST /api/treasure/drop
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 0.5,
  "message": "Summit surprise!",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "expiresInDays": 7
}
```

### Get Nearby

```http
GET /api/treasure/nearby?latitude=37.77&longitude=-122.41&radiusKm=5
Authorization: Bearer <token>
```

### Collect Drop

```http
POST /api/treasure/collect
Content-Type: application/json
Authorization: Bearer <token>

{
  "dropId": "abc123",
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Collection radius in meters
TREASURE_COLLECTION_RADIUS_METERS=100

# Default expiration for user drops (days)
TREASURE_DEFAULT_EXPIRY_DAYS=7

# System drop expiration (days)
TREASURE_SYSTEM_DROP_EXPIRY_DAYS=14

# Maximum drops per user
TREASURE_MAX_ACTIVE_DROPS_PER_USER=10

# Random drop daemon settings
RANDOM_DROP_MINING_DURATION_MINUTES=20
RANDOM_DROP_DAY_OF_WEEK=0  # Sunday
RANDOM_DROP_HOUR_UTC=0     # Midnight
```

### Database Schema

```javascript
// TreasureDrop model
{
  droppedBy: ObjectId,        // User who created (null for system)
  collectedBy: ObjectId,      // User who collected (null if active)
  amount: Number,             // Coin amount
  location: {
    type: "Point",
    coordinates: [lng, lat]   // GeoJSON format
  },
  message: String,
  dropType: "user" | "random",
  status: "active" | "collected" | "expired",
  expiresAt: Date,
  createdAt: Date,
  collectedAt: Date
}
```

---

## 🎮 Tips for Users

### Dropping Treasures

- 🏔️ Drop at scenic viewpoints for extra appreciation
- 💬 Leave encouraging messages for fellow exercisers
- 📍 Choose accessible but interesting locations
- ⏰ Longer expiry = more chance someone finds it

### Hunting Treasures

- 🗺️ Check the map before your workout for nearby drops
- 🥾 Plan routes that pass by multiple treasures
- 🔔 Enable notifications for new drops nearby
- 👥 Team up with friends for treasure hunts!

---

<p align="center">
  <em>Happy treasure hunting! 🎉</em>
</p>
