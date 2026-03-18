#!/bin/bash
# Test script to send WhatsApp messages using templates
# Usage: ./test_template_message.sh [template_name]
# Example: ./test_template_message.sh appointment_reminder

echo "=" | tr -d '\n' && printf '=%.0s' {1..59} && echo ""
echo "WHATSAPP TEMPLATE MESSAGE TESTER"
echo "=" | tr -d '\n' && printf '=%.0s' {1..59} && echo ""

cd /home/ec2-user/MediEaseClinic/fastapi
source venv/bin/activate

TEMPLATE_NAME="${1:-}"
export TEMPLATE_NAME

python3 << 'PYEOF'
import asyncio
import sys
import os
from datetime import datetime

sys.path.insert(0, os.getcwd())

from app.database import Database
from app.services.whatsapp_template_service import WhatsAppTemplateService

# Test phone number
TEST_PHONE = "whatsapp:+917006590467"

# Default values for template variables
DEFAULT_VALUES = {
    "patient_name": "Sunpreet Kour",
    "clinic_name": "MediEase Clinic",
    "doctor_name": "Dr. Test",
    "appointment_datetime": "Today at 5:00 PM",
    "clinic_email": "support@mediease.com",
    "clinic_phone": "+91 7006590467",
    "visit_date": datetime.now().strftime("%Y-%m-%d"),
    "visit_time": "05:00 PM",
    "header_clinic_name": "MediEase Clinic",
    "appointment_date": datetime.now().strftime("%B %d, %Y"),
    "appointment_time": "5:00 PM",
}

async def list_templates(db):
    """List all available templates."""
    templates = await db.whatsapp_templates.find({}).to_list(length=50)
    
    if not templates:
        print("❌ No templates found in database!")
        return []
    
    print(f"\n✅ Found {len(templates)} template(s):\n")
    for i, t in enumerate(templates, 1):
        template_name = t.get('template_name', 'N/A')
        content_sid = t.get('content_sid') or t.get('contentSid', 'NOT SET')
        variables = t.get('variables', [])
        
        print(f"{i}. {template_name}")
        print(f"   Content SID: {content_sid}")
        print(f"   Variables: {len(variables)}")
        if variables:
            var_names = []
            for v in variables:
                if isinstance(v, dict):
                    var_names.append(v.get('name') or v.get('key', 'N/A'))
                elif isinstance(v, str):
                    var_names.append(v)
            print(f"   Variable names: {', '.join(var_names)}")
        print()
    
    return templates

async def send_test_message(template_name=None):
    """Send a test message using a template."""
    try:
        # Initialize database
        await Database.connect_db()
        db = Database.get_database()
        
        # Initialize template service
        template_service = WhatsAppTemplateService(db)
        
        if not template_service.is_configured():
            print("❌ Twilio Content API not configured!")
            print("   Please check your Twilio credentials in environment variables.")
            return
        
        print(f"✅ Twilio configured. From number: {template_service.from_number}")
        
        # List all templates
        templates = await list_templates(db)
        
        if not templates:
            return
        
        # Get template name from environment or use first
        import sys
        template_arg = os.environ.get('TEMPLATE_NAME', '')
        
        # Select template
        selected_template = None
        if template_arg:
            # Find by name
            selected_template = next(
                (t for t in templates if t.get('template_name') == template_arg),
                None
            )
            if not selected_template:
                print(f"❌ Template '{template_arg}' not found!")
                print("\nAvailable templates:")
                for t in templates:
                    print(f"  - {t.get('template_name')}")
                return
        else:
            # Use first template
            selected_template = templates[0]
            print(f"\n📝 Using first template: {selected_template.get('template_name')}")
        
        template_name = selected_template.get('template_name')
        content_sid = selected_template.get('content_sid') or selected_template.get('contentSid')
        
        if not content_sid:
            print(f"❌ Template '{template_name}' has no content_sid!")
            return
        
        print(f"\n📤 Sending test message...")
        print(f"   Template: {template_name}")
        print(f"   Content SID: {content_sid}")
        print(f"   To: {TEST_PHONE}")
        print(f"   Variables: {DEFAULT_VALUES}")
        
        # Send message
        result = await template_service.send(
            to=TEST_PHONE,
            scenario=template_name,
            values=DEFAULT_VALUES,
            patient_id=None,
            appointment_id=None,
        )
        
        print("\n" + "=" * 60)
        if result.get("success"):
            print("✅ MESSAGE SENT SUCCESSFULLY!")
            print("=" * 60)
            print(f"Message SID: {result.get('message_sid')}")
            print(f"Status: {result.get('status')}")
            print(f"To: {result.get('to')}")
            print(f"From: {result.get('from_number')}")
            print(f"Timestamp: {result.get('timestamp')}")
            if result.get('content_vars'):
                print(f"\nContent Variables Used:")
                for pos, val in result.get('content_vars', {}).items():
                    print(f"  Position {pos}: {val}")
        else:
            print("❌ FAILED TO SEND MESSAGE")
            print("=" * 60)
            print(f"Error Code: {result.get('error_code', 'UNKNOWN')}")
            print(f"Error Message: {result.get('error_message', 'No error message')}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Get template name from environment variable set by bash script
    template_name = os.environ.get('TEMPLATE_NAME', None)
    
    if template_name:
        print(f"Template specified: {template_name}")
    else:
        print("No template specified - will use first available template")
    
    asyncio.run(send_test_message(template_name))
PYEOF
