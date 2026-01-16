# Twilio Webhook Configuration Guide
**For MediEase Clinic WhatsApp Integration**

---

## 📋 Prerequisites

- Twilio Account (you already have credentials configured)
- Access to Twilio Console: https://console.twilio.com
- WhatsApp Business Number: `whatsapp:+15558055909`

---

## 🔗 Webhook URLs to Configure

You need to configure **2 webhook URLs**:

1. **Status Callback URL** (for message delivery status):
   ```
   https://app.clinic.alteredai.care/api/whatsapp/webhooks/status
   ```

2. **Incoming Message Webhook URL** (for patient messages):
   ```
   https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming
   ```

---

## 📝 Step-by-Step Instructions

### **Step 1: Configure Status Callback URL**

This webhook receives delivery status updates (sent, delivered, failed, etc.) for all WhatsApp messages.

#### Option A: Global Status Callback (Recommended)

1. Log into [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Settings** → **General**
3. Scroll down to **"Status Callback URL"** section
4. Enter:
   ```
   https://app.clinic.alteredai.care/api/whatsapp/webhooks/status
   ```
5. Select **HTTP Method**: `POST`
6. Click **Save**

#### Option B: Per-Message Status Callback (Already Implemented)

**Note:** The code already sets `status_callback` for each message sent via Content API, so this is optional. However, setting it globally ensures ALL messages (including those sent via basic API) get status updates.

---

### **Step 2: Configure Incoming Message Webhook**

This webhook receives messages sent by patients to your WhatsApp number.

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Find your WhatsApp number: `+15558055909` (or search for it)
3. Click on the phone number to open its configuration
4. Scroll down to **"Messaging Configuration"** section
5. Find **"A MESSAGE COMES IN"** field
6. Enter:
   ```
   https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming
   ```
7. Select **HTTP Method**: `POST`
8. Click **Save**

**Alternative Path (if using WhatsApp Senders):**
- Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
- Or **Messaging** → **Senders** → Select your WhatsApp sender
- Configure webhook there

---

## ✅ Verification Steps

### Test 1: Verify Webhook Endpoints Are Accessible

Run these commands to test:

```bash
# Test Status Webhook
curl -X POST https://app.clinic.alteredai.care/api/whatsapp/webhooks/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test123&MessageStatus=sent&To=whatsapp:+1234567890&From=whatsapp:+15558055909"

# Test Incoming Webhook  
curl -X POST https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test456&From=whatsapp:+1234567890&To=whatsapp:+15558055909&Body=Test&AccountSid=ACtest"
```

Both should return `{"status": "ok"}` or `{"status": "error", "message": "..."}`

### Test 2: Send a Test WhatsApp Message

1. Send a test message from your WhatsApp number to a test number
2. Check Twilio Console → **Monitor** → **Logs** → **Messaging**
3. Look for webhook delivery attempts
4. Check your application logs for webhook receipt

### Test 3: Check Application Logs

After sending a message, check your FastAPI logs:

```bash
# If using systemd service
sudo journalctl -u your-fastapi-service -f

# Or check log files
tail -f /path/to/your/logs/app.log | grep -i "webhook\|whatsapp"
```

You should see log entries like:
```
Twilio status webhook received: MessageSid=SM..., Status=delivered, To=..., From=...
```

---

## 🔍 Troubleshooting

### Issue: Webhook Not Receiving Requests

**Check:**
1. ✅ Webhook URL is correct (no typos)
2. ✅ URL is publicly accessible (not localhost)
3. ✅ HTTPS is used (Twilio requires HTTPS)
4. ✅ Server is running and accessible
5. ✅ Firewall allows incoming connections on port 443

**Test:**
```bash
# Test if your server is accessible
curl -I https://app.clinic.alteredai.care/api/whatsapp/webhooks/status
```

### Issue: Webhook Returns Error

**Check Application Logs:**
- Look for error messages in FastAPI logs
- Check MongoDB connection
- Verify database collections exist

**Common Errors:**
- `405 Method Not Allowed` → Webhook expects POST, not GET
- `500 Internal Server Error` → Check application logs
- `401 Unauthorized` → Check if authentication is blocking webhooks (should be public)

### Issue: Status Updates Not Appearing

**Check:**
1. Status callback URL is configured correctly
2. Messages are being sent with `status_callback` parameter (already in code)
3. Check `whatsapp_messages` collection in MongoDB for status updates
4. Check `appointments.whatsappLogs` for status updates

---

## 📊 Monitoring Webhook Delivery

### In Twilio Console:

1. Go to **Monitor** → **Logs** → **Messaging**
2. Filter by your WhatsApp number
3. Click on any message
4. Scroll to **"Webhook"** section
5. See webhook delivery attempts and responses

### In Your Application:

Check MongoDB collections:
```javascript
// Check status webhook activity
db.whatsapp_messages.find({}).sort({status_updated_at: -1}).limit(10)

// Check appointment WhatsApp logs
db.appointments.find({"whatsappLogs": {$exists: true}}).pretty()
```

---

## 🎯 Expected Behavior After Configuration

### When a Message is Sent:

1. ✅ Message sent via Twilio API
2. ✅ Twilio queues message for delivery
3. ✅ Status webhook receives: `queued` → `sent` → `delivered`
4. ✅ Status updates stored in `whatsapp_messages` collection
5. ✅ Status updates stored in `appointments.whatsappLogs`

### When Patient Sends a Message:

1. ✅ Patient sends WhatsApp message to your number
2. ✅ Incoming webhook receives message
3. ✅ Message stored in `whatsapp_messages` collection
4. ✅ Patient record found (if phone matches)
5. ✅ Message stored in `messages` collection
6. ✅ Auto-reply sent (if configured)

---

## 🔐 Security Notes

### Webhook Authentication (Optional but Recommended)

Twilio can sign webhooks with HMAC-SHA256. To verify signatures:

1. Get your **Auth Token** from Twilio Console
2. Twilio sends `X-Twilio-Signature` header
3. Verify signature matches request body + Auth Token

**Note:** Current implementation doesn't verify signatures (for simplicity), but you can add this for production security.

---

## 📝 Quick Reference

### Webhook URLs:
- **Status:** `https://app.clinic.alteredai.care/api/whatsapp/webhooks/status`
- **Incoming:** `https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming`

### Twilio Console Links:
- **Messaging Settings:** https://console.twilio.com/us1/develop/sms/settings/general
- **Phone Numbers:** https://console.twilio.com/us1/develop/phone-numbers/manage/active
- **Logs:** https://console.twilio.com/us1/monitor/logs/messaging

### WhatsApp Number:
- `whatsapp:+15558055909`

---

## ✅ Checklist

- [ ] Status Callback URL configured in Messaging Settings
- [ ] Incoming Message Webhook configured for WhatsApp number
- [ ] Both webhooks set to POST method
- [ ] Webhook URLs tested and accessible
- [ ] Test message sent and webhook received
- [ ] Status updates appearing in logs
- [ ] Incoming messages being processed

---

## 🆘 Need Help?

If webhooks aren't working:

1. **Check Twilio Console Logs** - See webhook delivery attempts
2. **Check Application Logs** - See if requests are reaching your server
3. **Test Webhook URLs** - Use curl commands above
4. **Verify Server Accessibility** - Ensure HTTPS is working
5. **Check Firewall** - Ensure port 443 is open

---

**Last Updated:** $(date)
**Status:** Ready for Configuration

