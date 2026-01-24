#!/usr/bin/env python3
"""
Quick script to check WhatsApp templates in MongoDB.
Run this from the fastapi directory: python3 check_whatsapp_templates.py
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Database

async def check_templates():
    try:
        # Initialize database connection
        await Database.connect_db()
        db = Database.get_database()
        
        print("=" * 60)
        print("WHATSAPP TEMPLATES IN DATABASE")
        print("=" * 60)
        
        # Check templates
        templates = await db.whatsapp_templates.find({}).to_list(length=20)
        
        if not templates:
            print("\n⚠️  NO TEMPLATES FOUND!")
            print("\nYou need to insert templates into the 'whatsapp_templates' collection.")
            print("\nRequired templates:")
            print("  1. appointment_reminder")
            print("  2. post_visit_lab_request")
            print("  3. followup_appointment_reminder")
            print("\nEach template needs:")
            print("  - template_name: string")
            print("  - content_sid: string (from Twilio Content API)")
            print("  - variables: array of variable definitions")
            print("\nExample template structure:")
            print("""
{
  "template_name": "appointment_reminder",
  "content_sid": "HX...",  // Get this from Twilio Content API
  "variables": [
    {"position": "1", "name": "patient_name"},
    {"position": "2", "name": "clinic_name"},
    {"position": "3", "name": "doctor_name"},
    {"position": "4", "name": "appointment_datetime"},
    {"position": "5", "name": "header_clinic_name"}
  ]
}
            """)
        else:
            print(f"\n✅ Found {len(templates)} template(s):\n")
            for i, t in enumerate(templates, 1):
                print(f"{'=' * 60}")
                print(f"Template #{i}")
                print(f"{'=' * 60}")
                print(f"Template Name: {t.get('template_name', 'N/A')}")
                print(f"Content SID:   {t.get('content_sid') or t.get('contentSid', 'NOT SET')}")
                
                vars_list = t.get('variables', [])
                print(f"Variables:     {len(vars_list)} variable(s)")
                
                if vars_list:
                    print("\nVariable Details:")
                    for v in vars_list:
                        if isinstance(v, dict):
                            pos = v.get('position') or v.get('pos') or 'N/A'
                            name = v.get('name') or v.get('key') or v.get('variable_name') or 'N/A'
                            print(f"  - Position: {pos}, Name: {name}")
                        else:
                            print(f"  - {v}")
                
                print()
        
        # Also check if collection exists
        collections = await db.list_collection_names()
        if 'whatsapp_templates' not in collections:
            print("⚠️  Collection 'whatsapp_templates' does not exist!")
            print("   It will be created automatically when you insert the first template.")
        
        print("\n" + "=" * 60)
        print("VERIFICATION COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_templates())

