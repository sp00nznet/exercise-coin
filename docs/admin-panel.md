# Admin Panel Documentation

The Exercise Coin Admin Panel provides a comprehensive dashboard for monitoring and managing the Exercise Coin platform.

## Overview

The admin panel is a React-based web application that communicates with the middleware server's admin API endpoints. It provides real-time insights into:

- System health and status
- Active miners and their performance
- User management and statistics
- Exercise session analytics
- Mining metrics and rewards distribution

## Access

### URL

When running with Docker Compose, the admin panel is available at:

```
http://localhost:8080
```

### Authentication

The admin panel uses API key authentication. You'll need the `ADMIN_API_KEY` configured in your environment.

1. Set the admin key in your `.env` file:
   ```
   ADMIN_API_KEY=your-secure-admin-key-here
   ```

2. Access the admin panel and enter the API key when prompted

## Features

### Dashboard

The main dashboard provides an overview of the entire platform:

- **Total Users**: Count of registered users
- **Active Miners**: Currently running daemon instances
- **Total Exercise Sessions**: All-time session count
- **Coins Distributed**: Total EXC mined and distributed

The dashboard also displays:
- Mining activity chart (last 7 days)
- Session success rate pie chart
- Top miners leaderboard

### Users Management

View and search all registered users:

- Search by username or email
- Filter by verification status
- View individual user details
- Track user's exercise sessions
- Monitor wallet transactions

### Active Miners

Real-time view of all running daemon instances:

- Daemon status (running/stopped)
- Associated user
- Wallet address
- Mining statistics
- Start time and uptime

### Mining Metrics

Detailed mining analytics:

- Daily mining statistics chart
- Total blocks mined
- Total coins distributed
- Top miners by rewards
- Period selection (24h, 7d, 30d)

### Exercise Metrics

Exercise session analytics:

- Sessions by status (pie chart)
- Total exercise time
- Average session duration
- Success rate percentage
- Invalid session reasons breakdown

### Sessions Browser

Browse all exercise sessions:

- Filter by status (active, completed, rewarded, invalid)
- View session details:
  - Duration
  - Steps counted
  - Valid exercise time
  - Coins earned
  - Invalidity reasons (if applicable)

### System Health

Monitor system status:

- Overall health status indicator
- Service connectivity:
  - MongoDB connection
  - Daemon service status
- Memory usage statistics
- Server uptime
- Log access instructions

## API Endpoints

The admin panel communicates with these server endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/dashboard` | Dashboard statistics |
| `GET /api/admin/health` | System health status |
| `GET /api/admin/users` | User list with pagination |
| `GET /api/admin/users/:id` | Individual user details |
| `GET /api/admin/miners` | Active daemon list |
| `GET /api/admin/mining/metrics` | Mining statistics |
| `GET /api/admin/exercise/metrics` | Exercise analytics |
| `GET /api/admin/exercise/sessions` | Session list |

All endpoints require the `X-Admin-Key` header.

## Development

### Running Locally

For local development without Docker:

```bash
cd admin-panel
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

Configure the API proxy in `vite.config.js` to point to your local server.

### Building

```bash
npm run build
```

Built files are output to the `dist/` directory.

### Project Structure

```
admin-panel/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx   # Main layout with sidebar
│   │   ├── StatCard.jsx # Statistics display card
│   │   └── DataTable.jsx# Generic data table
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── UserDetail.jsx
│   │   ├── Miners.jsx
│   │   ├── MiningMetrics.jsx
│   │   ├── ExerciseMetrics.jsx
│   │   ├── Sessions.jsx
│   │   └── SystemHealth.jsx
│   ├── App.jsx          # Main app with routing
│   ├── App.css          # Global styles
│   └── main.jsx         # Entry point
├── Dockerfile           # Production Docker build
├── nginx.conf           # Nginx configuration
└── package.json
```

## Docker Deployment

The admin panel is included in the main Docker Compose configuration:

```yaml
admin-panel:
  build:
    context: ./admin-panel
    dockerfile: Dockerfile
  container_name: exercisecoin-admin
  ports:
    - "8080:80"
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_KEY` | API key for admin authentication | Required |

## Security Considerations

1. **Change the default admin key**: Always set a strong, unique `ADMIN_API_KEY` in production
2. **Network security**: Consider placing the admin panel behind a VPN or IP whitelist
3. **HTTPS**: Use a reverse proxy (like Traefik or nginx) with SSL certificates in production
4. **Access logging**: Monitor access to admin endpoints for suspicious activity

## Troubleshooting

### Cannot connect to API

1. Verify the server container is running:
   ```bash
   docker-compose ps
   ```

2. Check server logs:
   ```bash
   docker-compose logs server
   ```

3. Ensure the admin panel can reach the server on the Docker network

### Authentication failed

1. Verify your `ADMIN_API_KEY` matches between the server and your login
2. Check that the environment variable is set correctly:
   ```bash
   docker-compose exec server env | grep ADMIN
   ```

### Data not loading

1. Check browser console for errors
2. Verify MongoDB is connected (check System Health page)
3. Ensure the server has proper database access
