# Follow-up Reminders & All Message Types Explained

## 🔁 Follow-up Reminder - Complete Guide

### How Follow-up Works

Follow-up reminders are sent **3 days BEFORE** the follow-up date, not 3 days after completion.

---

## 📋 Step-by-Step: Follow-up Reminder Flow

### Step 1: Appointment Completion

When an appointment is completed:

```javascript
{
  status: "completed",
  completedAt: "2025-01-10T10:00:00Z",
  followUpRequired: true,
  followupInDays: 7,  // Or parsed from followUpInstructions
  followUpInstructions: "Follow up in 7 days"
}
```

### Step 2: Calculate Follow-up Date

```python
completed_at = "2025-01-10 10:00 AM"
followup_days = 7  # From appointment.followupInDays

followup_date = completed_at + timedelta(days=followup_days)
# Result: 2025-01-17 10:00 AM (7 days later)
```

### Step 3: Calculate Reminder Date

```python
reminder_date = followup_date - timedelta(days=3)
# Result: 2025-01-14 10:00 AM (3 days before follow-up)
```

### Step 4: Scheduler Checks Daily

**Runs:** Only at 10:00 AM daily

```python
# January 11, 10:00 AM
now = "2025-01-11 10:00 AM"
reminder_date = "2025-01-14 10:00 AM"
if now >= reminder_date:  # False
    # Skip - too early

# January 14, 10:00 AM
now = "2025-01-14 10:00 AM"
reminder_date = "2025-01-14 10:00 AM"
if now >= reminder_date:  # True ✅
    # Send reminder!
```

### Step 5: Send Reminder

**Template:** `copy_followup_appointment_reminder`

**Message includes:**
- Patient name
- Clinic name
- Doctor name
- Original visit date
- Original visit time
- Clinic phone number

### Step 6: Mark as Sent

```python
appointment.update({
    "followupWhatsappSent": True,
    "whatsappLogs.copy_followup_appointment_reminder": {
        "status": "sent",
        "attemptedAt": datetime.utcnow(),
        "details": {...}
    }
})
```

---

## 📅 Follow-up Timeline Example

```
┌─────────────────────────────────────────────────────────────┐
│ Day 1: January 10, 2025                                     │
│ ─────────────────────────────────────────────────────────── │
│ 10:00 AM → Appointment completed                           │
│            ├─ followUpRequired: true                        │
│            ├─ followupInDays: 7                             │
│            └─ Follow-up date: Jan 17 (Jan 10 + 7 days)      │
│                                                              │
│ 10:00 AM → Scheduler runs                                   │
│            └─ Reminder date: Jan 14 (Jan 17 - 3 days)        │
│            └─ Check: Jan 14 > Jan 10? → Skip (too early)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Day 2-3: January 11-13, 2025                               │
│ ─────────────────────────────────────────────────────────── │
│ 10:00 AM → Scheduler runs (daily)                          │
│            └─ Check: Jan 14 > Jan 11/12/13? → Skip          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Day 4: January 14, 2025                                    │
│ ─────────────────────────────────────────────────────────── │
│ 10:00 AM → Scheduler runs ✅                                │
│            └─ Check: Jan 14 <= Jan 14? → TRUE ✅            │
│            └─ Checks consent ✅                             │
│            └─ Checks phone ✅                               │
│            └─ Sends follow-up reminder ✅                   │
│            └─ Sets followupWhatsappSent = true              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Day 5-7: January 15-17, 2025                               │
│ ─────────────────────────────────────────────────────────── │
│ 10:00 AM → Scheduler runs                                   │
│            └─ Check: followupWhatsappSent = true           │
│            └─ Skip (already sent)                           │
│                                                              │
│ January 17 → Follow-up date arrives                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 How Follow-up Days Are Determined

### Method 1: From `followupInDays` Field

```python
followup_days = appointment.get("followupInDays")
# Example: 7
```

### Method 2: Parsed from `followUpInstructions`

```python
followUpInstructions = "Follow up in 7 days"
# Regex extracts: 7 days
```

### Method 3: From AI Extraction

When prescription is processed, AI extracts:
- `followUpRequired: true`
- `followUpDuration: "7 days"`
- Converted to `followupInDays: 7`

---

## ⚠️ Important Notes

1. **Reminder is 3 days BEFORE follow-up date**
   - Not 3 days after completion
   - Example: Follow-up in 7 days → Reminder on day 4

2. **Only runs at 10:00 AM**
   - Not every hour
   - Batches all follow-up reminders at once

3. **Requires `followUpRequired: true`**
   - Only sends if follow-up is actually required
   - Skips appointments without follow-up

4. **One-time send**
   - Flag `followupWhatsappSent` prevents duplicates
   - Once sent, never sends again for that appointment

---

## 📨 ALL MESSAGE TYPES

### Type 1: Appointment Reminder (24h Before)

**Template:** `copy_appointment_reminder`

**When:** 24 hours before appointment time

**Frequency:** Every hour

**Trigger:** 
- Appointment scheduled
- 23-25 hours away from now
- `appointmentReminderSent ≠ true`

**Message Content:**
- Patient name
- Clinic name
- Doctor name
- Appointment date and time
- Clinic header name

**Example:**
```
Hi John Doe,

Your appointment with Dr. Smith at MediEase Clinic 
is scheduled for 2025-01-17 10:00.

Please arrive 10 minutes early.
```

---

### Type 2: Lab Result Reminder (24h After)

**Template:** `copy_post_visit_lab_request`

**When:** 24 hours after appointment completion

**Frequency:** Daily at 10:00 AM

**Trigger:**
- Appointment completed
- Completed 23-25 hours ago
- Has `prescribedTest` field
- `labResultReminderSent ≠ true`

**Message Content:**
- Patient name
- Clinic email (for sending results)
- Clinic name

**Example:**
```
Hi John Doe,

Your lab results from MediEase Clinic are ready.

Please send your results to: clinic@mediease.com
```

---

### Type 3: Follow-up Reminder (3 Days Before)

**Template:** `copy_followup_appointment_reminder`

**When:** 3 days before follow-up date

**Frequency:** Daily at 10:00 AM

**Trigger:**
- Appointment completed
- `followUpRequired: true`
- Follow-up date calculated
- Reminder date (follow-up - 3 days) <= now
- `followupWhatsappSent ≠ true`

**Message Content:**
- Patient name
- Clinic name
- Doctor name
- Original visit date
- Original visit time
- Clinic phone number

**Example:**
```
Hi John Doe,

This is a reminder from MediEase Clinic.

Your follow-up appointment with Dr. Smith is due soon.
Original visit: 2025-01-10 10:00

Please call us at +1-555-123-4567 to schedule.
```

---

### Type 4: Manual Message (API)

**Template:** None (plain text)

**When:** Staff manually sends via API

**Frequency:** On-demand

**Endpoint:** `POST /api/whatsapp/send`

**Requires:**
- Authentication (receptionist/admin/doctor role)
- Manual API call

**Message Content:**
- Custom text message
- No template variables

**Example:**
```
Staff sends: "Please remember to take your medication"
Patient receives: "Please remember to take your medication"
```

---

## 📊 Summary Table

| Type | Template | When | Frequency | Auto/Manual |
|------|----------|------|-----------|-------------|
| Appointment Reminder | `copy_appointment_reminder` | 24h before | Every hour | Auto |
| Lab Result Reminder | `copy_post_visit_lab_request` | 24h after | Daily 10 AM | Auto |
| Follow-up Reminder | `copy_followup_appointment_reminder` | 3 days before | Daily 10 AM | Auto |
| Manual Message | None | On-demand | As needed | Manual |

---

## 🎯 Total Count

**Message Types:** 4
- 3 Automatic (via scheduler)
- 1 Manual (via API)

**Templates:** 3
- All automatic messages use templates
- Manual messages use plain text

**Scheduler Checks:**
- Appointment reminders: Every hour
- Lab result reminders: Daily at 10 AM
- Follow-up reminders: Daily at 10 AM

---

## ✅ Common Requirements

All automatic messages require:
1. ✅ `consent_whatsapp: true` (patient consent)
2. ✅ Valid phone number with country code
3. ✅ Appropriate flag not set (prevents duplicates)
4. ✅ Conditions met (scheduled/completed/follow-up required)

---

**Last Updated:** January 16, 2025

