#!/bin/bash

# MediEase Clinic - Complete Setup and Launch Script
# This script installs all dependencies and launches both frontend and backend

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process using a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        print_warning "Port $port is already in use by PID $pid ($service_name)"
        print_step "Killing process on port $port..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
        print_success "Freed port $port"
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}[WAITING]${NC} Waiting for $service_name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done

    print_error "$service_name failed to start within expected time"
    return 1
}

# Main script
echo -e "${GREEN}"
echo "=================================================="
echo "🏥 MediEase Clinic - Complete Setup & Launch"
echo "=================================================="
echo -e "${NC}"

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm $(npm --version) found"

# Check Python
if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2 | sed 's/\.//')
if [ "$PYTHON_VERSION" -lt 38 ]; then
    print_error "Python 3.8+ is required. Current version: $(python3 --version)"
    exit 1
fi
print_success "Python $(python3 --version) found"

# Check MongoDB (optional - warn if not found)
if ! command_exists mongod; then
    print_warning "MongoDB is not installed. Please install MongoDB for full functionality."
    print_warning "You can still run the application but database operations will fail."
else
    print_success "MongoDB found"
fi

echo ""

# Setup Backend
print_step "Setting up FastAPI Backend..."

cd fastapi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
print_step "Installing Python dependencies..."
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip > /dev/null 2>&1

# Install requirements
pip install -r requirements.txt

print_success "Python dependencies installed"

# Check if .env file exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        print_step "Creating .env file from template..."
        cp env.example .env
        print_warning "Please edit the .env file with your actual credentials before production use!"
    else
        print_warning ".env.example not found. Please create .env file manually."
    fi
fi

echo ""

# Setup Frontend
print_step "Setting up React Frontend..."

cd ../Frontend

# Install npm dependencies
print_step "Installing Node.js dependencies..."
npm install

print_success "Node.js dependencies installed"

# Build the frontend
print_step "Building React application..."
npm run build

print_success "Frontend built successfully"

echo ""

# Launch Services
print_step "Starting MediEase Clinic services..."

# Kill any processes using our ports
print_step "Checking for processes using required ports..."
kill_port 8000 "Backend"
kill_port 5173 "Frontend"

echo ""

# Start Backend in background
print_step "Starting FastAPI backend..."
cd ../fastapi
source venv/bin/activate

# Install/update requirements
print_step "Installing Python dependencies..."
pip install -r requirements.txt

print_success "Dependencies installed"

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

print_success "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
wait_for_service "http://localhost:8000/docs" "FastAPI backend"

# Start Frontend in background
print_step "Starting React frontend..."
cd ../Frontend

# Start frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

print_success "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
wait_for_service "http://localhost:5173" "React frontend"

echo ""
echo -e "${GREEN}=================================================="
echo "🎉 MediEase Clinic is now running!"
echo "=================================================="
echo ""
echo -e "📱 Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "🔧 Backend API: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "📋 Service PIDs:"
echo -e "   Backend: ${YELLOW}$BACKEND_PID${NC}"
echo -e "   Frontend: ${YELLOW}$FRONTEND_PID${NC}"
echo ""
echo -e "🛑 To stop services, run: ${RED}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo ""
echo -e "${YELLOW}Note: Edit fastapi/.env file with your actual credentials${NC}"
echo -e "${GREEN}==================================================${NC}"

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Shutting down services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running to show logs
wait
