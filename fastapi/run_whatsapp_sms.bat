@echo off
REM Script to run WhatsApp SMS sender
echo ================================================
echo 📱 Running WhatsApp SMS Sender
echo ================================================
echo.

REM Navigate to fastapi directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run the setup script first or create a virtual environment.
    pause
    exit /b 1
)

REM Activate virtual environment
echo [STEP] Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if twilio is installed
python -c "import twilio" 2>nul
if errorlevel 1 (
    echo [WARNING] Twilio not found. Installing twilio...
    pip install twilio
    if errorlevel 1 (
        echo [ERROR] Failed to install twilio. Please install manually.
        pause
        exit /b 1
    )
)

REM Run the WhatsApp SMS script
echo [STEP] Running WhatsApp SMS script...
echo.
python watsapp_sms.py

echo.
echo [DONE] Script execution completed.
pause

