# 🏆 Achievements System

> *Unlock badges, hit milestones, and show off your fitness journey!*

The Achievements System gamifies your exercise routine with unlockable badges and rewards.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Achievement Categories](#-achievement-categories)
- [Achievement List](#-achievement-list)
- [Progress Tracking](#-progress-tracking)
- [Rewards](#-rewards)
- [API Reference](#-api-reference)

---

## 🌟 Overview

Achievements are unlocked automatically as you use Exercise Coin. Each achievement represents a milestone in your fitness journey!

### Achievement Properties

| Property | Description |
|----------|-------------|
| 🏷️ **Name** | Achievement title |
| 📝 **Description** | How to unlock it |
| 🎨 **Icon** | Visual badge |
| 📊 **Progress** | Current vs required |
| 💰 **Reward** | Bonus coins (if any) |
| 🔓 **Status** | Locked/Unlocked |

---

## 📂 Achievement Categories

### 🏃 Exercise Achievements

Based on your physical activity and exercise sessions.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🐣 **First Steps** | Complete 1 session | Badge |
| 🔟 **Getting Started** | Complete 10 sessions | 0.5 EXC |
| 💯 **Century Club** | Complete 100 sessions | 5.0 EXC |
| 🏅 **Exercise Elite** | Complete 500 sessions | 25.0 EXC |
| 👑 **Fitness Legend** | Complete 1000 sessions | 100.0 EXC |

### 📅 Streak Achievements

Based on consecutive days of exercise.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 📅 **Week Warrior** | 7-day streak | 1.0 EXC |
| 📆 **Monthly Master** | 30-day streak | 10.0 EXC |
| 🗓️ **Quarterly Queen** | 90-day streak | 50.0 EXC |
| 📖 **Year of Gains** | 365-day streak | 500.0 EXC |

### 📏 Distance Achievements

Based on total distance walked/run.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🚶 **First Mile** | Walk 1.6 km | Badge |
| 🏃 **5K Complete** | Walk 5 km total | 0.5 EXC |
| 🏃‍♂️ **10K Runner** | Walk 10 km total | 1.0 EXC |
| 🥇 **Half Marathon** | Walk 21.1 km total | 5.0 EXC |
| 🏅 **Marathon Master** | Walk 42.2 km total | 15.0 EXC |
| 🌍 **Ultramarathon** | Walk 100 km total | 50.0 EXC |

### 💰 Earning Achievements

Based on coins earned through exercise.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🌱 **First Coin** | Earn 1 EXC | Badge |
| 💵 **Ten Stack** | Earn 10 EXC | 0.5 EXC |
| 💰 **Hundred Club** | Earn 100 EXC | 5.0 EXC |
| 💎 **Thousandaire** | Earn 1000 EXC | 50.0 EXC |

### 🗺️ Treasure Achievements

Based on treasure hunting activities.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🔍 **Treasure Finder** | Collect 1 treasure | Badge |
| 🗺️ **Treasure Hunter** | Collect 10 treasures | 1.0 EXC |
| 💎 **Treasure Master** | Collect 50 treasures | 10.0 EXC |
| 🎁 **Generous Soul** | Drop 10 treasures | 2.0 EXC |
| 🎄 **Gift Giver** | Drop 50 treasures | 15.0 EXC |

### 🤝 Social Achievements

Based on transfers and social interactions.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 💸 **First Transfer** | Send 1 transfer | Badge |
| 🤝 **Social Butterfly** | Send 50 transfers | 5.0 EXC |
| 🌐 **Network Builder** | Send 200 transfers | 25.0 EXC |
| 🤗 **Friendly Hiker** | Complete 10 friendly transfers | 10.0 EXC |

### ⏰ Time-Based Achievements

Based on when you exercise.

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| 🌅 **Early Bird** | Exercise before 6 AM | Badge |
| 🌙 **Night Owl** | Exercise after 10 PM | Badge |
| 🌞 **Lunch Break Legend** | Exercise at noon (11-1) | Badge |
| 📅 **Weekend Warrior** | Exercise on Sat & Sun same week | 0.5 EXC |

---

## 📊 Progress Tracking

### Progress Display

```
┌─────────────────────────────────────────────────────────┐
│  🏃 Marathon Master                                     │
│  ═══════════════════════════════░░░░░░░░░░░░░░░░░░░░   │
│  35.2 km / 42.2 km                              83%    │
│  Walk the total distance of a marathon                 │
│                                                         │
│  🔓 Status: Locked                                      │
│  💰 Reward: 15.0 EXC                                    │
└─────────────────────────────────────────────────────────┘
```

### Code Example

```javascript
// Get all achievements with progress
const response = await api.get('/achievements');

// Response
{
  "success": true,
  "achievements": [
    {
      "key": "first_steps",
      "name": "First Steps",
      "description": "Complete your first exercise session",
      "icon": "🐣",
      "category": "exercise",
      "progress": 1,
      "target": 1,
      "completed": true,
      "completedAt": "2024-01-10T08:30:00Z",
      "reward": null
    },
    {
      "key": "marathon_master",
      "name": "Marathon Master",
      "description": "Walk the total distance of a marathon",
      "icon": "🏅",
      "category": "distance",
      "progress": 35200,
      "target": 42195,
      "completed": false,
      "reward": 15.0
    }
  ],
  "stats": {
    "totalUnlocked": 8,
    "totalAchievements": 25,
    "totalRewardsEarned": 12.5
  }
}
```

---

## 🎁 Rewards

### Reward Types

| Type | Description |
|------|-------------|
| 🏅 **Badge Only** | Visual achievement, no coins |
| 💰 **Badge + Coins** | Achievement plus coin bonus |

### Reward Claiming

Rewards are **automatically claimed** when you unlock an achievement:

1. ✅ Achievement unlocked
2. 💰 Coins added to wallet
3. 📝 Transaction recorded
4. 🔔 Notification sent

### Transaction Record

```javascript
{
  userId: "user_123",
  type: "achievement_reward",
  amount: 15.0,
  status: "confirmed",
  metadata: {
    type: "achievement",
    achievementKey: "marathon_master",
    achievementName: "Marathon Master"
  }
}
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/achievements` | Get all achievements with progress |
| `GET` | `/api/achievements/:key` | Get specific achievement |
| `GET` | `/api/achievements/unlocked` | Get only unlocked achievements |
| `GET` | `/api/achievements/stats` | Get achievement statistics |

### Get All Achievements

```http
GET /api/achievements
Authorization: Bearer <token>
```

### Get Achievement Stats

```http
GET /api/achievements/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "stats": {
    "totalUnlocked": 8,
    "totalAchievements": 25,
    "percentComplete": 32,
    "totalRewardsEarned": 12.5,
    "nextAchievements": [
      {
        "key": "marathon_master",
        "name": "Marathon Master",
        "progress": 83
      }
    ]
  }
}
```

---

## 🎮 Tips for Unlocking

### Quick Wins

| Achievement | Strategy |
|-------------|----------|
| 🐣 First Steps | Just start! |
| 🌅 Early Bird | Morning walk |
| 🌙 Night Owl | Evening jog |
| 💸 First Transfer | Send 0.01 to a friend |

### Long-Term Goals

| Achievement | Strategy |
|-------------|----------|
| 📅 Week Warrior | Set daily reminder |
| 🏅 Marathon Master | Track daily distance |
| 👑 Fitness Legend | Consistency is key |
| 🗓️ Year of Gains | Never miss a day! |

### Hidden Achievements

Some achievements aren't revealed until unlocked! Keep exploring to discover them all! 🔍

---

## 🎨 Achievement Badge Display

Unlocked achievements can be displayed on your profile:

```
┌─────────────────────────────────────────────────────────┐
│  @fitnessfan's Achievements                             │
│                                                         │
│  🐣 🔟 💯 📅 🚶 🏃 🥇 💵                                  │
│                                                         │
│  8 of 25 unlocked (32%)                                │
└─────────────────────────────────────────────────────────┘
```

---

<p align="center">
  <em>Collect them all! 🏆</em>
</p>
