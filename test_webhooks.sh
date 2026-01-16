#!/bin/bash
# Quick script to test webhook endpoints

echo "=========================================="
echo "Testing WhatsApp Webhook Endpoints"
echo "=========================================="
echo ""

echo "1. Testing Status Webhook..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://app.clinic.alteredai.care/api/whatsapp/webhooks/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test123&MessageStatus=sent&To=whatsapp:+1234567890&From=whatsapp:+15558055909")

if [ "$STATUS_CODE" = "200" ]; then
  echo "   ✅ Status webhook accessible (HTTP $STATUS_CODE)"
else
  echo "   ❌ Status webhook returned HTTP $STATUS_CODE"
fi

echo ""
echo "2. Testing Incoming Message Webhook..."
INCOMING_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://app.clinic.alteredai.care/api/whatsapp/webhooks/incoming \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test456&From=whatsapp:+1234567890&To=whatsapp:+15558055909&Body=Test&AccountSid=ACtest")

if [ "$INCOMING_CODE" = "200" ]; then
  echo "   ✅ Incoming webhook accessible (HTTP $INCOMING_CODE)"
else
  echo "   ❌ Incoming webhook returned HTTP $INCOMING_CODE"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
