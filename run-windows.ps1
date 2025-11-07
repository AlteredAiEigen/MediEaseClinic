# MediEase Clinic - Windows PowerShell Setup & Launch Script
# This script sets up and launches both the FastAPI backend and React frontend

param(
    [switch]$SkipChecks,
    [switch]$NoBuild
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🏥 MediEase Clinic - Complete Setup & Launch" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to kill process on port
function Kill-ProcessOnPort {
    param($Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            $processId = $connections[0].OwningProcess
            if ($processId) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process on port $Port" -ForegroundColor Yellow
            }
        }
    } catch {
        # Silently continue if we can't kill the process
    }
}

# Check prerequisites
if (-not $SkipChecks) {
    Write-Host "[STEP] Checking prerequisites..." -ForegroundColor Green

    # Check Node.js
    if (-not (Test-Command "node")) {
        Write-Host "[ERROR] Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    $nodeVersion = & node --version
    Write-Host "[SUCCESS] Node.js $nodeVersion found" -ForegroundColor Green

    # Check npm
    if (-not (Test-Command "npm")) {
        Write-Host "[ERROR] npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    $npmVersion = & npm --version
    Write-Host "[SUCCESS] npm $npmVersion found" -ForegroundColor Green

    # Check Python
    if (-not (Test-Command "python")) {
        Write-Host "[ERROR] Python not found. Please install Python from https://python.org/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    $pythonVersion = & python --version
    Write-Host "[SUCCESS] $pythonVersion found" -ForegroundColor Green

    # Check MongoDB (optional warning)
    if (Test-Command "mongod") {
        Write-Host "[SUCCESS] MongoDB found" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] MongoDB not found. Please install MongoDB Community Server" -ForegroundColor Yellow
        Write-Host "          Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    }

    Write-Host ""
}

# Setup FastAPI Backend
Write-Host "[STEP] Setting up FastAPI Backend..." -ForegroundColor Green

$venvPath = "fastapi\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[STEP] Creating Python virtual environment..." -ForegroundColor Green
    & python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[SUCCESS] Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "[SUCCESS] Virtual environment already exists" -ForegroundColor Green
}

Write-Host "[STEP] Activating virtual environment and installing dependencies..." -ForegroundColor Green

# Activate virtual environment
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
} else {
    Write-Host "[ERROR] Could not find virtual environment activation script" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Upgrade pip
& python -m pip install --upgrade pip

# Install dependencies
& pip install -r fastapi\requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[SUCCESS] Python dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
$envFile = "fastapi\.env"
$envExample = "fastapi\env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "[INFO] Created .env file from env.example" -ForegroundColor Cyan
        Write-Host "[WARNING] Please edit fastapi\.env with your actual credentials" -ForegroundColor Yellow
    } else {
        Write-Host "[WARNING] No env.example found. Please create fastapi\.env manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SUCCESS] .env file already exists" -ForegroundColor Green
}

Write-Host ""

# Setup React Frontend
if (-not $NoBuild) {
    Write-Host "[STEP] Setting up React Frontend..." -ForegroundColor Green

    if (-not (Test-Path "Frontend\node_modules")) {
        Write-Host "[STEP] Installing Node.js dependencies..." -ForegroundColor Green
        Push-Location Frontend
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Pop-Location
            Write-Host "[ERROR] Failed to install Node.js dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Pop-Location
        Write-Host "[SUCCESS] Node.js dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "[SUCCESS] Node.js dependencies already installed" -ForegroundColor Green
    }

    Write-Host "[STEP] Building React application..." -ForegroundColor Green
    Push-Location Frontend
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "[ERROR] Failed to build React application" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Host "[SUCCESS] Frontend built successfully" -ForegroundColor Green
}

Write-Host ""

# Launch Services
Write-Host "[STEP] Starting MediEase Clinic services..." -ForegroundColor Green

# Kill any existing processes on our ports
Write-Host "[STEP] Checking for processes using required ports..." -ForegroundColor Green
Kill-ProcessOnPort 8000
Kill-ProcessOnPort 5173

Write-Host ""

# Start FastAPI backend
Write-Host "[STEP] Starting FastAPI backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "fastapi"
    & "venv\Scripts\Activate.ps1"
    & uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
} -Name "MediEaseBackend"

Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] FastAPI backend is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Backend may still be starting..." -ForegroundColor Yellow
}

# Start React frontend
Write-Host "[STEP] Starting React frontend..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "Frontend"
    & npm run dev -- --host 0.0.0.0 --port 5173
} -Name "MediEaseFrontend"

Start-Sleep -Seconds 5

# Check if frontend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] React frontend is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 MediEase Clinic is now running!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📋 Service Job Names:" -ForegroundColor White
Write-Host "   Backend: MediEaseBackend" -ForegroundColor White
Write-Host "   Frontend: MediEaseFrontend" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop services, run:" -ForegroundColor White
Write-Host "   Stop-Job -Name MediEaseBackend, MediEaseFrontend" -ForegroundColor White
Write-Host "   Remove-Job -Name MediEaseBackend, MediEaseFrontend" -ForegroundColor White
Write-Host ""
Write-Host "Note: Edit fastapi\.env file with your actual credentials" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# Keep the script running to show status
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring (services will continue running)" -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 10
        # Check if jobs are still running
        $backendJob = Get-Job -Name MediEaseBackend -ErrorAction SilentlyContinue
        $frontendJob = Get-Job -Name MediEaseFrontend -ErrorAction SilentlyContinue

        if (-not $backendJob -or $backendJob.State -ne "Running") {
            Write-Host "[WARNING] Backend job is not running" -ForegroundColor Yellow
        }
        if (-not $frontendJob -or $frontendJob.State -ne "Running") {
            Write-Host "[WARNING] Frontend job is not running" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped. Services are still running in background jobs." -ForegroundColor Gray
}
