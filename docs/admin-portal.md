# 👑 Admin Portal

> *Monitor, manage, and moderate Exercise Coin from a powerful dashboard*

The Admin Portal provides comprehensive tools for system administrators to oversee all platform activities.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Getting Started](#-getting-started)
- [Dashboard](#-dashboard)
- [Monitoring](#-monitoring)
- [Drop Zones](#-drop-zones)
- [Reports](#-reports)
- [User Management](#-user-management)
- [Admin Roles](#-admin-roles)
- [API Reference](#-api-reference)

---

## 🌟 Overview

The Admin Portal is a React-based web application for platform administrators.

### Features at a Glance

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time platform statistics |
| 👁️ **Transaction Monitor** | View all transactions |
| 💸 **Transfer Monitor** | Track user-to-user transfers |
| 🗺️ **Treasure Map** | Visualize all drops |
| 🎯 **Drop Zones** | Configure treasure distribution |
| 📈 **Reports** | Generate downloadable reports |
| 👥 **User Management** | View and manage users |

---

## 🚀 Getting Started

### Installation

```bash
cd admin-portal
npm install
```

### Development

```bash
npm run dev
# Opens at http://localhost:3001
```

### Production Build

```bash
npm run build
npm run preview
```

### First Admin Account

Create your first admin via the server:

```javascript
// In server console or script
const Admin = require('./models/Admin');

const admin = new Admin({
  email: 'admin@exercisecoin.com',
  password: 'securepassword123',
  name: 'Super Admin',
  role: 'superadmin'
});

await admin.save();
```

---

## 📊 Dashboard

The dashboard provides an at-a-glance view of platform health.

### Statistics Cards

| Stat | Description |
|------|-------------|
| 👥 **Total Users** | Registered accounts |
| 💰 **Total Coins Mined** | All coins ever mined |
| 📝 **Total Transactions** | All transaction count |
| 🎁 **Active Treasure Drops** | Uncollected drops |
| 💸 **Total Transfers** | User-to-user transfers |
| 🤗 **Friendly Transfers** | This week's hiking trades |
| 🎯 **Active Drop Zones** | Configured zones |
| 🏃 **Exercise Sessions** | Total sessions |

### Recent Activity Feed

```
┌─────────────────────────────────────────────────────────┐
│  Recent Activity                                        │
├─────────────────────────────────────────────────────────┤
│  Time         Type           User        Amount  Status │
│  ──────────────────────────────────────────────────────│
│  10:30 AM     mining_reward  runner42    0.125   ✅     │
│  10:28 AM     transfer_out   fitfam      1.000   ✅     │
│  10:25 AM     treasure_collect hiker23   0.500   ✅     │
│  10:20 AM     mining_reward  walker99    0.080   ✅     │
└─────────────────────────────────────────────────────────┘
```

---

## 👁️ Monitoring

### Transaction Monitor

View and filter all platform transactions.

#### Filters Available

| Filter | Options |
|--------|---------|
| 📂 **Type** | Mining, Transfer, Treasure, Achievement |
| 📅 **Date Range** | Custom date selection |
| 👤 **User** | Filter by username |
| ✅ **Status** | Confirmed, Pending, Failed |

#### Transaction Details

```
┌─────────────────────────────────────────────────────────┐
│  Transaction Details                                    │
├─────────────────────────────────────────────────────────┤
│  ID:         tx_abc123def456                            │
│  Type:       mining_reward                              │
│  Amount:     +0.125 EXC                                 │
│  User:       runner42                                   │
│  Status:     ✅ Confirmed                               │
│  Date:       2024-01-14 10:30:00                        │
│  Metadata:   { session: "sess_xyz", duration: 120 }    │
└─────────────────────────────────────────────────────────┘
```

### Transfer Monitor

Track all user-to-user transfers with dedicated friendly transfer view.

#### Tabs

| Tab | Shows |
|-----|-------|
| 📋 **All Transfers** | Every transfer |
| 🤗 **Friendly Transfers** | Hiking trade bonuses |

#### Friendly Transfer View

```
┌─────────────────────────────────────────────────────────┐
│  Friendly Transfers This Week                           │
├─────────────────────────────────────────────────────────┤
│  From      To         Amount   Bonus    Bonus Amount   │
│  ──────────────────────────────────────────────────────│
│  hiker01   hiker02    1.00    ✅ Yes    0.35 EXC       │
│  runner42  walker99   0.50    ⏳ Pending  -            │
│  fitfam    gymrat     2.00    ✅ Yes    0.72 EXC       │
└─────────────────────────────────────────────────────────┘
```

### Treasure Map Monitor

Visualize all treasure drops on an interactive map.

#### Map Features

| Feature | Description |
|---------|-------------|
| 🟢 **Green markers** | Active drops |
| ⚫ **Gray markers** | Collected drops |
| 🔴 **Red markers** | Expired drops |
| 🔵 **Blue zones** | Configured drop zones |

#### Filter Options

- Show only active drops
- Show only system (random) drops
- Show only user drops
- Date range filtering

---

## 🎯 Drop Zones

Configure where random treasure drops appear.

### Zone Types

| Type | Description | Use Case |
|------|-------------|----------|
| 📮 **Zipcode** | Target by postal code | General area targeting |
| 📍 **Point + Radius** | Circle around a point | Specific location |
| 🔷 **Polygon** | Custom drawn area | Precise boundaries |

### Creating a Zipcode Zone

1. Click **Create Drop Zone**
2. Select **Zipcode** type
3. Enter zone name (e.g., "Downtown SF")
4. Enter zipcode (e.g., "94102")
5. Set priority (1-10)
6. Set min/max drop amounts
7. Click **Create**

### Creating a Point + Radius Zone

1. Click **Create Drop Zone**
2. Select **Point + Radius** type
3. Enter zone name
4. **Click on map** to set center point
5. Adjust radius slider (100m - 50km)
6. Set priority and amounts
7. Click **Create**

### Creating a Polygon Zone

1. Click **Create Drop Zone**
2. Select **Draw Area** type
3. **Click on map** to add vertices
4. Minimum 3 points required
5. Click **Clear Points** to restart
6. Set priority and amounts
7. Click **Create**

### Zone Properties

| Property | Description | Range |
|----------|-------------|-------|
| 🏷️ **Name** | Descriptive name | Required |
| ⭐ **Priority** | Drop weight | 1-10 |
| 💵 **Min Amount** | Minimum coins | 0.01+ |
| 💰 **Max Amount** | Maximum coins | 0.01+ |
| ✅ **Active** | Zone enabled | Yes/No |

---

## 📈 Reports

Generate downloadable CSV reports for analysis.

### Available Reports

| Report | Contents |
|--------|----------|
| 📝 **Transactions** | All transactions with metadata |
| 💸 **Transfers** | User-to-user transfer history |
| 🗺️ **Treasure** | All treasure drops and collections |

### Report Fields

#### Transaction Report
```csv
Date,User,Type,Amount,Status,Metadata
2024-01-14 10:30:00,runner42,mining_reward,0.125,confirmed,{"session":"sess_123"}
```

#### Transfer Report
```csv
Date,From,To,Amount,Type,Status
2024-01-14 10:28:00,fitfam,gymrat,1.000,direct,completed
```

#### Treasure Report
```csv
Date,Location,Amount,Type,Status,DroppedBy,CollectedBy
2024-01-14 09:00:00,"37.7749,-122.4194",0.500,user,collected,hiker01,hiker02
```

### Generating Reports

1. Navigate to **Reports** page
2. Select date range
3. Click **Download CSV** for desired report
4. File downloads automatically

---

## 👥 User Management

View and manage platform users.

### User List

| Column | Description |
|--------|-------------|
| 👤 **Username** | Account name |
| 📧 **Email** | Account email |
| 💰 **Balance** | Current coin balance |
| 🏃 **Sessions** | Total exercise sessions |
| 📅 **Joined** | Registration date |

### User Details Modal

Click **View Details** to see:

```
┌─────────────────────────────────────────────────────────┐
│  User Details                              [×]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Username:     runner42                                 │
│  Email:        runner42@email.com                       │
│  Balance:      45.250 EXC                               │
│  Wallet:       exc1q2w3e4r5t6y7u8i9o0p...              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📊 Statistics                                          │
│  ┌─────────────┬─────────────┬─────────────┐           │
│  │  Sessions   │  Mining     │  Transfers  │           │
│  │     142     │   45.2min   │  Sent: 23   │           │
│  │             │             │  Recv: 31   │           │
│  └─────────────┴─────────────┴─────────────┘           │
│                                                         │
│  📜 Recent Transactions                                 │
│  ──────────────────────────────────────────────────── │
│  2024-01-14  mining_reward   +0.125 EXC                │
│  2024-01-14  transfer_out    -1.000 EXC                │
│  2024-01-13  transfer_in     +0.500 EXC                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Admin Roles

### Role Types

| Role | Permissions |
|------|-------------|
| 👑 **Superadmin** | Full access + create admins |
| 👤 **Admin** | All monitoring + zone management |

### Superadmin Only Actions

- Create new admin accounts
- Delete admin accounts
- Modify admin roles

### Creating Admins (Superadmin)

```javascript
// POST /api/admin/admins
{
  "email": "newadmin@exercisecoin.com",
  "password": "securepassword",
  "name": "New Admin",
  "role": "admin"
}
```

---

## 📡 API Reference

### Authentication

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@exercisecoin.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "admin": {
    "id": "admin_123",
    "email": "admin@exercisecoin.com",
    "name": "Super Admin",
    "role": "superadmin"
  }
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/dashboard` | Dashboard stats |
| `GET` | `/api/admin/transactions` | Transaction list |
| `GET` | `/api/admin/transfers` | Transfer list |
| `GET` | `/api/admin/friendly-transfers` | Friendly transfers |
| `GET` | `/api/admin/treasure/drops` | Treasure drops |
| `GET` | `/api/admin/treasure/map` | Map data |
| `GET` | `/api/admin/drop-zones` | Get zones |
| `POST` | `/api/admin/drop-zones` | Create zone |
| `PUT` | `/api/admin/drop-zones/:id` | Update zone |
| `DELETE` | `/api/admin/drop-zones/:id` | Delete zone |
| `GET` | `/api/admin/users` | User list |
| `GET` | `/api/admin/users/:id` | User details |
| `GET` | `/api/admin/reports/transactions` | Transaction CSV |
| `GET` | `/api/admin/reports/transfers` | Transfer CSV |
| `GET` | `/api/admin/reports/treasure` | Treasure CSV |
| `POST` | `/api/admin/admins` | Create admin (superadmin) |

---

## 🔒 Security

### Access Control

- All routes require valid admin JWT
- Token expires after 24 hours
- Rate limited to prevent abuse

### Audit Logging

All admin actions are logged:

```javascript
{
  adminId: "admin_123",
  action: "create_drop_zone",
  details: { zoneName: "Park District" },
  timestamp: "2024-01-14T10:30:00Z",
  ip: "192.168.1.1"
}
```

---

<p align="center">
  <em>Great power, great responsibility! 👑</em>
</p>
