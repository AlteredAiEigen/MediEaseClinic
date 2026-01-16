#!/bin/bash
# Quick script to send a test message and check status

echo "Sending test message from +15558925441 to +917006590467..."
echo ""

cd /home/ec2-user/MediEaseClinic/fastapi
source venv/bin/activate

python3 << 'PYEOF'
import asyncio
import sys
import os
sys.path.insert(0, os.getcwd())

from twilio.rest import Client
from app.config import settings
from app.database import Database

async def check():
    await Database.connect_db()
    db = Database.get_database()

    # Send a test message via Twilio
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        print("❌ Twilio credentials not configured")
        return

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    from_number = "whatsapp:+15558925441"
    to_number = "whatsapp:+917006590467"
    message_body = "Test message from MediEase system"

    try:
        msg = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )
        print(f"✅ Message Sent!")
        print(f"   SID: {msg.sid}")
        print(f"   Status: {msg.status}")
        print(f"   From: {from_number}")
        print(f"   To: {to_number}")
    except Exception as e:
        print(f"❌ Failed to send message: {e}")
        return
    
    messages = await db.whatsapp_messages.find({
        "to": {"$regex": "917006590467"}
    }).sort("created_at", -1).limit(1).to_list(length=1)
    
    if messages:
        msg = messages[0]
        print(f"✅ Message Found!")
        print(f"   SID: {msg.get('message_sid', 'N/A')}")
        print(f"   Status: {msg.get('status', 'N/A')}")
        print(f"   To: {msg.get('to', 'N/A')}")
        if msg.get('status_updated_at'):
            print(f"   Last Update: {msg.get('status_updated_at')}")
    else:
        print("⚠️  No message found yet")

asyncio.run(check())
PYEOF

