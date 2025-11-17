# How to Authenticate in Swagger UI

## Step-by-Step Instructions

### 1. Get Your Authentication Token

First, you need to login to get a Bearer token:

1. Go to `http://localhost:8000/docs` in your browser
2. Find the **Authentication** section
3. Click on `POST /api/auth/login`
4. Click **"Try it out"**
5. Enter your credentials:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
6. Click **"Execute"**
7. Copy the `accessToken` from the response

### 2. Authorize in Swagger UI

1. In Swagger UI, look for the **"Authorize"** button (usually at the top right, with a lock icon 🔒)
2. Click the **"Authorize"** button
3. In the popup, you'll see a field for "HTTPBearer"
4. Enter your token in the format: `Bearer YOUR_TOKEN_HERE`
   - Or just enter: `YOUR_TOKEN_HERE` (Swagger will add "Bearer" automatically)
5. Click **"Authorize"**
6. Click **"Close"**

### 3. Test the WhatsApp API

Now you can test the WhatsApp endpoint:

1. Find `POST /api/whatsapp/send` in the Swagger UI
2. Click **"Try it out"**
3. Enter the request body:
   ```json
   {
     "to": "whatsapp:+48572634499",
     "message": "Hello from MediEase! Your appointment is tomorrow.",
     "patient_id": null,
     "appointment_id": null
   }
   ```
4. Click **"Execute"**

## Alternative: Using cURL

If you prefer using cURL or Postman:

```bash
# First, login to get token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Then use the token to send WhatsApp message
curl -X POST "http://localhost:8000/api/whatsapp/send" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+48572634499",
    "message": "Hello from MediEase!",
    "patient_id": null,
    "appointment_id": null
  }'
```

## Troubleshooting

### "Not authenticated" Error
- Make sure you clicked "Authorize" and entered your token
- Check that your token hasn't expired (tokens expire after 30 minutes by default)
- Try logging in again to get a fresh token

### "Forbidden" Error
- Make sure your user account has one of these roles: `receptionist`, `admin`, or `doctor`
- Check that your account is active (`isActive: true`)

### Token Format
- The token should be entered without quotes
- You can include "Bearer" prefix or not - Swagger handles both

## Quick Test

1. Login: `POST /api/auth/login`
2. Copy the `accessToken`
3. Click "Authorize" button in Swagger
4. Paste token
5. Test: `POST /api/whatsapp/send`

