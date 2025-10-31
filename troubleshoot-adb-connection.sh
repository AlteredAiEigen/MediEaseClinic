#!/bin/bash

# Script to troubleshoot and fix ADB wireless connection issues

echo "ADB Wireless Connection Troubleshooter"
echo "-------------------------------------"

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo "Error: ADB is not installed or not in PATH"
    exit 1
fi

# Default values
DEVICE_IP="192.168.1.13"
PORT="43121"

# Get the IP address from the user if provided
if [ "$#" -ge 1 ]; then
    if [[ $1 == *":"* ]]; then
        DEVICE_IP=$(echo $1 | cut -d':' -f1)
        PORT=$(echo $1 | cut -d':' -f2)
    else
        DEVICE_IP=$1
        if [ "$#" -ge 2 ]; then
            PORT=$2
        fi
    fi
fi

echo "Target device: $DEVICE_IP:$PORT"

# Step 1: Completely reset ADB
echo "Step 1: Resetting ADB server..."
adb kill-server
sleep 2
adb start-server
echo "ADB server restarted."

# Step 2: Check if the device is reachable on the network
echo "Step 2: Checking if device is reachable on the network..."
if ping -c 1 $DEVICE_IP &> /dev/null; then
    echo "Device is reachable at $DEVICE_IP"
else
    echo "WARNING: Cannot ping $DEVICE_IP. Device might be unreachable or blocking ICMP."
    echo "This doesn't necessarily mean ADB won't work, but it's a potential issue."
fi

# Step 3: Try connecting with different methods
echo "Step 3: Attempting connection with different methods..."

# Method 1: Standard connect
echo "Method 1: Standard connect..."
adb connect $DEVICE_IP:$PORT
sleep 2

# Method 2: Connect with transport timeout
echo "Method 2: Connect with extended timeout..."
adb connect $DEVICE_IP:$PORT -t 60
sleep 2

# Method 3: Try reconnecting after disconnect
echo "Method 3: Disconnect and reconnect..."
adb disconnect $DEVICE_IP:$PORT
sleep 1
adb connect $DEVICE_IP:$PORT
sleep 2

# Step 4: Check the connection status
echo "Step 4: Checking connection status..."
if adb devices | grep -q "$DEVICE_IP:$PORT.*device"; then
    echo "SUCCESS: Device is now connected!"
elif adb devices | grep -q "$DEVICE_IP:$PORT.*offline"; then
    echo "ISSUE: Device is still showing as offline."
    echo "Recommendations:"
    echo "1. On your Samsung tablet, disable and re-enable Wireless debugging"
    echo "2. Make sure you've accepted the RSA key prompt on your tablet"
    echo "3. Try restarting both your computer and tablet"
    echo "4. Check if any firewall is blocking the connection"
else
    echo "ISSUE: Device is not showing up in ADB devices list."
    echo "Recommendations:"
    echo "1. On your Samsung tablet, go to Developer Options > Wireless debugging"
    echo "2. Tap on 'Pair device with pairing code'"
    echo "3. Note the IP address, port, and pairing code"
    echo "4. On your computer, run: adb pair IP:PORT (use the pairing port, not the connect port)"
    echo "5. Enter the pairing code when prompted"
    echo "6. After successful pairing, try connecting again with: adb connect $DEVICE_IP:$PORT"
fi

echo "Current ADB devices:"
adb devices

echo "-------------------------------------"
