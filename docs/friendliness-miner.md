# 🤗 Friendliness Miner

> *Trade coins while hiking together and earn bonus rewards!*

The Friendliness Miner is a unique social feature that rewards users who make coin transfers while both parties are actively exercising.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [How It Works](#-how-it-works)
- [Eligibility](#-eligibility)
- [Bonus Distribution](#-bonus-distribution)
- [Technical Details](#-technical-details)
- [FAQ](#-faq)

---

## 🌟 Overview

The Friendliness Miner encourages social interactions during exercise by rewarding users who trade coins while both are hiking, walking, or running!

### The Concept

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🏃 You're on a hike with a friend                      │
│         ↓                                               │
│  📱 Both have Exercise Coin tracking steps              │
│         ↓                                               │
│  💸 You send them some coins (or scan their QR)         │
│         ↓                                               │
│  ✨ System detects BOTH users are exercising            │
│         ↓                                               │
│  📝 Transfer recorded as "Friendly Transfer"            │
│         ↓                                               │
│  🎰 Weekly lottery for bonus coins!                     │
│         ↓                                               │
│  💰 30% chance BOTH users get bonus!                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Why "Friendliness"?

The name reflects what this feature encourages:
- 👥 **Social interaction** during exercise
- 🤝 **Meeting fellow hikers** on trails
- 🎁 **Generosity** through in-person transfers
- 💪 **Accountability partners** exercising together

---

## ⚙️ How It Works

### Step 1: The Transfer

Make a transfer while both users are actively exercising:

| Method | Works? | Best For |
|--------|--------|----------|
| 📱 QR Code | ✅ Yes | In-person at trail summit |
| 👤 By Username | ✅ Yes | Remote friends exercising |
| 🗺️ Treasure Drop | ❌ No | Not eligible (one-way) |

### Step 2: Detection

The system automatically checks:

```javascript
// Both users must have active or recent exercise sessions
const senderSession = await getActiveSession(senderId);
const receiverSession = await getActiveSession(receiverId);

if (senderSession && receiverSession) {
  // 🎉 This is a Friendly Transfer!
  await recordFriendlyTransfer(transfer, senderSession, receiverSession);
}
```

### Step 3: Recording

The transfer is saved with exercise session data:

```javascript
{
  transferId: "tx_abc123",
  fromUserId: "user_sender",
  toUserId: "user_receiver",
  transferAmount: 1.0,
  fromUserSessionId: "sess_sender",
  toUserSessionId: "sess_receiver",
  weekNumber: 2,
  year: 2024,
  bonusAwarded: false
}
```

### Step 4: Weekly Bonus Distribution

Every **Saturday at midnight UTC**, the Friendliness Daemon:

1. ⛏️ Mines coins for ~20 minutes
2. 📋 Loads all eligible friendly transfers from the week
3. 🎲 Rolls 30% chance for each transfer
4. 💰 Distributes bonus to both sender AND receiver

---

## ✅ Eligibility

### User Requirements

To be eligible for the friendliness bonus:

| Requirement | Value | Why |
|-------------|-------|-----|
| 📱 **App Active** | Yes | Must be tracking |
| 🏃 **Exercise Session** | Active or recent | Proves physical activity |
| ⏱️ **Valid Duration** | ≥60 seconds | Anti-fraud measure |
| 🕐 **Recency** | Within 10 minutes | Still "in the zone" |

### Session Status Eligibility

| Session Status | Eligible? |
|----------------|-----------|
| 🟢 **Active** | ✅ Yes |
| ✅ **Rewarded** (within 10 min) | ✅ Yes |
| ✅ **Completed** + mining triggered (within 10 min) | ✅ Yes |
| ❌ **Completed** (>10 min ago) | ❌ No |
| ❌ **Invalid** | ❌ No |

### Transfer Requirements

| Requirement | Description |
|-------------|-------------|
| ✅ **Completed** | Transfer must succeed |
| 👤 **Two Users** | Can't be self-transfer |
| 💰 **Any Amount** | No minimum amount |

---

## 🎰 Bonus Distribution

### The Weekly Daemon

The Friendliness Daemon runs every **Saturday at 00:00 UTC**.

```
┌─────────────────────────────────────────────────────────┐
│           FRIENDLINESS DAEMON - SATURDAY                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  00:00 UTC │ ⏰ Daemon starts                           │
│            │                                            │
│  00:00     │ ⛏️ Begin mining (~20 minutes)              │
│            │                                            │
│  00:20     │ 💰 Mining complete, coins ready            │
│            │                                            │
│  00:20     │ 📋 Load this week's friendly transfers     │
│            │                                            │
│  00:21     │ 🎲 Roll 30% chance for each                │
│            │                                            │
│  00:22     │ 💸 Distribute bonuses to winners           │
│            │                                            │
│  00:23     │ ✅ Complete! Daemon sleeps until next week │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Bonus Calculation

```javascript
// Configuration
const BONUS_CHANCE = 0.3;        // 30% chance
const MIN_BONUS = 0.1;           // Minimum 0.1 EXC
const MAX_BONUS = 1.0;           // Maximum 1.0 EXC

// For each friendly transfer
if (Math.random() < BONUS_CHANCE) {
  const bonusAmount = MIN_BONUS + Math.random() * (MAX_BONUS - MIN_BONUS);

  // BOTH users get the same bonus!
  await awardBonus(transfer.fromUserId, bonusAmount);
  await awardBonus(transfer.toUserId, bonusAmount);
}
```

### Bonus Amounts

| Stat | Value |
|------|-------|
| 🎯 **Chance** | 30% per transfer |
| 💵 **Minimum** | 0.1 EXC |
| 💰 **Maximum** | 1.0 EXC |
| 👥 **Recipients** | BOTH users |
| 🔁 **Distribution** | Equal amounts |

---

## 🔧 Technical Details

### Data Model

```javascript
// FriendlyTransfer Schema
{
  transferId: ObjectId,           // Original transfer
  fromUserId: ObjectId,           // Sender
  toUserId: ObjectId,             // Receiver
  transferAmount: Number,         // Original amount
  fromUserSessionId: ObjectId,    // Sender's exercise session
  toUserSessionId: ObjectId,      // Receiver's exercise session
  location: {                     // Optional GPS
    type: "Point",
    coordinates: [lng, lat]
  },
  weekNumber: Number,             // ISO week number
  year: Number,                   // Year
  bonusAwarded: Boolean,          // Has bonus been given?
  bonusAmount: Number,            // Amount if awarded
  processedAt: Date               // When processed
}
```

### Daemon Schedule

```javascript
// Cron expression: Every Saturday at midnight UTC
const schedule = '0 0 * * 6';  // minute hour * * dayOfWeek (6 = Saturday)

// Check on startup
const now = new Date();
if (now.getUTCDay() === 6 && now.getUTCHours() === 0) {
  // It's Saturday midnight! Run immediately.
  this.runWeeklyMining();
}

// Schedule for next occurrence
cron.schedule(schedule, () => this.runWeeklyMining());
```

### Active Session Detection

```javascript
static async getActiveExerciseSession(userId) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const session = await ExerciseSession.findOne({
    userId,
    $or: [
      { status: 'active' },
      { status: 'rewarded', endTime: { $gte: tenMinutesAgo } },
      { status: 'completed', endTime: { $gte: tenMinutesAgo }, miningTriggered: true }
    ]
  }).sort({ createdAt: -1 });

  // Must have at least 60 seconds of valid exercise
  if (session && session.validExerciseSeconds >= 60) {
    return session;
  }
  return null;
}
```

---

## ❓ FAQ

### General Questions

**Q: Do both users need the app open?**
> A: Both users need to have an active or recently completed exercise session. The app doesn't need to be in the foreground, but step tracking must be active.

**Q: Can I get multiple bonuses per week?**
> A: Yes! Each friendly transfer has an independent 30% chance. More transfers = more chances!

**Q: Does the transfer amount affect bonus size?**
> A: No, bonus amount is random between 0.1-1.0 EXC regardless of transfer size.

### Eligibility Questions

**Q: My friend and I were hiking but didn't get the bonus. Why?**
> A: The bonus has a 30% chance. You might not win every time, but you'll be entered in next week's draw for future transfers!

**Q: How recent does my exercise session need to be?**
> A: Within 10 minutes of ending. If you stopped tracking more than 10 minutes before the transfer, you won't be eligible.

**Q: Does the session need a minimum duration?**
> A: Yes, at least 60 seconds of valid exercise (meeting step rate requirements).

### Bonus Questions

**Q: When do I receive my bonus?**
> A: Bonuses are distributed every Saturday at midnight UTC. Check your wallet on Saturday morning!

**Q: Can I see my pending friendly transfers?**
> A: Yes! The transfer confirmation will show `friendlyBonus: true` if the transfer qualified. Final bonus status is visible in the admin portal.

**Q: What if I was the sender AND receiver in the same week?**
> A: Each transfer is independent. You could receive bonuses as both sender and receiver!

---

## 💡 Tips for Maximizing Bonuses

### Do's ✅

| Tip | Why |
|-----|-----|
| 🤳 **Use QR codes at summits** | Perfect moment for in-person transfers |
| 👥 **Exercise with friends** | More transfer opportunities |
| 📱 **Keep tracking active** | Don't stop too early |
| 💸 **Make multiple small transfers** | More lottery tickets! |

### Don'ts ❌

| Avoid | Why |
|-------|-----|
| 🛑 **Stopping tracking too early** | 10-minute window |
| 🏠 **Transferring from home** | Need active sessions |
| ⏰ **Waiting too long** | Session expires |

---

## 🎮 Example Scenario

```
┌─────────────────────────────────────────────────────────┐
│                 TRAIL SUMMIT SCENARIO                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌄 Saturday morning, 9 AM                              │
│                                                         │
│  Alice and Bob reach the summit after a 2-hour hike    │
│                                                         │
│  📱 Both apps show:                                     │
│     Alice: 7,423 steps, 2h 15m active session          │
│     Bob: 6,891 steps, 2h 10m active session            │
│                                                         │
│  💸 Alice sends Bob 5 EXC for winning their bet        │
│                                                         │
│  ✨ System detects both have active sessions!          │
│     → Recorded as Friendly Transfer                    │
│                                                         │
│  🗓️ Next Saturday at midnight:                         │
│     → 30% roll... SUCCESS! 🎉                          │
│     → Alice gets 0.47 EXC bonus                        │
│     → Bob gets 0.47 EXC bonus                          │
│                                                         │
│  💰 Both win for hiking together!                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

<p align="center">
  <em>Hike together, earn together! 🤗💰</em>
</p>
