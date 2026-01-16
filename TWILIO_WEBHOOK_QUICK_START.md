# Twilio Webhook Quick Start Guide
**5-Minute Setup**

---

## 🎯 What You Need to Do

Configure **2 webhook URLs** in Twilio Console:

### Webhook URLs:
1. **Status Callback:** `https://app.clinic.alteredai.care/api/whatsapp/webhooks/status`
2. **Incoming Messages:** `https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming`

---

## 📍 Where to Configure

### 1. Status Callback URL

**Path:** Twilio Console → **Messaging** → **Settings** → **General**

1. Go to: https://console.twilio.com/us1/develop/sms/settings/general
2. Scroll to **"Status Callback URL"**
3. Paste: `https://app.clinic.alteredai.care/api/whatsapp/webhooks/status`
4. Method: **POST**
5. Click **Save**

---

### 2. Incoming Message Webhook

**Path:** Twilio Console → **Phone Numbers** → Your WhatsApp Number

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Click on your WhatsApp number: `+15558055909`
3. Scroll to **"Messaging Configuration"**
4. Find **"A MESSAGE COMES IN"**
5. Paste: `https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming`
6. Method: **POST**
7. Click **Save**

---

## ✅ Verify It Works

Run this command:
```bash
cd /home/ec2-user/MediEaseClinic
./test_webhooks.sh
```

Both webhooks should return ✅ (HTTP 200)

---

## 🎉 Done!

After configuration:
- ✅ Status updates will be received automatically
- ✅ Patient messages will be processed automatically
- ✅ System is fully operational

---

**Need detailed instructions?** See `TWILIO_WEBHOOK_SETUP_GUIDE.md`

