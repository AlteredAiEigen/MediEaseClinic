#!/bin/bash

# MediEase Clinic - Restart Script
# This script kills existing processes, activates venv, starts backend, builds frontend, and serves it

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
echo "🔄 MediEase Clinic - Restart Services"
echo "=================================================="
echo -e "${NC}"

# Kill existing MediEase processes
print_step "Killing existing MediEase processes..."

# Stop any running FastAPI backend processes
if pgrep -f "uvicorn app.main:app" >/dev/null 2>&1; then
    print_warning "Stopping existing FastAPI backend process..."
    pkill -f "uvicorn app.main:app" || true
    sleep 2
fi

# Kill any processes using port 8000 (backend)
if lsof -ti:8000 >/dev/null 2>&1; then
    print_warning "Killing process using port 8000..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
    sleep 1
fi

# Kill any processes using port 5173 (frontend dev server)
if lsof -ti:5173 >/dev/null 2>&1; then
    print_warning "Killing process using port 5173..."
    kill -9 $(lsof -ti:5173) 2>/dev/null || true
    sleep 1
fi

# Stop existing PM2 frontend process if running
if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "frontend"; then
    print_warning "Stopping legacy PM2 frontend process..."
    pm2 stop frontend 2>/dev/null || true
    pm2 delete frontend 2>/dev/null || true
fi

print_success "All existing MediEase processes killed"

echo ""

# Activate virtual environment and start backend
print_step "Activating virtual environment and starting backend..."
cd fastapi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
print_step "Activating virtual environment..."
source venv/bin/activate
print_success "Virtual environment activated"

# Keep venv aligned with requirements (e.g. pymupdf for lab PDF parsing)
print_step "Syncing Python dependencies from requirements.txt..."
pip install -r requirements.txt -q
print_success "Python dependencies up to date"

# Create logs directory if it doesn't exist
mkdir -p logs

# Clear old log file
> logs/backend.log

# Start backend with nohup using venv's uvicorn
print_step "Starting backend server..."
nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*' > logs/backend.log 2>&1 &
BACKEND_PID=$!

print_success "Backend started with PID: $BACKEND_PID"
print_step "Backend logs: fastapi/logs/backend.log"

# Wait for backend to be ready
wait_for_service "http://127.0.0.1:8000/docs" "FastAPI backend"

echo ""

# Build frontend for production
print_step "Building frontend for production..."
cd ../Frontend

# Build the frontend
print_step "Running production build..."
npm run build

print_success "Frontend built successfully"

# Copy built files to nginx directory
print_step "Deploying frontend to nginx..."
sudo cp -r dist/* /home/ec2-user/.mediease/Frontend/dist/
sudo chown -R nginx:nginx /home/ec2-user/.mediease/Frontend/dist/
sudo chmod -R 755 /home/ec2-user/.mediease/Frontend/dist/

print_success "Frontend deployed and served via Nginx"

echo ""
echo -e "${GREEN}=================================================="
echo "🎉 MediEase Clinic restarted successfully!"
echo "=================================================="
echo ""
echo -e "📱 Frontend: ${BLUE}https://app.clinic.alteredai.care${NC}"
echo -e "🔧 Backend API: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "📋 Service Information:"
echo -e "   Backend: ${YELLOW}Running with PID: $BACKEND_PID${NC}"
echo -e "   Frontend: ${YELLOW}Served statically via Nginx${NC}"
echo ""
echo -e "📝 Logs:"
echo -e "   Backend: ${BLUE}fastapi/logs/backend.log${NC}"
echo -e "   Frontend: ${BLUE}/var/log/nginx/access.log & /var/log/nginx/error.log${NC}"
echo ""
echo -e "🛑 To stop services:"
echo -e "   Backend: ${RED}kill $BACKEND_PID${NC}"
echo -e "   All processes: ${RED}./stop.sh${NC}"
echo ""
echo -e "${GREEN}==================================================${NC}"

print_step "Restart complete. Services are running in background."
exit 0
