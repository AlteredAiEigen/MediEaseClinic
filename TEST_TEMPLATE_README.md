# WhatsApp Template Message Tester

This script allows you to test sending WhatsApp messages using templates stored in your database.

## Usage

```bash
# List all templates and send using the first one
./test_template_message.sh

# Send using a specific template
./test_template_message.sh appointment_reminder
./test_template_message.sh post_visit_lab_request
./test_template_message.sh followup_appointment_reminder
```

## Available Templates

1. **appointment_reminder**
   - Variables: clinic_name, patient_name, doctor_name, appointment_datetime, clinic_phone

2. **post_visit_lab_request**
   - Variables: patient_name, clinic_name, lab_upload_number

3. **followup_appointment_reminder**
   - Variables: clinic_name, patient_name, visit_type, visit_datetime, clinic_phone

## Test Phone Number

The script sends messages to: **+91 7006590467**

To change the test phone number, edit `TEST_PHONE` in the script.

## Default Values

The script uses these default values for template variables:
- patient_name: "Sunpreet Kour"
- clinic_name: "MediEase Clinic"
- doctor_name: "Dr. Test"
- appointment_datetime: "Today at 5:00 PM"
- clinic_phone: "+91 7006590467"
- And more...

To customize values, edit the `DEFAULT_VALUES` dictionary in the script.

## Output

The script will:
1. List all available templates
2. Show which template is being used
3. Display the message details
4. Show success/failure status
5. Display the Message SID for tracking

## Example Output

```
============================================================
WHATSAPP TEMPLATE MESSAGE TESTER
============================================================
✅ Twilio configured. From number: whatsapp:+14155238886

✅ Found 3 template(s):

1. appointment_reminder
   Content SID: HXc146ed9db9869daa20666dc31ba5d28b
   Variables: 5
   Variable names: clinic_name, patient_name, doctor_name, appointment_datetime, clinic_phone

📝 Using first template: appointment_reminder

📤 Sending test message...
   Template: appointment_reminder
   Content SID: HXc146ed9db9869daa20666dc31ba5d28b
   To: whatsapp:+917006590467

============================================================
✅ MESSAGE SENT SUCCESSFULLY!
============================================================
Message SID: MM22e5c97b09388e46473b808536e9e450
Status: queued
To: whatsapp:+917006590467
From: whatsapp:+14155238886
============================================================
```
