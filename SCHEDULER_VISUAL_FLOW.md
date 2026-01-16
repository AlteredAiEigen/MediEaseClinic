# WhatsApp Scheduler - Visual Flow Diagram

## 🔄 Main Scheduler Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION STARTS                       │
│                                                             │
│  FastAPI starts → Scheduler initializes → Loop begins     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SCHEDULER LOOP (Every Hour)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1. Check Appointment Reminders (24h before)        │  │
│  │    - Runs every hour                                │  │
│  │    - Finds appointments 23-25 hours away           │  │
│  └─────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 2. Check Lab Result Reminders (24h after)            │  │
│  │    - Runs ONLY at 10 AM                             │  │
│  │    - Finds appointments completed 23-25h ago        │  │
│  └─────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 3. Check Follow-up Reminders (3 days before)         │  │
│  │    - Runs ONLY at 10 AM                             │  │
│  │    - Finds appointments needing follow-up           │  │
│  └─────────────────────────────────────────────────────┘  │
│                            ↓                                │
│                    Wait 1 Hour                             │
│                            ↓                                │
│                    Repeat Forever                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Appointment Reminder Flow (24h Before)

```
Current Time: Jan 16, 2025 10:00 AM
                            ↓
        Calculate Target Window
                            ↓
    Target: Jan 17, 2025 10:00 AM (24h from now)
    Window:  Jan 17, 2025 09:00 AM - 11:00 AM
                            ↓
        Query Database
                            ↓
    Find appointments where:
    - status = "scheduled"
    - date = "2025-01-17"
    - appointmentReminderSent ≠ true
                            ↓
        For Each Appointment Found
                            ↓
    ┌──────────────────────────────────────┐
    │ Check Exact Time                      │
    │                                       │
    │ Appointment: Jan 17, 10:00 AM        │
    │ Hours until: 24.0 hours              │
    │                                       │
    │ Is 23 ≤ hours ≤ 25?                  │
    │ ✅ YES → Continue                    │
    │ ❌ NO  → Skip                         │
    └──────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────┐
    │ Check Patient Consent                 │
    │                                       │
    │ consent_whatsapp = true?             │
    │ ✅ YES → Continue                    │
    │ ❌ NO  → Skip                         │
    └──────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────┐
    │ Check Phone Number                    │
    │                                       │
    │ Valid phone with country code?       │
    │ ✅ YES → Continue                    │
    │ ❌ NO  → Log error, Skip             │
    └──────────────────────────────────────┘
                            ↓
        Send WhatsApp Message
                            ↓
    Template: copy_appointment_reminder
    Variables:
    - patient_name
    - clinic_name
    - doctor_name
    - appointment_datetime
                            ↓
        Mark as Sent
                            ↓
    appointmentReminderSent = true
    whatsappLogs.copy_appointment_reminder = {
        status: "sent",
        attemptedAt: now,
        details: {...}
    }
```

---

## 🧪 Lab Result Reminder Flow (24h After)

```
Current Time: Jan 16, 2025 10:00 AM
                            ↓
        Check Current Hour
                            ↓
    Is hour == 10? (10 AM)
    ✅ YES → Continue
    ❌ NO  → Skip (return)
                            ↓
        Calculate Completion Window
                            ↓
    Now: Jan 16, 10:00 AM
    Target: Jan 15, 10:00 AM (24h ago)
    Window: Jan 15, 09:00 AM - 11:00 AM
                            ↓
        Query Database
                            ↓
    Find appointments where:
    - status = "completed"
    - completedAt between window
    - labResultReminderSent ≠ true
    - prescribedTest exists
                            ↓
        For Each Appointment Found
                            ↓
    [Same checks as appointment reminder]
    - Check consent ✅
    - Check phone ✅
                            ↓
        Send WhatsApp Message
                            ↓
    Template: copy_post_visit_lab_request
    Variables:
    - patient_name
    - clinic_email
    - clinic_name
                            ↓
        Mark as Sent
                            ↓
    labResultReminderSent = true
```

---

## 🔁 Follow-up Reminder Flow (3 Days Before)

```
Current Time: Jan 16, 2025 10:00 AM
                            ↓
        Check Current Hour
                            ↓
    Is hour == 10? (10 AM)
    ✅ YES → Continue
    ❌ NO  → Skip (return)
                            ↓
        Query Database
                            ↓
    Find appointments where:
    - followUpRequired = true
    - followupWhatsappSent ≠ true
    - status = "completed"
    - completedAt exists
                            ↓
        For Each Appointment Found
                            ↓
    Calculate Follow-up Date
                            ↓
    completedAt: Jan 10, 2025
    followupInDays: 7
    followupDate: Jan 17, 2025 (Jan 10 + 7 days)
                            ↓
    Calculate Reminder Date
                            ↓
    reminderDate: Jan 14, 2025 (Jan 17 - 3 days)
                            ↓
    Check If Due
                            ↓
    Is now >= reminderDate?
    ✅ YES → Send reminder
    ❌ NO  → Skip (too early)
                            ↓
    [Same checks as appointment reminder]
    - Check consent ✅
    - Check phone ✅
                            ↓
        Send WhatsApp Message
                            ↓
    Template: copy_followup_appointment_reminder
    Variables:
    - patient_name
    - clinic_name
    - doctor_name
    - visit_date
    - visit_time
    - clinic_phone
                            ↓
        Mark as Sent
                            ↓
    followupWhatsappSent = true
```

---

## ⏰ Timeline Example

```
Day 1: Jan 10, 2025
├─ 10:00 AM → Appointment completed
│            ├─ followUpRequired: true
│            ├─ followupInDays: 7
│            └─ Follow-up date: Jan 17
│
└─ 10:00 AM → Scheduler runs
              ├─ Lab reminder check: Too early (just completed)
              └─ Follow-up check: Too early (reminder date is Jan 14)

Day 2: Jan 11, 2025
└─ 10:00 AM → Scheduler runs
              └─ Follow-up check: Too early (reminder date is Jan 14)

Day 3: Jan 12, 2025
└─ 10:00 AM → Scheduler runs
              └─ Follow-up check: Too early (reminder date is Jan 14)

Day 4: Jan 13, 2025
└─ 10:00 AM → Scheduler runs
              └─ Follow-up check: Too early (reminder date is Jan 14)

Day 5: Jan 14, 2025
└─ 10:00 AM → Scheduler runs ✅
              └─ Follow-up check: reminderDate (Jan 14) <= now ✅
                 └─ Sends follow-up reminder ✅
                    └─ Marks followupWhatsappSent = true

Day 6: Jan 15, 2025
└─ 10:00 AM → Scheduler runs
              └─ Follow-up check: Already sent, skips

Day 7: Jan 16, 2025
├─ 10:00 AM → Appointment scheduled for tomorrow (Jan 17, 10:00 AM)
│            └─ Scheduler runs
│               └─ Appointment reminder check: Too early (25h away)
│
└─ 11:00 AM → Scheduler runs ✅
              └─ Appointment reminder check: 24h away ✅
                 └─ Sends appointment reminder ✅
                    └─ Marks appointmentReminderSent = true

Day 8: Jan 17, 2025
└─ 10:00 AM → Appointment time / Follow-up date
```

---

## 🔍 Search Query Examples

### Appointment Reminder Query
```javascript
{
  status: "scheduled",
  appointmentReminderSent: { $ne: true },
  date: {
    $gte: "2025-01-17",  // Window start date
    $lte: "2025-01-17"   // Window end date
  }
}
```

### Lab Result Reminder Query
```javascript
{
  status: "completed",
  labResultReminderSent: { $ne: true },
  completedAt: {
    $gte: ISODate("2025-01-15T09:00:00Z"),  // 23h ago
    $lte: ISODate("2025-01-15T11:00:00Z")   // 25h ago
  },
  prescribedTest: { $exists: true, $ne: null }
}
```

### Follow-up Reminder Query
```javascript
{
  followUpRequired: true,
  followupWhatsappSent: { $ne: true },
  status: { $in: ["completed", "checkout"] },
  completedAt: { $exists: true }
}
// Then calculate reminder_date in Python for each
```

---

## 🎯 Key Points

1. **Hourly Checks:** Appointment reminders checked every hour
2. **Daily Checks:** Lab and follow-up reminders checked once daily at 10 AM
3. **Time Windows:** Uses windows (±1 hour) to catch appointments reliably
4. **One-Time Send:** Flags prevent duplicate reminders
5. **Consent First:** Always checks consent before sending
6. **Error Handling:** Failed sends are logged but don't stop scheduler

---

**Visual Guide Created:** January 16, 2025

