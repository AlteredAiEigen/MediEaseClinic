"""
Check WhatsApp Message Status
Use this script to check the delivery status of a sent message
"""

from twilio.rest import Client
from twilio.base.exceptions import TwilioException

# Your Twilio credentials
account_sid = 'AC47e82de0ba5327a5fac86554acfeda39'
auth_token = '0088daf76a526058f5d87130abdeaa3f'

# Message SID from the previous send (replace with your actual SID)
message_sid = 'SM658978dfdfabe4830cb391f4ca879b72'  # Replace with your message SID


def check_message_status(message_sid):
    """Check the status of a sent message"""
    try:
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Fetch the message
        print(f"Checking status for message: {message_sid}")
        message = client.messages(message_sid).fetch()
        
        print("\n" + "=" * 50)
        print("📱 Message Status Details")
        print("=" * 50)
        print(f"Message SID: {message.sid}")
        print(f"Status: {message.status}")
        print(f"To: {message.to}")
        print(f"From: {message.from_}")
        print(f"Body: {message.body[:50]}..." if len(message.body) > 50 else f"Body: {message.body}")
        print(f"Date Created: {message.date_created}")
        print(f"Date Sent: {message.date_sent}")
        print(f"Date Updated: {message.date_updated}")
        print(f"Error Code: {message.error_code if message.error_code else 'None'}")
        print(f"Error Message: {message.error_message if message.error_message else 'None'}")
        print("=" * 50)
        
        # Status interpretation
        status_meanings = {
            'queued': '⏳ Message is queued and waiting to be sent',
            'sending': '📤 Message is being sent',
            'sent': '✅ Message was sent successfully',
            'delivered': '📬 Message was delivered to recipient',
            'undelivered': '❌ Message could not be delivered',
            'failed': '❌ Message sending failed',
            'received': '📥 Message was received (for incoming messages)'
        }
        
        status_meaning = status_meanings.get(message.status, f'❓ Unknown status: {message.status}')
        print(f"\nStatus Meaning: {status_meaning}")
        
        # Troubleshooting tips based on status
        if message.status == 'queued':
            print("\n💡 Tips:")
            print("   - If message stays in 'queued' for more than 5 minutes, check:")
            print("     1. Recipient number is registered in Twilio WhatsApp Sandbox")
            print("     2. Recipient sent the join code to your Twilio WhatsApp number")
            print("     3. Your Twilio account has sufficient credits")
            print("     4. The phone number format is correct (whatsapp:+[country][number])")
        elif message.status == 'undelivered' or message.status == 'failed':
            print("\n💡 Troubleshooting:")
            if message.error_code:
                print(f"   Error Code: {message.error_code}")
                print(f"   Error Message: {message.error_message}")
            print("   - Verify recipient number is correct")
            print("   - Check if recipient joined Twilio WhatsApp Sandbox")
            print("   - Ensure recipient number format is correct")
        
        return message
        
    except TwilioException as e:
        print(f"❌ Twilio Error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None


if __name__ == "__main__":
    print("=" * 50)
    print("🔍 WhatsApp Message Status Checker")
    print("=" * 50)
    print()
    
    # You can also pass message SID as command line argument
    import sys
    if len(sys.argv) > 1:
        message_sid = sys.argv[1]
    
    check_message_status(message_sid)
    print()

