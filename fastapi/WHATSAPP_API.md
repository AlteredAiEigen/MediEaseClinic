# WhatsApp API Documentation

## Overview
The WhatsApp API allows you to send WhatsApp messages to patients through the MediEase system using Twilio.

## Setup

### 1. Environment Variables
Add the following to your `.env` file in the `fastapi` directory:

```env
# Twilio/WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC47e82de0ba5327a5fac86554acfeda39
TWILIO_AUTH_TOKEN=0088daf76a526058f5d87130abdeaa3f
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 2. Install Dependencies
Make sure `twilio` is installed:
```bash
pip install twilio
```

## API Endpoints

### 1. Send WhatsApp Message

**Endpoint:** `POST /api/whatsapp/send`

**Authentication:** Required (receptionist, admin, or doctor role)

**Request Body:**
```json
{
  "to": "whatsapp:+48572634499",
  "message": "Hello from MediEase! Please remember your appointment tomorrow.",
  "patient_id": "optional_patient_id",
  "appointment_id": "optional_appointment_id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "data": {
    "message_sid": "SM658978dfdfabe4830cb391f4ca879b72",
    "status": "queued",
    "to": "whatsapp:+48572634499",
    "from_number": "whatsapp:+14155238886",
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message here",
  "error_code": "TWILIO_ERROR"
}
```

### 2. Check Message Status

**Endpoint:** `POST /api/whatsapp/status`

**Authentication:** Required (receptionist, admin, or doctor role)

**Request Body:**
```json
{
  "message_sid": "SM658978dfdfabe4830cb391f4ca879b72"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message status retrieved successfully",
  "data": {
    "message_sid": "SM658978dfdfabe4830cb391f4ca879b72",
    "status": "delivered",
    "to": "whatsapp:+48572634499",
    "from_number": "whatsapp:+14155238886",
    "body": "Hello from MediEase!",
    "date_created": "2024-01-15T10:30:00",
    "date_sent": "2024-01-15T10:30:05",
    "date_updated": "2024-01-15T10:30:10",
    "error_code": null,
    "error_message": null
  }
}
```

### 3. Get Configuration Status (Admin Only)

**Endpoint:** `GET /api/whatsapp/config`

**Authentication:** Required (admin role only)

**Response:**
```json
{
  "success": true,
  "message": "Configuration status retrieved",
  "data": {
    "configured": true,
    "from_number": "whatsapp:+14155238886"
  }
}
```

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Send WhatsApp message
const sendWhatsAppMessage = async (to: string, message: string, patientId?: string) => {
  const response = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      to: `whatsapp:+${to}`,
      message: message,
      patient_id: patientId
    })
  });
  
  return await response.json();
};

// Check message status
const checkMessageStatus = async (messageSid: string) => {
  const response = await fetch('/api/whatsapp/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message_sid: messageSid
    })
  });
  
  return await response.json();
};
```

### Python

```python
import requests

# Send WhatsApp message
def send_whatsapp_message(to: str, message: str, token: str):
    url = "http://localhost:8000/api/whatsapp/send"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "to": f"whatsapp:+{to}",
        "message": message
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

## Message Status Values

- `queued`: Message is queued and waiting to be sent
- `sending`: Message is being sent
- `sent`: Message was sent successfully
- `delivered`: Message was delivered to recipient
- `undelivered`: Message could not be delivered
- `failed`: Message sending failed

## Important Notes

1. **Twilio WhatsApp Sandbox**: If using Twilio's sandbox, recipients must join first by sending `join [keyword]` to your Twilio WhatsApp number.

2. **Phone Number Format**: Always use the format `whatsapp:+[country code][number]` (e.g., `whatsapp:+48572634499`).

3. **Message Length**: Maximum 1600 characters per message.

4. **Rate Limits**: Be mindful of Twilio's rate limits and your account's message quota.

5. **Security**: Never expose your Twilio credentials in frontend code. Always use environment variables.

## Error Codes

- `CONFIGURATION_ERROR`: Twilio credentials not configured
- `TWILIO_ERROR`: Error from Twilio API
- `INTERNAL_ERROR`: Unexpected server error

## Testing

You can test the API using:
1. FastAPI Swagger UI: `http://localhost:8000/docs`
2. Postman or similar API client
3. The frontend application

