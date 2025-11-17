# How to Add Twilio Credentials to .env File

## Quick Fix

Add these three lines to your `.env` file in the `fastapi` directory:

```env
# Twilio/WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC47e82de0ba5327a5fac86554acfeda39
TWILIO_AUTH_TOKEN=0088daf76a526058f5d87130abdeaa3f
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Step-by-Step Instructions

### 1. Locate your .env file
- Navigate to the `fastapi` folder
- Look for a file named `.env`
- If it doesn't exist, create a new file named `.env`

### 2. Add the Twilio credentials
Open the `.env` file in a text editor and add these lines at the end:

```env
# Twilio/WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC47e82de0ba5327a5fac86554acfeda39
TWILIO_AUTH_TOKEN=0088daf76a526058f5d87130abdeaa3f
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Save the file
- Save the `.env` file

### 4. Restart your FastAPI server
**IMPORTANT:** You must restart your FastAPI server for the changes to take effect!

- Stop your current server (Ctrl+C)
- Start it again

### 5. Test the API
- Go to Swagger UI: `http://localhost:8000/docs`
- Authenticate (if not already done)
- Try `POST /api/whatsapp/send` again

## Your .env file should look like this:

```env
# ... your existing configuration ...

# Twilio/WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC47e82de0ba5327a5fac86554acfeda39
TWILIO_AUTH_TOKEN=0088daf76a526058f5d87130abdeaa3f
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Verification

After restarting, you can verify the configuration by:
1. Calling `GET /api/whatsapp/config` (requires admin role)
2. It should return: `{"configured": true, "from_number": "whatsapp:+14155238886"}`

## Troubleshooting

### Still getting "Service Unavailable"?
- Make sure you **restarted** the FastAPI server after adding the credentials
- Check that the `.env` file is in the `fastapi` directory (same folder as `main.py`)
- Verify there are no extra spaces or quotes around the values
- Check server logs for any error messages

### Environment variable names
Make sure you use these exact names (case-insensitive, but recommended to use uppercase):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`

