# API Reference

Complete API documentation for Exercise Coin server.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Exercise](#exercise)
  - [Wallet](#wallet)
  - [User](#user)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

**Base URL**: `http://localhost:3000/api`

All endpoints return JSON. Request bodies should be JSON with `Content-Type: application/json`.

### Response Format

Success responses:
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "error": "Error message",
  "details": [ ... ]  // Optional validation details
}
```

---

## Authentication

Most endpoints require authentication via JWT Bearer token.

### Getting a Token

Register or login to receive a token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Using the Token

Include in the `Authorization` header:

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Endpoints

### Auth

#### Register

Create a new user account.

```
POST /api/auth/register
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 8 characters |
| username | string | Yes | 3-30 alphanumeric characters |

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "username": "fituser"
  }'
```

**Response:**

```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "fituser",
    "walletAddress": "E7a8b9c..."
  }
}
```

---

#### Login

Authenticate an existing user.

```
POST /api/auth/login
```

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "fituser",
    "walletAddress": "E7a8b9c...",
    "totalCoinsEarned": 150.5,
    "totalExerciseSeconds": 7200,
    "totalSteps": 45000
  }
}
```

---

#### Get Profile

Get current user's profile.

```
GET /api/auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "fituser",
    "walletAddress": "E7a8b9c...",
    "totalCoinsEarned": 150.5,
    "totalExerciseSeconds": 7200,
    "totalSteps": 45000,
    "totalMiningSeconds": 3600,
    "daemonStatus": "running",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActiveAt": "2024-01-20T15:45:00Z"
  }
}
```

---

### Exercise

#### Start Session

Begin a new exercise tracking session.

```
POST /api/exercise/session/start
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Exercise session started",
  "sessionId": "507f1f77bcf86cd799439012",
  "startTime": "2024-01-20T15:45:00Z"
}
```

**Errors:**
- `400` - Active session already exists

---

#### Record Steps

Submit step data for an active session.

```
POST /api/exercise/session/steps
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sessionId | string | Yes | Active session ID |
| stepData | array | Yes | Array of step measurements |

**Step Data Format:**

```json
{
  "sessionId": "507f1f77bcf86cd799439012",
  "stepData": [
    {
      "timestamp": "2024-01-20T15:45:01Z",
      "stepCount": 2,
      "stepsPerSecond": 2.0
    },
    {
      "timestamp": "2024-01-20T15:45:02Z",
      "stepCount": 3,
      "stepsPerSecond": 2.5
    }
  ]
}
```

**Response:**

```json
{
  "message": "Step data recorded",
  "sessionId": "507f1f77bcf86cd799439012",
  "totalSteps": 156,
  "dataPoints": 78
}
```

---

#### End Session

Complete an exercise session and trigger reward calculation.

```
POST /api/exercise/session/end
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| sessionId | string | Yes |

**Response (Rewarded):**

```json
{
  "message": "Exercise session ended",
  "session": {
    "id": "507f1f77bcf86cd799439012",
    "status": "rewarded",
    "durationSeconds": 180,
    "totalSteps": 540,
    "isValidExercise": true,
    "validExerciseSeconds": 175,
    "miningTriggered": true,
    "miningDurationSeconds": 87,
    "coinsEarned": 50.0
  }
}
```

**Response (Invalid):**

```json
{
  "message": "Exercise session ended",
  "session": {
    "id": "507f1f77bcf86cd799439012",
    "status": "invalid",
    "durationSeconds": 45,
    "totalSteps": 90,
    "isValidExercise": false,
    "invalidReason": "Exercise duration too short. Need 60s consecutive, got 45s"
  }
}
```

---

#### Get Session History

Retrieve past exercise sessions.

```
GET /api/exercise/sessions
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 20 | Max sessions to return |
| offset | number | 0 | Pagination offset |

**Response:**

```json
{
  "sessions": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "startTime": "2024-01-20T15:45:00Z",
      "endTime": "2024-01-20T15:48:00Z",
      "status": "rewarded",
      "totalSteps": 540,
      "durationSeconds": 180,
      "coinsEarned": 50.0
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### Get Exercise Stats

Get aggregated exercise statistics.

```
GET /api/exercise/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "lifetime": {
    "totalExerciseSeconds": 7200,
    "totalSteps": 45000,
    "totalCoinsEarned": 150.5,
    "totalMiningSeconds": 3600
  },
  "today": {
    "sessions": 3,
    "steps": 5400,
    "exerciseSeconds": 1800,
    "coinsEarned": 25.0
  },
  "sessionBreakdown": [
    { "_id": "rewarded", "count": 42, "totalDuration": 6800 },
    { "_id": "invalid", "count": 3, "totalDuration": 400 }
  ]
}
```

---

### Wallet

#### Get Balance

Get wallet balance and address.

```
GET /api/wallet/balance
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "balance": 150.5,
  "pending": 0,
  "walletAddress": "E7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3"
}
```

---

#### Get Transactions

Retrieve transaction history.

```
GET /api/wallet/transactions
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 50 | Max transactions |
| offset | number | 0 | Pagination offset |
| type | string | - | Filter by type |

**Transaction Types:**
- `mining_reward` - Coins earned from exercise
- `transfer_in` - Received from another user
- `transfer_out` - Sent to another user
- `withdrawal` - Withdrawn to external wallet

**Response:**

```json
{
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "type": "mining_reward",
      "amount": 50.0,
      "status": "confirmed",
      "miningDurationSeconds": 87,
      "createdAt": "2024-01-20T15:48:00Z",
      "confirmedAt": "2024-01-20T15:48:30Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

#### Get Daemon Status

Check the status of your personal mining daemon.

```
GET /api/wallet/daemon/status
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "running",
  "daemonPort": 39339,
  "walletAddress": "E7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
  "miningActive": false
}
```

**Status Values:**
- `inactive` - Daemon not started
- `starting` - Daemon initializing
- `running` - Daemon operational
- `stopped` - Daemon stopped
- `error` - Daemon encountered an error

---

### User

#### Get Dashboard

Get comprehensive dashboard data.

```
GET /api/user/dashboard
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "user": {
    "username": "fituser",
    "walletAddress": "E7a8b9c...",
    "totalCoinsEarned": 150.5,
    "totalSteps": 45000,
    "memberSince": "2024-01-01T00:00:00Z"
  },
  "today": {
    "sessions": 3,
    "steps": 5400,
    "exerciseMinutes": 30,
    "coinsEarned": 25.0
  },
  "weekly": {
    "sessions": 15,
    "steps": 32000,
    "exerciseMinutes": 180,
    "coinsEarned": 120.0
  },
  "recentSessions": [ ... ],
  "recentTransactions": [ ... ]
}
```

---

#### Get Leaderboard

Get top earners.

```
GET /api/user/leaderboard
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | all | `all`, `today`, `week`, `month` |
| limit | number | 10 | Max entries |

**Response:**

```json
{
  "leaderboard": [
    {
      "username": "toprunner",
      "totalCoinsEarned": 5420.5,
      "totalSteps": 2340000
    },
    {
      "username": "fituser",
      "totalCoinsEarned": 150.5,
      "totalSteps": 45000
    }
  ],
  "period": "all"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/expired token |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "\"email\" must be a valid email" },
    { "field": "password", "message": "\"password\" length must be at least 8" }
  ]
}
```

---

## Rate Limiting

API requests are rate limited to prevent abuse.

**Default Limits:**
- 100 requests per 15 minutes per IP

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705764000
```

**When Exceeded:**

```json
{
  "error": "Too many requests, please try again later."
}
```
