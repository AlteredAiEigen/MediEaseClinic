#!/bin/bash

# MediEase Clinic FastAPI - Quick Setup Script
# This script will set up your environment and start the application

echo "🏥 MediEase Clinic - FastAPI Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the fastapi directory"
    exit 1
fi

# Step 1: Create .env file
echo "📝 Step 1: Creating .env file..."
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup..."
    cp .env .env.backup
fi

if [ -f ".env.ready" ]; then
    cp .env.ready .env
    echo "✅ .env file created with all your credentials!"
else
    echo "❌ Error: .env.ready file not found. Using ENV_TEMPLATE.txt instead..."
    cp ENV_TEMPLATE.txt .env
fi

echo ""

# Step 2: Check Python version
echo "🐍 Step 2: Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Found Python $python_version"

if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"; then
    echo "✅ Python version is compatible"
else
    echo "⚠️  Warning: Python 3.10+ is recommended"
fi

echo ""

# Step 3: Create virtual environment
echo "📦 Step 3: Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo ""

# Step 4: Activate virtual environment and install dependencies
echo "📥 Step 4: Installing dependencies..."
source venv/bin/activate

pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ All dependencies installed successfully!"
else
    echo "❌ Error installing dependencies. Please check requirements.txt"
    exit 1
fi

echo ""

# Step 5: Check MongoDB connection
echo "🗄️  Step 5: Checking MongoDB connection..."
python3 -c "
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_mongo():
    try:
        client = AsyncIOMotorClient('mongodb+srv://chanpreet007:chanpreet007@clusteralteredai.tnsxiov.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=ClusterAlteredAI', serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print('✅ MongoDB connection successful!')
        return True
    except Exception as e:
        print(f'⚠️  MongoDB connection failed: {e}')
        print('   The app will still start, but database operations will fail.')
        return False

asyncio.run(check_mongo())
"

echo ""

# Step 6: Summary
echo "📋 Setup Summary"
echo "=================================="
echo "✅ Configuration file: .env (created)"
echo "✅ Virtual environment: venv/ (activated)"
echo "✅ Dependencies: installed"
echo "✅ Python packages: ready"
echo ""
echo "⚠️  REMINDER: Create S3 bucket 'mediease-clinic-files' in AWS Console"
echo "   Region: us-east-1"
echo "   Encryption: SSE-S3"
echo ""

# Step 7: Ask to start the application
echo "🚀 Ready to start the application!"
echo ""
read -p "Do you want to start the server now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 Starting MediEase Clinic API..."
    echo "=================================="
    echo ""
    echo "📍 API Documentation: http://localhost:8000/docs"
    echo "📍 Alternative Docs:  http://localhost:8000/redoc"
    echo "📍 Health Check:      http://localhost:8000/health"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the application
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
else
    echo ""
    echo "To start the server later, run:"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --reload"
    echo ""
    echo "Or simply run: ./setup.sh and choose 'y' when prompted"
fi

