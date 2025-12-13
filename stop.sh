#!/bin/bash

# MediEase Clinic - Stop Script
# This script stops all MediEase processes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Main script
echo -e "${GREEN}"
echo "=================================================="
echo "🛑 MediEase Clinic - Stop Services"
echo "=================================================="
echo -e "${NC}"

print_step "Stopping MediEase processes..."

# Stop any running FastAPI backend processes
if pgrep -f "uvicorn app.main:app" >/dev/null 2>&1; then
    print_warning "Stopping FastAPI backend process..."
    pkill -f "uvicorn app.main:app" || true
    sleep 2
    print_success "Backend stopped"
else
    print_step "No backend process found"
fi

# Kill any processes using port 8000 (backend)
if lsof -ti:8000 >/dev/null 2>&1; then
    print_warning "Killing process using port 8000..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
    sleep 1
    print_success "Port 8000 freed"
fi

# Kill any processes using port 5173 (frontend dev server)
if lsof -ti:5173 >/dev/null 2>&1; then
    print_warning "Killing process using port 5173..."
    kill -9 $(lsof -ti:5173) 2>/dev/null || true
    sleep 1
    print_success "Port 5173 freed"
fi

# Stop existing PM2 frontend process if running
if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "frontend"; then
    print_warning "Stopping PM2 frontend process..."
    pm2 stop frontend 2>/dev/null || true
    pm2 delete frontend 2>/dev/null || true
    print_success "PM2 frontend stopped"
fi

print_success "All MediEase processes stopped"

echo ""
echo -e "${GREEN}=================================================="
echo "✅ All MediEase Clinic services stopped"
echo "=================================================="
echo -e "${NC}"

exit 0