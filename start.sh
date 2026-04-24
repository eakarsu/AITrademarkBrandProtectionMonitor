#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      AI Trademark & Brand Protection Monitor               ║${NC}"
echo -e "${CYAN}║      Starting Application...                               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Step 1: Clean up used ports
echo -e "\n${YELLOW}[1/6] Cleaning up ports...${NC}"
for port in $BACKEND_PORT $FRONTEND_PORT; do
  PID=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo -e "  Killing process on port $port (PID: $PID)"
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
  echo -e "  ${GREEN}✓ Port $port is free${NC}"
done

# Step 2: Check PostgreSQL
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ PostgreSQL is not installed!${NC}"
  exit 1
fi

# Try to connect to PostgreSQL
if ! psql -U postgres -c "SELECT 1" &>/dev/null; then
  echo -e "${YELLOW}  Trying to start PostgreSQL...${NC}"
  if command -v brew &>/dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
  fi
fi

# Create database if not exists
echo -e "  Creating database if not exists..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'trademark_monitor'" | grep -q 1 || \
  psql -U postgres -c "CREATE DATABASE trademark_monitor" 2>/dev/null || \
  createdb -U postgres trademark_monitor 2>/dev/null || true
echo -e "  ${GREEN}✓ Database ready${NC}"

# Step 3: Run schema
echo -e "\n${YELLOW}[3/6] Setting up database schema...${NC}"
psql -U postgres -d trademark_monitor -f backend/db/schema.sql 2>/dev/null
echo -e "  ${GREEN}✓ Schema applied${NC}"

# Step 4: Seed data
echo -e "\n${YELLOW}[4/6] Seeding database...${NC}"
psql -U postgres -d trademark_monitor -f backend/db/seed.sql 2>/dev/null
echo -e "  ${GREEN}✓ Data seeded${NC}"

# Step 5: Install dependencies
echo -e "\n${YELLOW}[5/6] Installing dependencies...${NC}"
cd backend && npm install --silent 2>/dev/null && cd ..
echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"
cd frontend && npm install --silent 2>/dev/null && cd ..
echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"

# Step 6: Start services with hot reload
echo -e "\n${YELLOW}[6/6] Starting services with hot reload...${NC}"
echo -e ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Backend:  http://localhost:${BACKEND_PORT}                           ║${NC}"
echo -e "${CYAN}║  Frontend: http://localhost:${FRONTEND_PORT}                           ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Login:    demo@trademark.com / password123                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start backend with nodemon for hot reload
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..

# Start frontend with Vite HMR
cd frontend
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!
cd ..

# Trap to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}✓ Application stopped${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
