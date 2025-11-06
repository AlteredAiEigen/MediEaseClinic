# 🚀 MediEase Clinic - API Quick Reference

## 📋 **Quick Start Testing**

### **1. Start the Server**
```bash
cd /Users/chanpreetsingh/Documents/GitHub/Untitled/MediEaseClinic/fastapi
uvicorn app.main:app --reload
```

### **2. Access API Documentation**
- **Swagger UI**: http://localhost:8000/docs (Interactive testing)
- **ReDoc**: http://localhost:8000/redoc (Clean documentation)

---

## 🔐 **Authentication Flow**

### **Step 1: Register a User**
```bash
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@mediease.com",
  "password": "SecurePass123!",
  "role": "doctor",
  "phone": "+1234567890",
  "speciality": "Cardiology",
  "licenseNumber": "DOC123456"
}
```

### **Step 2: Login**
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "john.doe@mediease.com",
  "password": "SecurePass123!"
}

# Response:
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
}
```

### **Step 3: Use Token in Requests**
```bash
GET http://localhost:8000/api/patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 👥 **Patient Management**

### **Create Patient**
```bash
POST http://localhost:8000/api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "female",
  "age": 35,
  "dateOfBirth": "1989-05-15",
  "email": "jane.smith@email.com",
  "phone": "+1234567890",
  "bloodGroup": "A+",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "allergies": ["Penicillin", "Peanuts"],
  "currentMedication": "Lisinopril 10mg daily"
}
```

### **Get All Patients**
```bash
GET http://localhost:8000/api/patients?page=1&limit=10
Authorization: Bearer {token}
```

### **Search Patient by ID**
```bash
GET http://localhost:8000/api/patients/{patient_id}
Authorization: Bearer {token}
```

---

## 📅 **Appointments**

### **Create Appointment**
```bash
POST http://localhost:8000/api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient": "patient_object_id",
  "doctor": "doctor_object_id",
  "scheduledBy": "receptionist_object_id",
  "date": "2024-12-15",
  "time": "14:30",
  "duration": 30,
  "reason": "Annual checkup",
  "priority": "medium"
}
```

### **Get Doctor's Appointments**
```bash
GET http://localhost:8000/api/appointments?doctor={doctor_id}&date=2024-12-15
Authorization: Bearer {token}
```

---

## 💊 **Prescriptions**

### **Create Prescription**
```bash
POST http://localhost:8000/api/prescriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient": "patient_object_id",
  "doctor": "doctor_object_id",
  "appointment": "appointment_object_id",
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take with food"
    }
  ],
  "diagnosis": "Bacterial infection",
  "notes": "Complete full course of antibiotics"
}
```

---

## 🎙️ **Recordings & Transcription**

### **Upload Recording**
```bash
POST http://localhost:8000/api/recordings
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [audio file]
patient: patient_object_id
appointment: appointment_object_id
doctor: doctor_object_id
duration: 600
```

### **Start Transcription**
```bash
POST http://localhost:8000/api/recordings/{recording_id}/transcribe
Authorization: Bearer {token}
```

### **Get Transcription Result**
```bash
GET http://localhost:8000/api/recordings/{recording_id}
Authorization: Bearer {token}

# Response includes:
{
  "transcription": "Doctor: How are you feeling today? Patient: I've been experiencing...",
  "transcriptionConfidence": 0.95,
  "status": "completed"
}
```

---

## 🤖 **AI-Powered Clinical Notes**

### **Generate Notes from Transcript**
```bash
POST http://localhost:8000/api/clinical-notes/ai/generate-from-transcript
Authorization: Bearer {token}
Content-Type: application/json

{
  "transcript": "Doctor: What brings you in today? Patient: I've been having chest pain and shortness of breath for the past week. Doctor: Can you describe the pain? Patient: It's a sharp pain that comes and goes, especially when I climb stairs. Doctor: Any history of heart disease in your family? Patient: Yes, my father had a heart attack at age 55.",
  "patient_id": "patient_object_id",
  "appointment_id": "appointment_object_id"
}

# AI Response:
{
  "success": true,
  "data": {
    "chiefComplaint": "Chest pain and shortness of breath",
    "symptoms": [
      "chest pain",
      "shortness of breath",
      "pain on exertion"
    ],
    "diagnosis": "Suspected angina pectoris with family history of cardiac disease",
    "treatmentPlan": "Order ECG and stress test, prescribe nitroglycerin for acute episodes, lifestyle modifications including low-sodium diet and regular exercise",
    "prescriptions": [
      {
        "medication": "Nitroglycerin",
        "dosage": "0.4mg",
        "frequency": "Sublingual as needed",
        "duration": "30 days",
        "instructions": "Take one tablet under tongue at onset of chest pain. May repeat every 5 minutes up to 3 times. Seek emergency care if pain persists."
      }
    ],
    "recommendations": "Schedule cardiology consultation within 7 days. Monitor blood pressure daily. Avoid strenuous activity until cleared by cardiologist.",
    "followUpRequired": true,
    "followUpDate": "2024-12-22",
    "notes": "Patient has concerning symptoms with positive family history. Immediate cardiology evaluation recommended."
  }
}
```

### **Generate Treatment Plan**
```bash
POST http://localhost:8000/api/clinical-notes/ai/treatment-plan
Authorization: Bearer {token}
Content-Type: application/json

{
  "symptoms": "Fever, cough, sore throat",
  "diagnosis": "Upper respiratory infection",
  "patient_context": "35-year-old female, no allergies, no chronic conditions"
}
```

### **Summarize Consultation**
```bash
POST http://localhost:8000/api/clinical-notes/ai/summarize
Authorization: Bearer {token}
Content-Type: application/json

{
  "transcript": "Doctor: Good morning... [long consultation transcript]"
}
```

---

## 🏥 **Queue Management**

### **Check-in Patient**
```bash
POST http://localhost:8000/api/queue/check-in
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "patient_object_id",
  "doctorId": "doctor_object_id",
  "reason": "Follow-up consultation",
  "priority": "medium",
  "notes": "Patient called ahead"
}
```

### **Get Active Queue**
```bash
GET http://localhost:8000/api/queue
Authorization: Bearer {token}
```

### **Start Consultation**
```bash
PUT http://localhost:8000/api/queue/{queue_entry_id}/start-consultation
Authorization: Bearer {token}
```

### **Get Queue Statistics**
```bash
GET http://localhost:8000/api/queue/stats
Authorization: Bearer {token}

# Response:
{
  "totalPatients": 15,
  "waiting": 5,
  "inConsultation": 3,
  "completed": 7,
  "averageWaitTime": 22.5
}
```

---

## 👨‍⚕️ **Doctor Management**

### **List All Doctors**
```bash
GET http://localhost:8000/api/doctors?speciality=Cardiology&page=1&limit=10
Authorization: Bearer {token}
```

### **Get Doctor Statistics**
```bash
GET http://localhost:8000/api/doctors/stats
Authorization: Bearer {token}

# Response:
{
  "totalDoctors": 25,
  "activeDoctors": 23,
  "doctorsBySpeciality": {
    "Cardiology": 5,
    "Pediatrics": 8,
    "Orthopedics": 6,
    "General Practice": 6
  },
  "averageAppointmentsPerDoctor": 42.5
}
```

---

## 🔧 **Admin Dashboard**

### **Get Dashboard Statistics**
```bash
GET http://localhost:8000/api/admin/dashboard
Authorization: Bearer {token}

# Response:
{
  "totalPatients": 1250,
  "totalAppointments": 3500,
  "totalDoctors": 25,
  "totalReceptionists": 8,
  "totalClinicalNotes": 2800,
  "totalRecordings": 1500,
  "appointmentsToday": 45,
  "patientsThisMonth": 87,
  "recentActivity": [...]
}
```

### **Create New User (Admin)**
```bash
POST http://localhost:8000/api/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@mediease.com",
  "password": "SecurePass123!",
  "role": "receptionist",
  "phone": "+1234567890"
}
```

---

## 📊 **Common Query Parameters**

### **Pagination**
```bash
?page=1&limit=10
```

### **Filtering**
```bash
# Patients
?gender=male&bloodGroup=O+

# Appointments
?status=scheduled&date=2024-12-15&doctor={doctor_id}

# Clinical Notes
?category=diagnosis&priority=high&actionable=true

# Queue
?status=waiting&priority=emergency
```

### **Sorting**
Most endpoints automatically sort by `created_at` descending (newest first)

---

## 🧪 **Testing Workflow**

### **Complete Flow Example:**

1. **Register Admin User**
2. **Login as Admin**
3. **Create Doctor Users**
4. **Create Receptionist Users**
5. **Login as Receptionist**
6. **Create Patient**
7. **Schedule Appointment**
8. **Check-in Patient to Queue**
9. **Login as Doctor**
10. **Start Consultation (from Queue)**
11. **Upload Consultation Recording**
12. **Transcribe Recording**
13. **Generate Clinical Notes with AI**
14. **Create Prescription**
15. **Complete Appointment**
16. **Check-out Patient**

---

## 🔍 **Health Check**

```bash
GET http://localhost:8000/health

# Response:
{
  "status": "healthy",
  "service": "MediEase Clinic API",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## ⚠️ **Common Error Responses**

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authenticated",
  "statusCode": 401
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Not authorized to access this resource",
  "statusCode": 403
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Patient not found",
  "statusCode": 404
}
```

### **422 Validation Error**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 422
}
```

---

## 💡 **Tips**

1. **Use Swagger UI** at http://localhost:8000/docs for interactive testing
2. **Copy JWT token** from login response and use "Authorize" button in Swagger
3. **Check logs** in terminal for detailed error messages
4. **Test AI features** with realistic medical transcripts for best results
5. **Use pagination** for large datasets to avoid timeouts

---

## 🆘 **Need Help?**

Refer to:
- `SETUP_GUIDE.md` - Complete setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Full feature overview
- Swagger UI - Interactive API documentation
- Application logs - Detailed error information

---

**Happy Testing! 🚀**

