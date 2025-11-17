"""
WhatsApp SMS Sender using Twilio
Run this script to send WhatsApp messages via Twilio API
"""

from twilio.rest import Client
from twilio.base.exceptions import TwilioException

# Your Twilio account SID and Auth Token (get from Twilio Console)
# TODO: Move these to environment variables for security
account_sid = 'AC47e82de0ba5327a5fac86554acfeda39'
auth_token = '0088daf76a526058f5d87130abdeaa3f'

# Twilio sandbox WhatsApp number and recipient's WhatsApp number
# Format: 'whatsapp:+[country code][phone number]'
from_whatsapp_number = 'whatsapp:+14155238886'  # Your Twilio WhatsApp number
to_whatsapp_number = 'whatsapp:+48572634499'  # Replace with the recipient's number
# to_whatsapp_number = 'whatsapp:+48572634499'  # Poland number

# Message to send (reminders, surveys, etc.)
# message_body = 'Hello from MediEase! Please remember your appointment tomorrow.'
message_body = 'Hello from MediEase! Please remember to send your lab results to alteredai@alertedai.care'


def send_whatsapp_message():
    """Send a WhatsApp message via Twilio"""
    try:
        # Initialize Twilio client
        print("Initializing Twilio client...")
        client = Client(account_sid, auth_token)
        
        # Send message
        print(f"Sending message to {to_whatsapp_number}...")
        message = client.messages.create(
            body=message_body,
            from_=from_whatsapp_number,
            to=to_whatsapp_number
        )
        
        print(f"✅ Message sent successfully!")
        print(f"   Message SID: {message.sid}")
        print(f"   Status: {message.status}")
        print(f"   To: {message.to}")
        print(f"   From: {message.from_}")
        print()
        print("💡 To check message delivery status, run:")
        print(f"   python check_message_status.py {message.sid}")
        print()
        print("⚠️  Important Notes:")
        print("   - If using Twilio WhatsApp Sandbox, recipient must join first")
        print("   - Send 'join [your-sandbox-keyword]' to +14155238886")
        print("   - Message delivery can take 1-5 minutes")
        
        return message
        
    except TwilioException as e:
        print(f"❌ Twilio Error: {e}")
        print("\nCommon issues:")
        print("1. Check your Twilio account SID and Auth Token")
        print("2. Verify the recipient number is registered in Twilio Sandbox")
        print("3. Ensure you have sufficient Twilio credits")
        print("4. Check if the WhatsApp number format is correct (whatsapp:+[country][number])")
        return None
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None


if __name__ == "__main__":
    print("=" * 50)
    print("📱 MediEase WhatsApp SMS Sender")
    print("=" * 50)
    print()
    send_whatsapp_message()
    print()
    print("=" * 50)
