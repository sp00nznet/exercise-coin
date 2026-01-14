#!/bin/bash

# ============================================================================
# Exercise Coin - macOS Server Stack Deploy Script
# One-click installation for Server, Admin Portal, and Exchange
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}      Exercise Coin - Server Stack Deployment                              ${NC}"
echo -e "${CYAN}      Server + Admin Portal + Exchange                                     ${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

cd "$PROJECT_ROOT"
echo -e "${YELLOW}[INFO]${NC} Project root: $PROJECT_ROOT"
echo ""

# ============================================================================
# Step 1: Check and Install Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 1/7]${NC} Checking dependencies..."
echo ""

# Check for Homebrew
echo -e "${YELLOW}[CHECK]${NC} Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi
echo -e "${GREEN}[OK]${NC} $(brew --version | head -n 1)"

# Check for Node.js
echo -e "${YELLOW}[CHECK]${NC} Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Node.js..."
    brew install node
fi
echo -e "${GREEN}[OK]${NC} Node.js: $(node --version)"

# Check for npm
echo -e "${YELLOW}[CHECK]${NC} npm..."
echo -e "${GREEN}[OK]${NC} npm: $(npm --version)"

# Check for Git
echo -e "${YELLOW}[CHECK]${NC} Git..."
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Git..."
    brew install git
fi
echo -e "${GREEN}[OK]${NC} $(git --version)"

# Check for MongoDB
echo -e "${YELLOW}[CHECK]${NC} MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo ""
    echo -e "${YELLOW}[INFO]${NC} MongoDB not found."
    echo "Options:"
    echo "  1. Install MongoDB locally (via Homebrew)"
    echo "  2. Use MongoDB Atlas cloud (set MONGODB_URI in .env)"
    echo ""
    read -p "Install MongoDB locally? (Y/N): " INSTALL_MONGO
    if [[ "$INSTALL_MONGO" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[INFO]${NC} Installing MongoDB..."
        brew tap mongodb/brew
        brew install mongodb-community
        echo -e "${GREEN}[OK]${NC} MongoDB installed!"
        echo -e "${YELLOW}[INFO]${NC} Start MongoDB with: brew services start mongodb-community"
    fi
else
    echo -e "${GREEN}[OK]${NC} MongoDB found"
fi

echo ""

# ============================================================================
# Step 2: Create Environment Files
# ============================================================================

echo -e "${CYAN}[STEP 2/7]${NC} Setting up environment files..."
echo ""

if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating server/.env..."
    cat > server/.env << EOF
# Exercise Coin Server Configuration
PORT=3000
MONGODB_URI=mongodb://localhost:27017/exercise-coin
JWT_SECRET=exercise-coin-super-secret-key-$(openssl rand -hex 16)
JWT_EXPIRES_IN=7d

# Coin Daemon
COIN_DAEMON_HOST=localhost
COIN_DAEMON_PORT=39338
COIN_DAEMON_USER=exercisecoin
COIN_DAEMON_PASS=password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin
ADMIN_JWT_SECRET=admin-secret-key-$(openssl rand -hex 16)
EOF
    echo -e "${GREEN}[OK]${NC} server/.env created"
else
    echo -e "${GREEN}[OK]${NC} server/.env already exists"
fi

echo ""

# ============================================================================
# Step 3: Install Server Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 3/7]${NC} Installing server dependencies..."
echo ""

cd server
npm install
cd ..
echo -e "${GREEN}[OK]${NC} Server dependencies installed!"

echo ""

# ============================================================================
# Step 4: Install Admin Portal Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 4/7]${NC} Installing admin portal dependencies..."
echo ""

cd admin-portal
npm install
cd ..
echo -e "${GREEN}[OK]${NC} Admin portal dependencies installed!"

echo ""

# ============================================================================
# Step 5: Install Exchange Dependencies
# ============================================================================

echo -e "${CYAN}[STEP 5/7]${NC} Installing exchange dependencies..."
echo ""

cd exchange
npm install
cd ..
echo -e "${GREEN}[OK]${NC} Exchange dependencies installed!"

echo ""

# ============================================================================
# Step 6: Build Frontend Apps
# ============================================================================

echo -e "${CYAN}[STEP 6/7]${NC} Building frontend applications..."
echo ""

# Build Admin Portal
echo -e "${YELLOW}[BUILD]${NC} Building admin portal..."
cd admin-portal
npm run build 2>/dev/null || echo -e "${YELLOW}[WARN]${NC} Admin portal build skipped (will use dev server)"
cd ..

# Build Exchange
echo -e "${YELLOW}[BUILD]${NC} Building exchange..."
cd exchange
npm run build 2>/dev/null || echo -e "${YELLOW}[WARN]${NC} Exchange build skipped (will use dev server)"
cd ..

echo -e "${GREEN}[OK]${NC} Builds complete!"

echo ""

# ============================================================================
# Step 7: Create Startup Scripts
# ============================================================================

echo -e "${CYAN}[STEP 7/7]${NC} Creating startup scripts..."
echo ""

# Create start-all.sh
cat > "$SCRIPT_DIR/start-all.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting Exercise Coin Server Stack..."
echo ""

# Start MongoDB (if installed via Homebrew)
if command -v brew &> /dev/null; then
    echo "Starting MongoDB..."
    brew services start mongodb-community 2>/dev/null || true
    sleep 2
fi

# Start Server
echo "Starting API Server on port 3000..."
cd "$PROJECT_ROOT/server"
npm run dev &
SERVER_PID=$!
sleep 3

# Start Admin Portal
echo "Starting Admin Portal on port 3001..."
cd "$PROJECT_ROOT/admin-portal"
npm run dev &
ADMIN_PID=$!
sleep 2

# Start Exchange
echo "Starting Exchange on port 3002..."
cd "$PROJECT_ROOT/exchange"
npm run dev &
EXCHANGE_PID=$!

echo ""
echo "============================================"
echo "  All services started!"
echo ""
echo "  API Server:    http://localhost:3000"
echo "  Admin Portal:  http://localhost:3001"
echo "  Exchange:      http://localhost:3002"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all services..."

# Handle shutdown
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $ADMIN_PID 2>/dev/null
    kill $EXCHANGE_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait
wait
EOF
chmod +x "$SCRIPT_DIR/start-all.sh"
echo -e "${GREEN}[OK]${NC} Created start-all.sh"

# Create individual start scripts
cat > "$SCRIPT_DIR/start-server.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../server"
npm run dev
EOF
chmod +x "$SCRIPT_DIR/start-server.sh"
echo -e "${GREEN}[OK]${NC} Created start-server.sh"

cat > "$SCRIPT_DIR/start-admin.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../admin-portal"
npm run dev
EOF
chmod +x "$SCRIPT_DIR/start-admin.sh"
echo -e "${GREEN}[OK]${NC} Created start-admin.sh"

cat > "$SCRIPT_DIR/start-exchange.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../exchange"
npm run dev
EOF
chmod +x "$SCRIPT_DIR/start-exchange.sh"
echo -e "${GREEN}[OK]${NC} Created start-exchange.sh"

echo ""

# ============================================================================
# Done!
# ============================================================================

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETE!                                                    ${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${CYAN}Quick Start:${NC}"
echo "  ./scripts/macos/start-all.sh"
echo ""
echo -e "${CYAN}URLs:${NC}"
echo "  API Server:    http://localhost:3000"
echo "  Admin Portal:  http://localhost:3001"
echo "  Exchange:      http://localhost:3002"
echo ""
echo -e "${CYAN}Default Admin Login:${NC}"
echo "  Email:    admin@exercisecoin.com"
echo "  Password: admin123"
echo "  (Create via: POST /api/admin/create-first-admin)"
echo ""
echo -e "${CYAN}Individual Scripts:${NC}"
echo "  - start-all.sh      - Start everything"
echo "  - start-server.sh   - API server only"
echo "  - start-admin.sh    - Admin portal only"
echo "  - start-exchange.sh - Exchange only"
echo ""

read -p "Start all services now? (Y/N): " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Starting services...${NC}"
    "$SCRIPT_DIR/start-all.sh"
fi
