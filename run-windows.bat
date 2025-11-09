@echo off
REM MediEase Clinic - Windows Setup & Launch Script
REM This script sets up and launches both the FastAPI backend and React frontend

echo ================================================
echo 🏥 MediEase Clinic - Complete Setup ^& Launch
echo ================================================
echo.

REM Check prerequisites
echo [STEP] Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% found

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm %NPM_VERSION% found

REM Check Python (python.exe or py launcher)
set "PYTHON_CMD="

python --version >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    py -3 --version >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_CMD=py -3"
    ) else (
        py --version >nul 2>nul
        if not errorlevel 1 (
            set "PYTHON_CMD=py"
        )
    )
)

if not defined PYTHON_CMD (
    echo [ERROR] Python not found. Please install Python from https://python.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('%PYTHON_CMD% --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] %PYTHON_VERSION% found

REM Check MongoDB (optional - will warn if not found)
where mongod >nul 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] MongoDB found
) else (
    echo [WARNING] MongoDB not found. Please install MongoDB Community Server
    echo          Download from: https://www.mongodb.com/try/download/community
)

echo.

REM Setup FastAPI Backend
echo [STEP] Setting up FastAPI Backend...

if not exist "fastapi\venv" (
    echo [STEP] Creating Python virtual environment...
    call %PYTHON_CMD% -m venv fastapi\venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created
) else (
    echo [SUCCESS] Virtual environment already exists
)

echo [STEP] Activating virtual environment and installing dependencies...
call fastapi\venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Upgrade pip first
python -m pip install --upgrade pip

REM Install dependencies
pip install -r fastapi\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Python dependencies installed

REM Create .env file if it doesn't exist
if not exist "fastapi\.env" (
    if exist "fastapi\env.example" (
        copy fastapi\env.example fastapi\.env
        echo [INFO] Created .env file from env.example
        echo [WARNING] Please edit fastapi\.env with your actual credentials
    ) else (
        echo [WARNING] No env.example found. Please create fastapi\.env manually
    )
) else (
    echo [SUCCESS] .env file already exists
)

echo.

REM Setup React Frontend
echo [STEP] Setting up React Frontend...

if not exist "Frontend\node_modules" (
    echo [STEP] Installing Node.js dependencies...
    cd Frontend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Node.js dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Node.js dependencies installed
) else (
    echo [SUCCESS] Node.js dependencies already installed
)

echo [STEP] Building React application...
cd Frontend
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build React application
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Frontend built successfully

echo.

REM Launch Services
echo [STEP] Starting MediEase Clinic services...

REM Kill any existing processes on our ports
echo [STEP] Checking for processes using required ports...

REM Function to kill process on port (simplified for Windows)
powershell -Command "try { $process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1; if ($process) { Stop-Process -Id $process -Force; Write-Host 'Killed process on port 8000' } } catch { }"
powershell -Command "try { $process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1; if ($process) { Stop-Process -Id $process -Force; Write-Host 'Killed process on port 5173' } } catch { }"

echo.

REM Start FastAPI backend
echo [STEP] Starting FastAPI backend...
start "MediEase Backend" cmd /k "cd fastapi && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

REM Check if backend is running
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '[SUCCESS] FastAPI backend is ready!' } } catch { Write-Host '[WARNING] Backend may still be starting...' }"

REM Start React frontend
echo [STEP] Starting React frontend...
start "MediEase Frontend" cmd /k "cd Frontend && npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 5 /nobreak > nul

REM Check if frontend is running
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '[SUCCESS] React frontend is ready!' } } catch { Write-Host '[WARNING] Frontend may still be starting...' }"

echo.
echo ================================================
echo 🎉 MediEase Clinic is now running!
echo ================================================
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000/docs
echo.
echo 📋 To stop services:
echo    - Close the command prompt windows
echo    - Or manually kill the processes
echo.
echo Note: Edit fastapi\.env file with your actual credentials
echo ================================================

pause
