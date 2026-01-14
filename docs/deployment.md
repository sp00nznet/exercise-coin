# Deployment Guide

Production deployment guide for Exercise Coin.

## Table of Contents

- [Overview](#overview)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Security Hardening](#security-hardening)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Scaling](#scaling)

---

## Overview

This guide covers deploying Exercise Coin to a production environment.

### Deployment Options

| Method | Best For | Complexity |
|--------|----------|------------|
| Docker Compose | Small deployments, testing | Low |
| Kubernetes | Large scale, enterprise | High |
| Manual | Full control, custom infra | Medium |

---

## Infrastructure Requirements

### Minimum Requirements (Up to 100 users)

| Component | Specification |
|-----------|---------------|
| CPU | 2 cores |
| RAM | 4 GB |
| Storage | 50 GB SSD |
| Network | 100 Mbps |

### Recommended (Up to 1,000 users)

| Component | Specification |
|-----------|---------------|
| CPU | 4 cores |
| RAM | 8 GB |
| Storage | 100 GB SSD |
| Network | 1 Gbps |

### Large Scale (1,000+ users)

- Load balanced server cluster
- MongoDB replica set
- Dedicated daemon servers
- CDN for mobile app assets

---

## Docker Deployment

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin

# 2. Create production environment file
cat > .env << EOF
NODE_ENV=production
MONGO_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
EOF

# 3. Build and start services
docker-compose -f docker-compose.yml up -d --build

# 4. Verify services
docker-compose ps
docker-compose logs -f
```

### Docker Compose Production Config

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - internal

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/exercise-coin?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    networks:
      - internal
      - external

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - server
    networks:
      - external

volumes:
  mongodb_data:

networks:
  internal:
  external:
```

---

## Manual Deployment

### Server Setup

```bash
# 1. Create application user
sudo useradd -m -s /bin/bash exercisecoin
sudo su - exercisecoin

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone and install
git clone https://github.com/sp00nznet/exercise-coin.git
cd exercise-coin/server
npm ci --only=production

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'exercise-coin-server',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Enable startup on boot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/exercise-coin
server {
    listen 80;
    server_name api.exercisecoin.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.exercisecoin.com;

    ssl_certificate /etc/letsencrypt/live/api.exercisecoin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.exercisecoin.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.exercisecoin.com

# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Security Hardening

### Server Security

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Enable firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Application Security

```env
# Production .env
NODE_ENV=production
JWT_SECRET=<64+ character random string>

# Enable all security headers
HELMET_ENABLED=true

# Strict rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### MongoDB Security

```bash
# Enable authentication
mongosh admin
> db.createUser({
    user: "admin",
    pwd: "STRONG_PASSWORD",
    roles: ["root"]
  })

# Edit mongod.conf
security:
  authorization: enabled
```

### Secrets Management

Never commit secrets. Use environment variables or secret managers:

```bash
# Using Docker secrets
echo "my_secret" | docker secret create jwt_secret -

# Or environment variables
export JWT_SECRET=$(cat /run/secrets/jwt_secret)
```

---

## Monitoring

### Health Checks

```bash
# Server health
curl -f http://localhost:3000/health

# MongoDB health
mongosh --eval "db.runCommand({ ping: 1 })"

# Daemon health
exercisecoin-cli getblockchaininfo
```

### Logging

```bash
# PM2 logs
pm2 logs exercise-coin-server

# Docker logs
docker-compose logs -f server

# System logs
journalctl -u exercise-coin -f
```

### Metrics with Prometheus

Add to server for metrics endpoint:

```javascript
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

### Alerting

Set up alerts for:
- Server down (health check fails)
- High error rate (>1% of requests)
- Database connection issues
- Disk space low (<20%)
- Memory usage high (>90%)

---

## Backup & Recovery

### MongoDB Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="mongodb://admin:password@localhost:27017" \
    --out=/backups/mongodb/$DATE

# Keep last 7 days
find /backups/mongodb -mtime +7 -delete
```

### Wallet Backup

```bash
# Backup all user wallets
for dir in /var/lib/exercisecoin/users/*/; do
    user=$(basename $dir)
    cp $dir/wallet.dat /backups/wallets/${user}_$(date +%Y%m%d).dat
done
```

### Disaster Recovery

1. Restore MongoDB from backup
2. Restore wallet files
3. Resync blockchain if needed
4. Verify user balances

---

## Scaling

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (nginx/HAProxy)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Server 1    │  │   Server 2    │  │   Server 3    │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────┐
                    │ MongoDB Replica │
                    │      Set        │
                    └─────────────────┘
```

### Load Balancer Config

```nginx
upstream exercise_coin {
    least_conn;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    listen 443 ssl;
    location / {
        proxy_pass http://exercise_coin;
    }
}
```

### MongoDB Replica Set

```javascript
rs.initiate({
  _id: "exercisecoin",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
});
```
