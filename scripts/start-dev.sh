#!/bin/bash

# 🚀 Development Environment Startup Script
# This script starts all required services for the application

echo "======================================"
echo "🚀 Starting Development Environment"
echo "======================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on Windows (Git Bash, WSL, etc.)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "${YELLOW}⚠️  Detected Windows environment${NC}"
    echo "This script works best on Unix-like systems (macOS, Linux, WSL)"
    echo ""
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
echo ""

# Check Node.js
if command_exists node; then
    echo -e "${GREEN}✓${NC} Node.js installed: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command_exists npm; then
    echo -e "${GREEN}✓${NC} npm installed: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm not found. Please install npm"
    exit 1
fi

# Check Python
if command_exists python3; then
    echo -e "${GREEN}✓${NC} Python installed: $(python3 --version)"
elif command_exists python; then
    echo -e "${GREEN}✓${NC} Python installed: $(python --version)"
else
    echo -e "${RED}✗${NC} Python not found. Please install Python 3.12+"
    exit 1
fi

# Check UV package manager
if command_exists uv; then
    echo -e "${GREEN}✓${NC} UV installed: $(uv --version)"
else
    echo -e "${YELLOW}⚠️${NC} UV not found. Installing UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# Check Stripe CLI (optional)
if command_exists stripe; then
    echo -e "${GREEN}✓${NC} Stripe CLI installed"
else
    echo -e "${YELLOW}⚠️${NC} Stripe CLI not found (optional for webhook testing)"
    echo "   Install: https://stripe.com/docs/stripe-cli"
fi

echo ""

# Check if ports are available
echo -e "${BLUE}🔍 Checking ports...${NC}"
if port_in_use 3000; then
    echo -e "${RED}✗${NC} Port 3000 is already in use (Frontend)"
    echo "   Please stop the process using port 3000 and try again"
    exit 1
else
    echo -e "${GREEN}✓${NC} Port 3000 is available (Frontend)"
fi

if port_in_use 8000; then
    echo -e "${RED}✗${NC} Port 8000 is already in use (Backend)"
    echo "   Please stop the process using port 8000 and try again"
    exit 1
else
    echo -e "${GREEN}✓${NC} Port 8000 is available (Backend)"
fi

echo ""

# Check environment files
echo -e "${BLUE}📝 Checking environment files...${NC}"

if [ -f "Frontend/.env.local" ]; then
    echo -e "${GREEN}✓${NC} Frontend/.env.local exists"
else
    echo -e "${YELLOW}⚠️${NC} Frontend/.env.local not found"
    echo "   Please create it from Frontend/SETUP.md"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ -f "Backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend/.env exists"
else
    echo -e "${YELLOW}⚠️${NC} Backend/.env not found"
    echo "   Please create it from Backend/SETUP.md"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "Frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️${NC} Frontend dependencies not installed. Installing..."
    cd Frontend && npm install && cd ..
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
fi

if [ ! -d "Backend/.venv" ]; then
    echo -e "${YELLOW}⚠️${NC} Backend dependencies not installed. Installing..."
    cd Backend && uv sync && cd ..
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo "======================================"
echo ""

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""

# Create log directory
mkdir -p logs

# Start Backend
echo -e "${BLUE}Starting Backend (FastAPI)...${NC}"
cd Backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"
echo "   URL: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Logs: logs/backend.log"

# Wait a moment for backend to start
sleep 2

# Start Frontend
echo ""
echo -e "${BLUE}Starting Frontend (Next.js)...${NC}"
cd Frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"
echo "   URL: http://localhost:3000"
echo "   Logs: logs/frontend.log"

# Wait for services to be ready
echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 3

# Check if services are running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend failed to start. Check logs/backend.log"
    exit 1
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${RED}✗${NC} Frontend failed to start. Check logs/frontend.log"
    exit 1
fi

# Save PIDs to file for cleanup
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "======================================"
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo "======================================"
echo ""
echo "📍 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Sign In:   http://localhost:3000/sign-in"
echo ""
echo "📋 Logs:"
echo "   Backend:   logs/backend.log"
echo "   Frontend:  logs/frontend.log"
echo ""
echo "📝 Next Steps:"
echo "   1. Visit http://localhost:3000"
echo "   2. Sign in with Google or Magic Link"
echo "   3. Try creating a board (will fail - no subscription)"
echo "   4. Subscribe with test card: 4242 4242 4242 4242"
echo "   5. Create a board (will succeed)"
echo ""
echo "⚠️  Optional: Start Stripe webhook listener"
echo "   Run: stripe listen --forward-to localhost:8000/webhook/stripe"
echo ""
echo "🛑 To stop all services:"
echo "   Run: ./stop-dev.sh"
echo "   Or press Ctrl+C and run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📚 Documentation:"
echo "   README.md - Architecture overview"
echo "   TESTING_GUIDE.md - Testing procedures"
echo "   QUICK_REFERENCE.md - Developer cheat sheet"
echo ""

# Keep script running and show logs
echo -e "${BLUE}📊 Watching logs... (Ctrl+C to stop)${NC}"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Services stopped"
    exit 0
}

trap cleanup INT TERM

# Tail logs
tail -f logs/backend.log logs/frontend.log
