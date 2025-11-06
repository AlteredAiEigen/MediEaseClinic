# MediEase Clinic - Quick Start Guide

## 🚀 One-Command Setup & Launch

The `run.sh` script provides a complete automated setup and launch solution for the MediEase Clinic application.

### What the script does:

1. **Prerequisites Check**: Verifies Node.js (18+), npm, Python (3.8+), and MongoDB
2. **Backend Setup**:
   - Creates Python virtual environment (if needed)
   - Installs all FastAPI dependencies from `requirements.txt`
   - Creates `.env` file from template (if needed)
3. **Frontend Setup**:
   - Installs all Node.js dependencies
   - Builds the React application for production
4. **Service Launch**:
   - Starts FastAPI backend on port 8000
   - Starts React frontend on port 5173
   - Waits for services to be ready
   - Provides access URLs and process IDs

### How to use:

```bash
# Make sure you're in the project root directory
cd /path/to/MediEaseClinic

# Run the setup script
./run.sh
```

### What you'll see:

```
==================================================
🏥 MediEase Clinic - Complete Setup & Launch
==================================================

[STEP] Checking prerequisites...
[SUCCESS] Node.js v20.10.0 found
[SUCCESS] npm 10.2.3 found
[SUCCESS] Python 3.13.2 found
[SUCCESS] MongoDB found

[STEP] Setting up FastAPI Backend...
[STEP] Installing Python dependencies...
[SUCCESS] Python dependencies installed

[STEP] Setting up React Frontend...
[STEP] Installing Node.js dependencies...
[SUCCESS] Node.js dependencies installed
[STEP] Building React application...
[SUCCESS] Frontend built successfully

[STEP] Starting MediEase Clinic services...
[STEP] Starting FastAPI backend...
[SUCCESS] Backend started (PID: 12345)
[WAITING] Waiting for FastAPI backend to be ready...
[SUCCESS] FastAPI backend is ready!
[STEP] Starting React frontend...
[SUCCESS] Frontend started (PID: 12346)
[WAITING] Waiting for React frontend to be ready...
[SUCCESS] React frontend is ready!

==================================================
🎉 MediEase Clinic is now running!
==================================================

📱 Frontend: http://localhost:5173
🔧 Backend API: http://localhost:8000/docs

📋 Service PIDs:
   Backend: 12345
   Frontend: 12346

🛑 To stop services, run: kill 12345 12346

Note: Edit fastapi/.env file with your actual credentials
==================================================

Press Ctrl+C to stop all services
```

### Access URLs:

- **Main Application**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Stopping Services:

The script will keep running and show service status. To stop:

1. Press `Ctrl+C` in the terminal where the script is running
2. Or manually kill the processes: `kill <BACKEND_PID> <FRONTEND_PID>`

### Important Notes:

1. **Environment Configuration**: The script creates a `.env` file from `env.example`. **Edit `fastapi/.env`** with your actual credentials before production use.

2. **MongoDB Required**: Make sure MongoDB is running for full functionality.

3. **First Run**: The initial setup may take several minutes depending on your internet connection and system performance.

4. **Ports**: Ensure ports 5173 (frontend) and 8000 (backend) are available.

5. **Production**: This script is designed for development. For production deployment, use proper containerization (Docker) and orchestration.

### Troubleshooting:

- **Permission denied**: Run `chmod +x run.sh` to make the script executable
- **Port conflicts**: Kill processes using the ports or change port numbers in the script
- **MongoDB connection**: Ensure MongoDB is running and credentials are correct in `.env`
- **Dependencies fail**: Check internet connection and try again

### Manual Alternative:

If you prefer to run services manually:

```bash
# Backend
cd fastapi
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd Frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
