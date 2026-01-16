# How to Find WhatsApp Webhook Configuration in Twilio

Based on your screenshot, you're on the **Voice Configuration** page. You need to find the **Messaging Configuration** section.

---

## 📍 Option 1: Scroll Down on Current Page

On the same page you're viewing (Phone Number Configure tab):

1. **Scroll down** past the "Voice Configuration" section
2. Look for a section titled **"Messaging Configuration"** or **"SMS Configuration"**
3. You should see:
   - **"A MESSAGE COMES IN"** field ← This is where you configure the incoming webhook
   - **"Status Callback URL"** field (may be here or in global settings)

---

## 📍 Option 2: Use Direct Links

### For Incoming Message Webhook:

**Direct Link to Your Phone Number:**
```
https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/PN047ea3e852f5795deaf56c16f2779b9d/configure
```

1. On this page, scroll down past "Voice Configuration"
2. Find **"Messaging Configuration"** section
3. Look for **"A MESSAGE COMES IN"** field

### For Status Callback (Global Setting):

**Direct Link:**
```
https://console.twilio.com/us1/develop/sms/settings/general
```

1. Go to this URL
2. Scroll to **"Status Callback URL"** section
3. Enter the webhook URL

---

## 📍 Option 3: Navigate via Sidebar

From where you are now:

1. In the **left sidebar**, click **"Messaging"**
2. Click **"Settings"** (expand if needed)
3. Click **"General"**
4. Scroll to **"Status Callback URL"** section

For the phone number webhook:
1. Stay on the phone number page
2. Scroll down past Voice Configuration
3. Find **"Messaging Configuration"**

---

## 🔍 What to Look For

On the phone number configuration page, you should see sections in this order:

1. ✅ **Voice Configuration** (you're here)
2. ⬇️ Scroll down ⬇️
3. 📱 **Messaging Configuration** ← **YOU NEED THIS SECTION**
   - "A MESSAGE COMES IN" dropdown
   - URL input field
   - HTTP method dropdown

---

## 🎯 If You Can't Find "Messaging Configuration"

### Check 1: Is this a WhatsApp-enabled number?

- The number shown is `(507) 417-0175` 
- Your WhatsApp number should be: `+15558055909`
- **Make sure you're configuring the correct number!**

### Check 2: WhatsApp Senders Section

If messaging config isn't on the phone number page:

1. Go to **Messaging** → **Senders** → **WhatsApp senders**
2. Find your WhatsApp sender
3. Configure webhook there

### Check 3: Try it Out Section

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Look for webhook configuration options there

---

## 📸 Visual Guide

The page structure should look like:

```
┌─────────────────────────────────────┐
│ Phone Number: (507) 417-0175        │
│ Tabs: [Properties] [Configure] ... │
├─────────────────────────────────────┤
│ Voice Configuration                 │ ← You're here
│   - A call comes in                 │
│   - Primary handler fails           │
├─────────────────────────────────────┤
│ ⬇️ SCROLL DOWN ⬇️                    │
├─────────────────────────────────────┤
│ Messaging Configuration             │ ← YOU NEED THIS
│   - A MESSAGE COMES IN              │ ← Configure here
│     [Webhook ▼]                     │
│     [URL input field]               │
│     [HTTP POST ▼]                   │
├─────────────────────────────────────┤
│ Status Callback URL                 │ ← Or here
│   [URL input field]                 │
└─────────────────────────────────────┘
```

---

## ✅ Quick Action Steps

1. **Stay on the current page** (Phone Number Configure tab)
2. **Scroll down** past "Voice Configuration"
3. **Look for "Messaging Configuration"** section
4. **Find "A MESSAGE COMES IN"** field
5. **Enter:** `https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming`
6. **Set method:** POST
7. **Save**

---

## 🆘 Still Can't Find It?

**Alternative:** Configure via API or check if you need to enable WhatsApp first:

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. This will show WhatsApp-specific configuration
3. Or check **Messaging** → **Senders** → **WhatsApp senders**

---

**Note:** Make sure you're configuring the WhatsApp number (`+15558055909`), not the regular phone number shown in your screenshot!

