# Exchange System

Complete guide for the Exercise Coin exchange platform.

## Table of Contents

- [Overview](#overview)
- [User Features](#user-features)
- [Admin Portal](#admin-portal)
- [API Reference](#api-reference)
- [Security](#security)

---

## Overview

The Exercise Coin Exchange allows users to trade their earned EXC for other cryptocurrencies and fiat currencies. The exchange is fully managed by administrators who control wallet addresses and set exchange rates.

### Key Features

| Feature | Description |
|---------|-------------|
| Multi-Currency | Support for BTC, ETH, LTC, USD, and more |
| Admin Control | Wallet addresses and rates set by admin |
| Order System | Buy/sell orders with status tracking |
| Low Fees | Only 1% trading fee |
| Real-time Rates | Admin-updated exchange rates |

---

## User Features

### Viewing Markets

Users can browse all available trading pairs:

```
GET /api/exchange/currencies
```

Response includes:
- Currency code and name
- Current exchange rate
- Min/max trade limits
- Currency type (crypto/fiat)

### Getting Exchange Rates

```
GET /api/exchange/rate/:currency
```

Returns:
- Current rate (1 EXC = X currency)
- Inverse rate (X currency = 1 EXC)
- Last update timestamp

### Creating Orders

#### Buy Order (Buy EXC with other currency)

```
POST /api/exchange/user/buy
{
  "currency": "BTC",
  "excAmount": 100
}
```

Response includes:
- Payment address to send funds to
- Amount to send
- Order ID for tracking

#### Sell Order (Sell EXC for other currency)

```
POST /api/exchange/user/sell
{
  "currency": "BTC",
  "excAmount": 100,
  "externalWalletAddress": "bc1q..."
}
```

For sell orders:
- EXC is immediately deducted from user wallet
- Admin processes and sends currency to user's wallet
- If cancelled/failed, EXC is refunded

### Order Status Flow

```
pending -> processing -> completed
                     -> failed
       -> cancelled
```

### Viewing Orders

```
GET /api/exchange/user/orders?status=pending&limit=20
```

### Cancelling Orders

```
DELETE /api/exchange/user/orders/:orderId
```

Only pending orders can be cancelled. For sell orders, EXC is automatically refunded.

---

## Admin Portal

Access the admin portal at `/admin` in the exchange app.

### Dashboard

The dashboard shows:
- Active currencies count
- Pending orders requiring action
- Total order statistics
- Recent orders list

### Managing Wallets

#### Add New Currency

1. Navigate to Wallets page
2. Click "Add Currency"
3. Fill in details:
   - Currency code (BTC, ETH, etc.)
   - Display name
   - Wallet address (where users send funds)
   - Currency type (crypto/fiat)
   - Network (optional, e.g., "mainnet", "polygon")
   - Exchange rate
   - Trade limits
   - Decimal precision

#### Update Exchange Rate

Rates can be updated inline from the wallet card or via edit modal.

```
PUT /api/exchange/admin/rate/:currency
{
  "exchangeRate": 0.00001
}
```

#### Delete Currency

Currencies with pending orders cannot be deleted.

### Processing Orders

#### Order List

Filter by status:
- All
- Pending (needs action)
- Processing (in progress)
- Completed
- Cancelled
- Failed

#### Processing an Order

1. Click "Process" on a pending order
2. Choose action:
   - **Mark Processing**: Indicate work in progress
   - **Complete**: Finalize the order
   - **Fail**: Mark as failed (refunds sell orders)

3. For completed sell orders, optionally add transaction hash

#### Buy Orders

When completing a buy order:
- User's EXC balance is credited (minus fee)
- Transaction record is created

#### Sell Orders

When completing a sell order:
- Confirms the external transfer was made
- Transaction marked as confirmed

When failing a sell order:
- User's EXC is automatically refunded

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exchange/currencies` | List available currencies |
| GET | `/api/exchange/rate/:currency` | Get exchange rate |

### User Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exchange/user/orders` | Get order history |
| POST | `/api/exchange/user/buy` | Create buy order |
| POST | `/api/exchange/user/sell` | Create sell order |
| DELETE | `/api/exchange/user/orders/:id` | Cancel order |

### Admin Endpoints (Admin Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exchange/admin/wallets` | List all wallets |
| POST | `/api/exchange/admin/wallets` | Create/update wallet |
| PUT | `/api/exchange/admin/rate/:currency` | Update rate |
| DELETE | `/api/exchange/admin/wallets/:currency` | Delete wallet |
| GET | `/api/exchange/admin/orders` | List all orders |
| POST | `/api/exchange/admin/orders/:id/process` | Process order |

---

## Security

### Rate Limits

Exchange endpoints are rate-limited:
- 100 requests per 15 minutes per IP

### Order Validation

- Minimum trade amounts enforced
- Maximum trade amounts enforced
- Sell orders validate sufficient balance
- External wallet addresses required for sells

### Admin Actions

- All admin actions logged
- Order processing tracked with admin ID
- Transaction hashes stored for audit

### Wallet Security

- Admin-controlled wallet addresses only
- No automatic withdrawals
- Manual admin review for all orders

---

## Configuration

### Tokenomics Settings

In `server/src/config/tokenomics.js`:

```javascript
EXCHANGE: {
  MIN_TRADE_AMOUNT: 1,      // Minimum EXC per trade
  MAX_TRADE_AMOUNT: 10000,  // Maximum EXC per trade
  TRADE_FEE_PERCENT: 1.0,   // 1% trading fee
  WITHDRAWAL_FEE_PERCENT: 0.5  // 0.5% withdrawal fee
}
```

### Environment Variables

```bash
# Server configuration
PORT=3000
MONGODB_URI=mongodb://localhost:27017/exercise-coin

# Admin portal runs on port 3002
```
