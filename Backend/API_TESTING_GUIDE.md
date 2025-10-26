# MediEaseClinic API Quick Testing Guide

## Getting Started

### 1. Start the Server
```bash
cd Backend
npm start
```

### 2. Access Swagger Documentation
Open your browser to: `http://localhost:5001/api-docs`

### 3. Check Server Health
```bash
curl http://localhost:5001/health
```

## Testing Flow (Without Frontend)

### Step 1: Register Admin
```bash
curl -X POST http://localhost:5001/api/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Test Clinic",
    "adminEmail": "admin@test.com",
    "adminPassword": "Admin@123",
    "doctorRange": "1-10"
  }'
```

Save the `token` from the response.

### Step 2: Login as Admin
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

### Step 3: Create a Doctor
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "doctor@test.com",
    "password": "Doctor@123",
    "role": "doctor",
    "speciality": "General Medicine",
    "licenseNumber": "DOC123456"
  }'
```

### Step 4: Create a Receptionist
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "receptionist@test.com",
    "password": "Reception@123",
    "role": "receptionist"
  }'
```

### Step 5: Quick Register a Patient (as Receptionist)
```bash
# First login as receptionist
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "receptionist@test.com",
    "password": "Reception@123"
  }'

# Then register patient
curl -X POST http://localhost:5001/api/patients/quick-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -d '{
    "firstName": "Bob",
    "lastName": "Patient",
    "phone": "+1234567890",
    "age": "35",
    "gender": "Male",
    "bloodGroup": "O+"
  }'
```

Save the patient `_id` from response.

### Step 6: Check In Patient to Queue
```bash
curl -X POST http://localhost:5001/api/queue/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -d '{
    "patientId": "PATIENT_ID",
    "doctorId": "DOCTOR_ID",
    "reason": "Regular checkup",
    "priority": "medium"
  }'
```

### Step 7: Get Doctor's Queue (as Doctor)
```bash
# Login as doctor first
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "Doctor@123"
  }'

# Get queue
curl -X GET "http://localhost:5001/api/queue/doctor/DOCTOR_ID" \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

### Step 8: Start Consultation
```bash
curl -X PUT http://localhost:5001/api/queue/QUEUE_ID/start-consultation \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

### Step 9: Create Prescription
```bash
curl -X POST http://localhost:5001/api/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "patientId": "PATIENT_ID",
    "medications": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "Three times daily",
        "duration": "7 days",
        "instructions": "Take after meals"
      }
    ],
    "diagnosis": "Upper respiratory infection",
    "notes": "Complete the full course"
  }'
```

### Step 10: Test AI Features (Generate Clinical Note from Transcript)
```bash
curl -X POST http://localhost:5001/api/clinical-notes/ai/generate-from-transcript \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "patientId": "PATIENT_ID",
    "transcript": "Patient presents with fever and cough for 3 days. Temperature 101F, BP 120/80, Heart rate 78. Diagnosed with upper respiratory infection. Prescribed Amoxicillin 500mg three times daily for 7 days. Patient advised to rest and drink plenty of fluids.",
    "useGemini": false
  }'
```

### Step 11: Update Patient Vitals
```bash
curl -X PUT http://localhost:5001/api/patients/PATIENT_ID/vitals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "bloodPressure": "120/80",
    "heartRate": "72",
    "temperature": "98.6",
    "oxygenSaturation": "98",
    "weight": "70",
    "height": "170"
  }'
```

### Step 12: Check Out Patient
```bash
curl -X POST http://localhost:5001/api/queue/QUEUE_ID/check-out \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN"
```

## Testing AI Features

### Test Treatment Plan Generation
```bash
curl -X POST http://localhost:5001/api/clinical-notes/ai/treatment-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "symptoms": "Fever, cough, body aches",
    "diagnosis": "Influenza",
    "useGemini": false
  }'
```

### Test Prescription Suggestion
```bash
curl -X POST http://localhost:5001/api/clinical-notes/ai/prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "noteId": "CLINICAL_NOTE_ID",
    "useGemini": false
  }'
```

### Test Consultation Summary
```bash
curl -X POST http://localhost:5001/api/clinical-notes/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{
    "transcript": "Very long consultation transcript here...",
    "useGemini": false
  }'
```

## Common Query Parameters

### Pagination
```
?page=1&limit=10
```

### Date Filtering (Appointments)
```
?date=2025-01-15
?startDate=2025-01-01&endDate=2025-01-31
```

### Status Filtering (Appointments)
```
?status=scheduled
```

### Doctor Filtering (Appointments)
```
?doctor=DOCTOR_ID
```

### Patient Filtering
```
?patient=PATIENT_ID
```

## Response Format

All endpoints return JSON in this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Testing with Postman

### Import Collection
1. Create a new collection in Postman
2. Set environment variable: `baseUrl = http://localhost:5001`
3. Set environment variable: `token = YOUR_JWT_TOKEN`
4. Use `{{baseUrl}}` and `{{token}}` in requests

### Example Headers
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

## Testing File Upload (Prescription Image)

```bash
curl -X POST http://localhost:5001/api/prescriptions/PRESCRIPTION_ID/upload-image \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -F "image=@/path/to/prescription.jpg"
```

## Queue Statistics
```bash
curl -X GET http://localhost:5001/api/queue/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Patient Full Profile (with Appointments)
```bash
curl -X GET http://localhost:5001/api/patients/PATIENT_ID/full-profile \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

## Notes

1. **API Keys**: Make sure `OPENAI_API_KEY` and `GEMINI_API_KEY` are set in `config.env`
2. **Database**: Ensure MongoDB is running and connected
3. **File Uploads**: The `uploads/prescriptions/` directory must exist
4. **Rate Limiting**: Default is 100 requests per 15 minutes per IP
5. **JWT Expiry**: Default token expiry is 7 days

## Troubleshooting

### Server won't start
- Check MongoDB connection
- Verify all environment variables in `config.env`
- Check for port conflicts (default: 5001)

### AI features not working
- Verify API keys are correct in `config.env`
- Check OpenAI/Gemini API quotas
- Check network connectivity

### File upload fails
- Verify uploads directory exists and is writable
- Check file size (max 5MB)
- Ensure file type is allowed (jpg, png, gif, pdf)

### Authentication fails
- Verify JWT token is valid and not expired
- Check Authorization header format: `Bearer TOKEN`
- Ensure user has correct role for the endpoint

---

For complete API documentation, visit: `http://localhost:5001/api-docs`

