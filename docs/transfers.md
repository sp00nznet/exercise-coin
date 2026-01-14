# 💸 Transfer System

> *Send coins to friends, family, or fellow fitness enthusiasts!*

The Transfer System enables peer-to-peer coin transfers with multiple convenient methods.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Direct Transfers](#-direct-transfers)
- [QR Code Transfers](#-qr-code-transfers)
- [Transfer History](#-transfer-history)
- [API Reference](#-api-reference)
- [Security](#-security)

---

## 🌟 Overview

Exercise Coin supports three transfer methods:

| Method | Best For | Speed |
|--------|----------|-------|
| 👤 **By Username** | Remote friends | Instant |
| 📱 **QR Generate** | In-person giving | Instant on claim |
| 📷 **QR Scan** | In-person receiving | Instant |

---

## 👤 Direct Transfers

Send coins instantly to any user by their username.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                  DIRECT TRANSFER                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 Enter username     →    💰 Enter amount             │
│         ↓                          ↓                    │
│  💬 Add message (opt)  →    ✅ Confirm                  │
│         ↓                          ↓                    │
│  🔄 Processing         →    🎉 Complete!                │
│                                                         │
│  Sender: -0.5 EXC      →    Receiver: +0.5 EXC         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Usage

1. Navigate to **Send Coins** screen
2. Select **By Username** tab
3. Enter recipient's username
4. Enter amount to send
5. Add optional message
6. Tap **Send**

### Code Example

```javascript
// Send coins to a user
const response = await api.post('/transfer/send', {
  toUsername: 'fitnessfriend',
  amount: 1.0,
  message: 'Thanks for the workout tips! 💪'
});

// Response
{
  "success": true,
  "transfer": {
    "id": "tx_abc123",
    "amount": 1.0,
    "toUsername": "fitnessfriend",
    "message": "Thanks for the workout tips! 💪",
    "friendlyBonus": false
  }
}
```

---

## 📱 QR Code Transfers

Perfect for in-person transfers without needing to know usernames!

### Creating a QR Transfer

```
┌─────────────────────────────────────────────────────────┐
│                 QR TRANSFER FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SENDER:                                                │
│  💰 Enter amount       →    📱 QR code generated        │
│         ↓                          ↓                    │
│  ⏰ Coins held in escrow    🎫 Claim code created       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  RECEIVER:                                              │
│  📷 Scan QR code       →    ✅ Coins received!          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### QR Code Contents

```json
{
  "type": "exc_transfer",
  "code": "CLAIM-ABC123",
  "amount": 0.5
}
```

### Escrow System

When you create a QR transfer:

1. 💰 Coins are **deducted** from your wallet immediately
2. 🔒 Coins are held in **escrow** until claimed
3. ⏰ After expiry (24h default), coins are **refunded**

### Managing Pending Transfers

| Action | Result |
|--------|--------|
| ✅ **Claimed** | Coins go to recipient |
| ❌ **Cancelled** | Coins refunded to sender |
| ⏰ **Expired** | Coins automatically refunded |

### Code Example

```javascript
// Create QR transfer
const response = await api.post('/transfer/qr/create', {
  amount: 0.5,
  message: 'Coffee bet winner! ☕',
  expiresInHours: 24
});

// Response
{
  "success": true,
  "transfer": {
    "id": "tx_def456",
    "claimCode": "CLAIM-ABC123",
    "amount": 0.5,
    "expiresAt": "2024-01-15T12:00:00Z",
    "qrData": "{\"type\":\"exc_transfer\",\"code\":\"CLAIM-ABC123\",\"amount\":0.5}"
  }
}
```

### Claiming a QR Transfer

```javascript
// Claim via scanned code
const response = await api.post('/transfer/qr/claim', {
  claimCode: 'CLAIM-ABC123'
});

// Response
{
  "success": true,
  "amount": 0.5,
  "message": "Coffee bet winner! ☕",
  "fromUsername": "runner42",
  "friendlyBonus": true  // Both users were hiking!
}
```

---

## 🤗 Friendliness Bonus

When **both** users involved in a transfer are actively exercising, the transfer becomes eligible for the **Friendliness Bonus**!

### Detection Criteria

| Requirement | Description |
|-------------|-------------|
| 📱 **Active Session** | Both users have exercise tracking on |
| ⏱️ **Duration** | At least 60 seconds of valid exercise |
| 🕐 **Recent** | Session active or ended within 10 minutes |

### What Happens

```
┌─────────────────────────────────────────────────────────┐
│              FRIENDLY TRANSFER DETECTED! 🤗             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏃 Both users actively hiking                          │
│         ↓                                               │
│  💸 Transfer completes normally                         │
│         ↓                                               │
│  📝 Recorded as "Friendly Transfer"                     │
│         ↓                                               │
│  🎰 Eligible for weekly bonus lottery!                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

See [Friendliness Miner](friendliness-miner.md) for full bonus details.

---

## 📜 Transfer History

View all your past transfers in the app.

### History Entry Format

| Field | Description |
|-------|-------------|
| 📅 **Date** | When transfer occurred |
| ↔️ **Direction** | Sent or Received |
| 💰 **Amount** | Coins transferred |
| 👤 **Other User** | Username of other party |
| 🏷️ **Type** | Direct or QR |
| 💬 **Message** | Optional message |

### Code Example

```javascript
// Get transfer history
const response = await api.get('/transfer/history', {
  params: { limit: 20 }
});

// Response
{
  "success": true,
  "transfers": [
    {
      "id": "tx_abc123",
      "type": "sent",
      "amount": 1.0,
      "otherUser": "fitnessfriend",
      "transferType": "direct",
      "message": "Thanks!",
      "completedAt": "2024-01-14T10:30:00Z"
    },
    {
      "id": "tx_def456",
      "type": "received",
      "amount": 0.5,
      "otherUser": "runner42",
      "transferType": "qr_code",
      "message": "Coffee bet!",
      "completedAt": "2024-01-13T15:20:00Z"
    }
  ]
}
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transfer/send` | Direct transfer by username |
| `POST` | `/api/transfer/qr/create` | Create QR transfer |
| `POST` | `/api/transfer/qr/claim` | Claim QR transfer |
| `DELETE` | `/api/transfer/qr/:id` | Cancel pending QR transfer |
| `GET` | `/api/transfer/pending` | Get pending QR transfers |
| `GET` | `/api/transfer/history` | Get transfer history |

### Direct Transfer

```http
POST /api/transfer/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "toUsername": "fitnessfriend",
  "amount": 1.0,
  "message": "Great workout!",
  "location": {                    // Optional, for friendliness detection
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

### Create QR Transfer

```http
POST /api/transfer/qr/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 0.5,
  "message": "Scan me!",
  "expiresInHours": 24
}
```

### Claim QR Transfer

```http
POST /api/transfer/qr/claim
Content-Type: application/json
Authorization: Bearer <token>

{
  "claimCode": "CLAIM-ABC123"
}
```

---

## 🔒 Security

### Transfer Protections

| Protection | Description |
|------------|-------------|
| 🔐 **Authentication** | All transfers require valid JWT |
| 💰 **Balance Check** | Can't send more than you have |
| 🚫 **Self-Transfer** | Can't send to yourself |
| ⏰ **Expiration** | QR transfers auto-expire |
| 🔄 **Idempotency** | Duplicate claims rejected |

### Rate Limits

| Action | Limit |
|--------|-------|
| Direct transfers | 20/hour |
| QR creates | 10/hour |
| QR claims | 30/hour |

### Transaction Records

All transfers create permanent transaction records:

```javascript
// Transaction record for sender
{
  userId: "sender_id",
  type: "transfer_out",
  amount: -1.0,
  status: "confirmed",
  metadata: {
    type: "user_transfer",
    transferId: "tx_abc123",
    toUser: "recipient"
  }
}

// Transaction record for recipient
{
  userId: "recipient_id",
  type: "transfer_in",
  amount: 1.0,
  status: "confirmed",
  metadata: {
    type: "user_transfer",
    transferId: "tx_abc123",
    fromUser: "sender"
  }
}
```

---

## 💡 Tips

### Best Practices

- 📱 **In-person**: Use QR codes for instant face-to-face transfers
- 👤 **Remote friends**: Use username transfers
- 🏃 **While exercising**: Both get potential bonus coins!
- ⏰ **QR expiry**: Set appropriate expiration times

### Common Use Cases

| Scenario | Recommended Method |
|----------|-------------------|
| 🏆 Workout bet payoff | QR Code (in-person) |
| 🎂 Birthday gift | Direct by username |
| 🏃‍♂️ Trail meetup | QR Code + exercise bonus! |
| 👨‍👩‍👧 Family sharing | Direct by username |

---

<p align="center">
  <em>Share the gains! 💪</em>
</p>
