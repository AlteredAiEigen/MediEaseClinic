#!/bin/bash

# Script to connect to a Samsung tablet via ADB wireless debugging

echo "ADB Wireless Connection Script"
echo "-----------------------------"

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo "Error: ADB is not installed or not in PATH"
    exit 1
fi

# Get the IP address from the user if not provided
if [ "$#" -eq 0 ]; then
    read -p "Enter your Samsung tablet's IP address: " DEVICE_IP
else
    DEVICE_IP=$1
fi

# Default ADB port
PORT=5555

# If IP contains port, extract it
if [[ $DEVICE_IP == *":"* ]]; then
    PORT=$(echo $DEVICE_IP | cut -d':' -f2)
    DEVICE_IP=$(echo $DEVICE_IP | cut -d':' -f1)
fi

echo "Attempting to connect to $DEVICE_IP:$PORT..."

# Kill ADB server to reset any existing connections
echo "Restarting ADB server..."
adb kill-server
adb start-server

# Connect to the device
echo "Connecting to device at $DEVICE_IP:$PORT..."
adb connect $DEVICE_IP:$PORT

# Check if connection was successful
if adb devices | grep -q "$DEVICE_IP:$PORT"; then
    echo "Successfully connected to $DEVICE_IP:$PORT"
    echo "Connected devices:"
    adb devices
else
    echo "Failed to connect to $DEVICE_IP:$PORT"
    echo "Please make sure:"
    echo "1. The tablet is on the same WiFi network as this computer"
    echo "2. Wireless debugging is enabled on the tablet"
    echo "3. The IP address and port are correct"
    echo "4. No firewall is blocking the connection"
fi

echo "-----------------------------"
