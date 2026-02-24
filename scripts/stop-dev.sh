#!/bin/bash

# 🛑 Stop Development Environment Script
# This script stops all running development services

echo "======================================"
echo "🛑 Stopping Development Environment"
echo "======================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PID files exist
if [ ! -f "logs/backend.pid" ] && [ ! -f "logs/frontend.pid" ]; then
    echo -e "${YELLOW}⚠️  No PID files found${NC}"
    echo "Services may not be running or were started manually."
    echo ""
    echo "Searching for running processes..."

    # Try to find and kill processes by port
    if command -v lsof >/dev/null 2>&1; then
        # Kill process on port 8000 (Backend)
        BACKEND_PID=$(lsof -ti:8000)
        if [ ! -z "$BACKEND_PID" ]; then
            echo -e "${BLUE}Found process on port 8000 (PID: $BACKEND_PID)${NC}"
            kill $BACKEND_PID 2>/dev/null
            echo -e "${GREEN}✓${NC} Stopped backend process"
        else
            echo -e "${YELLOW}⚠️${NC} No process found on port 8000"
        fi

        # Kill process on port 3000 (Frontend)
        FRONTEND_PID=$(lsof -ti:3000)
        if [ ! -z "$FRONTEND_PID" ]; then
            echo -e "${BLUE}Found process on port 3000 (PID: $FRONTEND_PID)${NC}"
            kill $FRONTEND_PID 2>/dev/null
            echo -e "${GREEN}✓${NC} Stopped frontend process"
        else
            echo -e "${YELLOW}⚠️${NC} No process found on port 3000"
        fi
    else
        echo -e "${RED}✗${NC} lsof command not found. Cannot automatically find processes."
        echo "Please manually stop processes on ports 3000 and 8000"
    fi

    echo ""
    echo "======================================"
    echo -e "${GREEN}Done!${NC}"
    echo "======================================"
    exit 0
fi

# Stop Backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo -e "${BLUE}Stopping Backend (PID: $BACKEND_PID)...${NC}"

    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        sleep 1

        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
            echo -e "${YELLOW}⚠️${NC} Backend force-stopped"
        else
            echo -e "${GREEN}✓${NC} Backend stopped gracefully"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} Backend process not running"
    fi

    rm logs/backend.pid
else
    echo -e "${YELLOW}⚠️${NC} Backend PID file not found"
fi

# Stop Frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo -e "${BLUE}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"

    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        sleep 1

        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
            echo -e "${YELLOW}⚠️${NC} Frontend force-stopped"
        else
            echo -e "${GREEN}✓${NC} Frontend stopped gracefully"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} Frontend process not running"
    fi

    rm logs/frontend.pid
else
    echo -e "${YELLOW}⚠️${NC} Frontend PID file not found"
fi

# Clean up any remaining processes on the ports
echo ""
echo -e "${BLUE}Cleaning up ports...${NC}"

if command -v lsof >/dev/null 2>&1; then
    # Check port 8000
    REMAINING_8000=$(lsof -ti:8000)
    if [ ! -z "$REMAINING_8000" ]; then
        echo -e "${YELLOW}⚠️${NC} Found remaining process on port 8000, cleaning up..."
        kill -9 $REMAINING_8000 2>/dev/null
    fi

    # Check port 3000
    REMAINING_3000=$(lsof -ti:3000)
    if [ ! -z "$REMAINING_3000" ]; then
        echo -e "${YELLOW}⚠️${NC} Found remaining process on port 3000, cleaning up..."
        kill -9 $REMAINING_3000 2>/dev/null
    fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ All services stopped!${NC}"
echo "======================================"
echo ""
echo "📋 Logs preserved in:"
echo "   logs/backend.log"
echo "   logs/frontend.log"
echo ""
echo "🚀 To start services again:"
echo "   Run: ./start-dev.sh"
echo ""
