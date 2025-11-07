# MediEase Clinic - Windows Setup Guide

This guide provides Windows-specific setup instructions for the MediEase Clinic application.

## 🚀 Quick Start for Windows

### Prerequisites

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Choose the LTS version

2. **Python** (v3.8 or later)
   - Download from: https://python.org/
   - Make sure to check "Add Python to PATH" during installation

3. **MongoDB Community Server**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow the installation wizard

4. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

### Option 1: PowerShell Script (Recommended)

1. **Open PowerShell as Administrator**
   ```powershell
   # Navigate to project directory
   cd C:\path\to\MediEaseClinic

   # Run the setup script
   .\run-windows.ps1
   ```

2. **If you get execution policy errors:**
   ```powershell
   # Allow script execution for current session
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

   # Or permanently (not recommended for security)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Option 2: Batch File

1. **Double-click `run-windows.bat`**
   - Or run from Command Prompt: `run-windows.bat`

### Option 3: Manual Setup

If the automated scripts don't work, set up manually:

#### Backend Setup
```batch
# Create virtual environment
python -m venv fastapi\venv

# Activate virtual environment
fastapi\venv\Scripts\activate

# Install dependencies
pip install -r fastapi\requirements.txt

# Copy environment file
copy fastapi\env.example fastapi\.env
# Edit .env with your credentials
```

#### Frontend Setup
```batch
# Install dependencies
cd Frontend
npm install

# Build for production
npm run build
cd ..
```

#### Launch Services
```batch
# Terminal 1 - Backend
cd fastapi
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd Frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

## 🔧 Environment Configuration

### Required Credentials

Edit `fastapi\.env` with your actual credentials:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mediease

# AWS (Required for transcription)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=mediease-recordings

# OpenAI (Required for AI notes)
OPENAI_API_KEY=your-openai-api-key

# JWT
JWT_SECRET_KEY=your-32-character-secret-key
```

## 🚨 Security Warning

**NEVER commit `.env` files to GitHub!** They contain sensitive credentials.

The repository includes `fastapi\.env.template` as a reference. Copy it to `.env` and fill in your actual credentials.

## 🔍 Troubleshooting

### Common Issues

1. **"Execution Policy" Error in PowerShell**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
   ```

2. **MongoDB Connection Failed**
   - Ensure MongoDB service is running
   - Check if MongoDB is installed correctly
   - Try: `net start MongoDB`

3. **Port Already in Use**
   - The scripts automatically kill processes on ports 8000 and 5173
   - Manual check: `netstat -ano | findstr :8000`

4. **Python Virtual Environment Issues**
   ```batch
   # Delete and recreate venv
   rmdir /s fastapi\venv
   python -m venv fastapi\venv
   ```

5. **Node.js/npm Issues**
   ```batch
   # Clear npm cache
   npm cache clean --force
   # Reinstall dependencies
   cd Frontend
   rmdir /s node_modules
   npm install
   ```

### Manual Commands

If scripts fail, use these manual commands:

```batch
REM Backend
cd fastapi
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

REM Frontend (new terminal)
cd Frontend
npm install
npm run build
npm run dev -- --host 0.0.0.0 --port 5173
```

## 📋 Access URLs

- **Application**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **API Alternative Docs**: http://localhost:8000/redoc

## 🛑 Stopping Services

### PowerShell Script
```powershell
# Stop the jobs
Stop-Job -Name MediEaseBackend, MediEaseFrontend
Remove-Job -Name MediEaseBackend, MediEaseFrontend
```

### Manual Stop
- Close the Command Prompt/PowerShell windows
- Or find and kill processes using Task Manager

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes**
   ```batch
   cd fastapi
   venv\Scripts\activate
   # Make your changes
   # The server will auto-reload
   ```

2. **Frontend Changes**
   ```batch
   cd Frontend
   # Make your changes
   # The dev server will auto-reload
   ```

### Database

- MongoDB data is stored locally
- Use MongoDB Compass for database inspection
- Default database: `mediease`

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Verify all prerequisites are installed
3. Ensure environment variables are set correctly
4. Check Windows Firewall isn't blocking ports
5. Try running as Administrator

## 🎯 Windows-Specific Notes

- Use **PowerShell** instead of Command Prompt for better compatibility
- The scripts use Windows-specific path separators (`\`)
- Virtual environments are created in `venv\` subdirectories
- MongoDB service should be running automatically after installation

---

**Happy coding on Windows! 🎉**
