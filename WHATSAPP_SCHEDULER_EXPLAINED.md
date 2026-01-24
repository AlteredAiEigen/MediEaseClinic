# WhatsApp Scheduler - How It Works

## 📋 Overview

The WhatsApp scheduler automatically sends reminders to patients at specific times before/after appointments. It runs continuously in the background, checking for appointments that need reminders.

---

## ⏰ Scheduler Basics

### When Does It Run?
- **Frequency:** Every **1 hour** (3600 seconds)
- **Runs:** Continuously, 24/7
- **Started:** When FastAPI application starts
- **Location:** Runs as a background task in the application

### Configuration
```python
# From config.py
whatsapp_scheduler_interval_seconds: int = 3600  # 1 hour
```

---

## 🔄 How The Scheduler Loop Works

```
Application Starts
    ↓
Scheduler Initializes
    ↓
┌─────────────────────────────────┐
│   Scheduler Loop (Every Hour)   │
│                                   │
│   1. Check Appointment Reminders │
│   2. Check Lab Result Reminders  │
│   3. Check Follow-up Reminders   │
│                                   │
│   Wait 1 hour                    │
└─────────────────────────────────┘
    ↓
Repeat Forever...
```

---

## 📅 Reminder Type #1: Appointment Reminders (24h Before)

### When It Runs
- **Frequency:** Every hour (part of main scheduler loop)
- **Target Time:** 24 hours before appointment
- **Window:** Checks appointments 23-25 hours away

### How It Works

#### Step 1: Calculate Time Window
```python
now = datetime.utcnow()  # Current time
target_time = now + timedelta(hours=24)  # 24 hours from now
window_start = target_time - timedelta(hours=1)  # 23 hours
window_end = target_time + timedelta(hours=1)    # 25 hours
```

**Example:**
- Current time: `2025-01-16 10:00 AM`
- Target: `2025-01-17 10:00 AM` (24 hours later)
- Window: `2025-01-17 09:00 AM` to `2025-01-17 11:00 AM`

#### Step 2: Query Database
```python
query = {
    "status": "scheduled",  # Only scheduled appointments
    "appointmentReminderSent": {"$ne": True},  # Not already sent
    "date": {
        "$gte": "2025-01-17",  # Date >= window start
        "$lte": "2025-01-17"   # Date <= window end
    }
}
```

#### Step 3: Filter by Exact Time
For each appointment found:
```python
appointment_dt = parse_datetime(appointment.date, appointment.time)
# Example: 2025-01-17 10:00 AM

delta = appointment_dt - now
hours_until = delta.total_seconds() / 3600
# Example: 24.5 hours

if 23 <= hours_until <= 25:
    # Send reminder!
```

#### Step 4: Check Conditions
Before sending, checks:
1. ✅ Patient has `consent_whatsapp: true`
2. ✅ Patient has valid phone number with country code
3. ✅ Reminder not already sent (`appointmentReminderSent != true`)
4. ✅ Appointment is in the 23-25 hour window

#### Step 5: Send Message
```python
variables = {
    "patient_name": "John Doe",
    "clinic_name": "MediEase Clinic",
    "doctor_name": "Dr. Smith",
    "appointment_datetime": "2025-01-17 10:00",
    "header_clinic_name": "MediEase Clinic"
}

send_template(
    to="whatsapp:+1234567890",
    scenario="appointment_reminder",
    values=variables
)
```

#### Step 6: Mark as Sent
```python
update_appointment({
    "appointmentReminderSent": True,
    "whatsappLogs.appointment_reminder": {
        "status": "sent",
        "attemptedAt": datetime.utcnow(),
        "details": {...}
    }
})
```

### Example Timeline

```
Appointment Scheduled: Jan 15, 2025
Appointment Date: Jan 17, 2025 at 10:00 AM

Jan 16, 09:00 AM → Scheduler runs, checks appointments
                   → Finds appointment 25 hours away
                   → Too early, skips

Jan 16, 10:00 AM → Scheduler runs, checks appointments
                   → Finds appointment 24 hours away ✅
                   → Checks consent ✅
                   → Sends WhatsApp message ✅
                   → Marks appointmentReminderSent = True

Jan 16, 11:00 AM → Scheduler runs, checks appointments
                   → Finds appointment 23 hours away
                   → But appointmentReminderSent = True
                   → Skips (already sent)

Jan 17, 10:00 AM → Appointment time arrives
```

---

## 🧪 Reminder Type #2: Lab Result Reminders (24h After)

### When It Runs
- **Frequency:** Daily at **10:00 AM** (only)
- **Target Time:** 24 hours after appointment completion
- **Condition:** Appointment must have `prescribedTest` field

### How It Works

#### Step 1: Check Current Hour
```python
if datetime.utcnow().hour != 10:  # Not 10 AM?
    return  # Don't run
```

#### Step 2: Calculate Completion Window
```python
now = datetime.utcnow()  # Current time: 2025-01-16 10:00 AM
target_completion = now - timedelta(hours=24)  # 2025-01-15 10:00 AM
window_start = target_completion - timedelta(hours=1)  # 2025-01-15 09:00 AM
window_end = target_completion + timedelta(hours=1)    # 2025-01-15 11:00 AM
```

**Example:**
- Current: `2025-01-16 10:00 AM`
- Looking for: Appointments completed `2025-01-15 09:00 AM - 11:00 AM`

#### Step 3: Query Database
```python
query = {
    "status": "completed",
    "labResultReminderSent": {"$ne": True},  # Not already sent
    "completedAt": {
        "$gte": window_start,  # Completed >= 23 hours ago
        "$lte": window_end     # Completed <= 25 hours ago
    },
    "prescribedTest": {"$exists": True, "$ne": None}  # Has lab test
}
```

#### Step 4: Send Reminder
Same process as appointment reminders:
1. Check consent
2. Check phone number
3. Send template message
4. Mark as sent

### Example Timeline

```
Jan 15, 10:00 AM → Appointment completed
                  → prescribedTest: "Blood Test"

Jan 16, 09:00 AM → Scheduler runs
                  → Not 10 AM, skips lab reminders

Jan 16, 10:00 AM → Scheduler runs ✅
                  → Checks completed appointments
                  → Finds appointment completed 24h ago ✅
                  → Has prescribedTest ✅
                  → Sends lab result reminder ✅
                  → Marks labResultReminderSent = True

Jan 17, 10:00 AM → Scheduler runs
                  → Finds appointment completed 48h ago
                  → Too old, skips
```

---

## 🔁 Reminder Type #3: Follow-up Reminders (3 Days Before)

### When It Runs
- **Frequency:** Daily at **10:00 AM** (only)
- **Target Time:** 3 days before follow-up date
- **Condition:** Appointment must have `followUpRequired: true`

### How It Works

#### Step 1: Check Current Hour
```python
if datetime.utcnow().hour != 10:  # Not 10 AM?
    return  # Don't run
```

#### Step 2: Find Eligible Appointments
```python
query = {
    "followUpRequired": True,
    "followupWhatsappSent": {"$ne": True},  # Not already sent
    "status": ["completed", "checkout"],
    "completedAt": {"$exists": True}
}
```

#### Step 3: Calculate Follow-up Date
For each appointment:
```python
completed_at = appointment.completedAt  # Jan 10, 2025
followup_days = appointment.followupInDays  # 7 days
followup_date = completed_at + timedelta(days=followup_days)  # Jan 17, 2025

# Reminder should be sent 3 days before follow-up
reminder_date = followup_date - timedelta(days=3)  # Jan 14, 2025
```

#### Step 4: Check If Reminder Is Due
```python
now = datetime.utcnow()  # Jan 16, 2025

if now >= reminder_date:  # Current time >= reminder date?
    # Send reminder!
else:
    # Too early, skip
```

### Example Timeline

```
Jan 10, 2025 → Appointment completed
              → followUpRequired: true
              → followupInDays: 7
              → Follow-up date: Jan 17, 2025

Jan 14, 2025 → Reminder date (3 days before)
              → Scheduler runs at 10 AM
              → Checks if now >= reminder_date ✅
              → Sends follow-up reminder ✅
              → Marks followupWhatsappSent = True

Jan 17, 2025 → Follow-up date arrives
```

---

## 🔍 Detailed Search Logic

### Appointment Reminder Search

```python
# 1. Calculate time window
now = datetime.utcnow()
target_time = now + timedelta(hours=24)
window_start = target_time - timedelta(hours=1)
window_end = target_time + timedelta(hours=1)

# 2. Query by date range (fast database query)
query = {
    "status": "scheduled",
    "appointmentReminderSent": {"$ne": True},
    "date": {
        "$gte": window_start.strftime("%Y-%m-%d"),
        "$lte": window_end.strftime("%Y-%m-%d")
    }
}

# 3. Get all matching appointments
appointments = db.appointments.find(query)

# 4. Filter by exact time (in Python)
for appointment in appointments:
    appointment_dt = parse_datetime(appointment.date, appointment.time)
    hours_until = (appointment_dt - now).total_seconds() / 3600
    
    if 23 <= hours_until <= 25:
        # Send reminder
```

### Why This Approach?

1. **Database Query First:** Fast filtering by date
2. **Python Filter Second:** Precise time calculation
3. **Wide Window:** 23-25 hours catches all appointments
4. **Hourly Checks:** Ensures no appointments are missed

---

## ⚙️ Scheduler Code Structure

### Main Loop
```python
class AppointmentNotificationScheduler:
    def __init__(self, db, interval_seconds=3600):
        self.service = AppointmentNotificationService(db)
        self.interval_seconds = interval_seconds
    
    async def _run_loop(self):
        while not stopped:
            # Run all checks
            await self.service.process_appointment_reminders_24h()
            await self.service.process_lab_result_reminders()
            await self.service.process_followup_reminders()
            
            # Wait 1 hour
            await asyncio.sleep(3600)
```

### Why Hourly?

- **Appointment Reminders:** Need to catch appointments exactly 24h before
- **Wide Window:** 23-25 hours ensures we don't miss any
- **Efficiency:** Not too frequent, not too infrequent
- **Reliability:** If one check fails, next check catches it

---

## 📊 Real-World Example

### Scenario: Patient Has Appointment Tomorrow

**Today: Jan 16, 2025**
- 09:00 AM → Scheduler runs
  - Checks appointments 23-25h away
  - Finds appointment at Jan 17, 10:00 AM (25h away)
  - Too early, skips

- 10:00 AM → Scheduler runs
  - Checks appointments 23-25h away
  - Finds appointment at Jan 17, 10:00 AM (24h away) ✅
  - Checks consent: ✅
  - Checks phone: ✅
  - Sends WhatsApp: ✅
  - Marks sent: ✅

- 11:00 AM → Scheduler runs
  - Finds appointment at Jan 17, 10:00 AM (23h away)
  - But already sent, skips

**Tomorrow: Jan 17, 2025**
- 10:00 AM → Appointment time

---

## 🎯 Key Points

1. **Hourly Checks:** Scheduler runs every hour, 24/7
2. **Time Windows:** Uses windows (23-25h) to catch appointments
3. **One-Time Send:** Each reminder sent only once (flags prevent duplicates)
4. **Consent Required:** Only sends to patients with consent
5. **Status Tracking:** All attempts logged in `whatsappLogs`
6. **Error Handling:** Failed sends are logged but don't stop scheduler

---

## 🔧 Configuration

All timing is configurable via environment variables:

```bash
# How often scheduler runs
WHATSAPP_SCHEDULER_INTERVAL_SECONDS=3600  # 1 hour

# Appointment reminder timing
WHATSAPP_APPOINTMENT_REMINDER_LOOKAHEAD_HOURS=24  # 24 hours before

# Lab result reminder timing
WHATSAPP_LAB_RESULT_HOURS_AFTER_COMPLETION=24  # 24 hours after

# Follow-up reminder timing
WHATSAPP_FOLLOWUP_DAYS_BEFORE=3  # 3 days before

# When to send reminders (hour of day)
WHATSAPP_REMINDER_DISPATCH_HOUR=10  # 10 AM
```

---

## 📝 Summary

**The scheduler:**
1. Runs every hour automatically
2. Searches for appointments needing reminders
3. Checks consent and phone numbers
4. Sends WhatsApp messages via templates
5. Marks reminders as sent to prevent duplicates
6. Logs all activity for tracking

**It's designed to:**
- Never miss an appointment
- Never send duplicate reminders
- Respect patient consent
- Handle errors gracefully
- Run continuously without manual intervention

---

**Last Updated:** January 16, 2025

