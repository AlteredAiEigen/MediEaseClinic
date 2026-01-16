#!/usr/bin/env python3
"""
Verify webhooks are working by checking recent activity in database
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'fastapi'))

from app.database import Database

async def check_webhook_activity():
    try:
        await Database.connect_db()
        db = Database.get_database()
        
        print("=" * 70)
        print("CHECKING WEBHOOK ACTIVITY")
        print("=" * 70)
        
        # Check for messages received in last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        recent_status_updates = await db.whatsapp_messages.find({
            "status_updated_at": {"$gte": yesterday}
        }).sort("status_updated_at", -1).limit(10).to_list(length=10)
        
        recent_incoming = await db.whatsapp_messages.find({
            "direction": "inbound",
            "received_at": {"$gte": yesterday.isoformat()}
        }).sort("received_at", -1).limit(10).to_list(length=10)
        
        print(f"\n📨 Status Updates (last 24h): {len(recent_status_updates)}")
        if recent_status_updates:
            for msg in recent_status_updates[:5]:
                print(f"   - {msg.get('message_sid')[:20]}... → {msg.get('status')} at {msg.get('status_updated_at')}")
        else:
            print("   No status updates yet (send a message to test)")
        
        print(f"\n📩 Incoming Messages (last 24h): {len(recent_incoming)}")
        if recent_incoming:
            for msg in recent_incoming[:5]:
                print(f"   - From: {msg.get('from')}, Body: {msg.get('body', '')[:50]}...")
        else:
            print("   No incoming messages yet")
        
        # Check appointments with recent WhatsApp activity
        recent_apt_logs = await db.appointments.find({
            "whatsappLogs": {"$exists": True, "$ne": {}},
            "updatedAt": {"$gte": yesterday}
        }).sort("updatedAt", -1).limit(5).to_list(length=5)
        
        print(f"\n📋 Appointments with WhatsApp Activity (last 24h): {len(recent_apt_logs)}")
        if recent_apt_logs:
            for apt in recent_apt_logs:
                logs = apt.get('whatsappLogs', {})
                print(f"   - {apt.get('appointmentId')}: {len(logs)} log(s)")
                for scenario, log_data in logs.items():
                    if isinstance(log_data, dict):
                        status = log_data.get('status', 'unknown')
                        print(f"     • {scenario}: {status}")
        
        print("\n" + "=" * 70)
        print("HOW TO TEST:")
        print("=" * 70)
        print("1. Send a WhatsApp message FROM your WhatsApp number TO a test number")
        print("2. Check Twilio Console → Monitor → Logs → Messaging")
        print("3. Look for webhook delivery attempts")
        print("4. Run this script again to see activity")
        print("\nOr wait for the scheduler to send appointment reminders automatically!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_webhook_activity())

