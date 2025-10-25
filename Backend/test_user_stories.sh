#!/bin/bash

# MediEaseClinic API Test Suite - User Story Based
# This script tests the complete workflow from admin setup to patient checkout

BASE_URL="http://localhost:5001"
RESULTS_FILE="test_results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize results file
echo "====================" > $RESULTS_FILE
echo "API Test Results" >> $RESULTS_FILE
echo "Date: $(date)" >> $RESULTS_FILE
echo "====================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Function to test an endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local auth_token=$4
    local data=$5
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo "Test: $test_name" >> $RESULTS_FILE
    
    if [ -z "$data" ]; then
        if [ -z "$auth_token" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $auth_token")
        fi
    else
        if [ -z "$auth_token" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_token" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE/d')
    
    echo "Response Code: $http_code" >> $RESULTS_FILE
    echo "Response Body: $body" >> $RESULTS_FILE
    echo "---" >> $RESULTS_FILE
    
    if [ $http_code -ge 200 ] && [ $http_code -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "STATUS: PASSED" >> $RESULTS_FILE
        echo "$body"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "STATUS: FAILED" >> $RESULTS_FILE
        echo "$body"
        return 1
    fi
    
    echo "" >> $RESULTS_FILE
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MediEaseClinic API User Story Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# USER STORY 1: Admin Setup
# ============================================
echo -e "${BLUE}=== USER STORY 1: Admin Sets Up Clinic ===${NC}"
echo ""
echo "USER STORY 1: ADMIN SETUP" >> $RESULTS_FILE

## 1.1: Register Admin Account
echo "Step 1.1: Admin registers the clinic..."
response=$(test_endpoint "Register Admin" "POST" "/api/auth/register/admin" "" '{
  "clinicName": "HealthCare Plus Clinic",
  "adminEmail": "admin@healthcareplus.com",
  "adminPassword": "Admin@123",
  "doctorRange": "10-20"
}')

ADMIN_TOKEN=$(echo "$response" | jq -r '.data.token')
echo "Admin Token: $ADMIN_TOKEN"
echo ""

## 1.2: Admin Login
echo "Step 1.2: Admin logs in..."
response=$(test_endpoint "Admin Login" "POST" "/api/auth/login" "" '{
  "email": "admin@healthcareplus.com",
  "password": "Admin@123"
}')
echo ""

# ============================================
# USER STORY 2: Admin Adds Staff
# ============================================
echo -e "${BLUE}=== USER STORY 2: Admin Adds Doctors and Receptionists ===${NC}"
echo ""
echo "USER STORY 2: ADDING STAFF" >> $RESULTS_FILE

## 2.1: Add First Doctor (Dr. Sarah Johnson - Cardiology)
echo "Step 2.1: Admin adds Dr. Sarah Johnson (Cardiologist)..."
response=$(test_endpoint "Add Doctor - Dr. Sarah Johnson" "POST" "/api/auth/register" "$ADMIN_TOKEN" '{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "dr.sarah@healthcareplus.com",
  "password": "Doctor@123",
  "role": "doctor",
  "speciality": "Cardiology",
  "licenseNumber": "CARD12345",
  "phone": "+1234567001"
}')

DOCTOR1_ID=$(echo "$response" | jq -r '.data.user._id')
echo "Doctor 1 ID: $DOCTOR1_ID"
echo ""

## 2.2: Add Second Doctor (Dr. Michael Chen - General Medicine)
echo "Step 2.2: Admin adds Dr. Michael Chen (General Medicine)..."
response=$(test_endpoint "Add Doctor - Dr. Michael Chen" "POST" "/api/auth/register" "$ADMIN_TOKEN" '{
  "firstName": "Michael",
  "lastName": "Chen",
  "email": "dr.chen@healthcareplus.com",
  "password": "Doctor@123",
  "role": "doctor",
  "speciality": "General Medicine",
  "licenseNumber": "GM67890",
  "phone": "+1234567002"
}')

DOCTOR2_ID=$(echo "$response" | jq -r '.data.user._id')
echo "Doctor 2 ID: $DOCTOR2_ID"
echo ""

## 2.3: Add Receptionist (Emily Brown)
echo "Step 2.3: Admin adds Receptionist - Emily Brown..."
response=$(test_endpoint "Add Receptionist - Emily Brown" "POST" "/api/auth/register" "$ADMIN_TOKEN" '{
  "firstName": "Emily",
  "lastName": "Brown",
  "email": "emily@healthcareplus.com",
  "password": "Reception@123",
  "role": "receptionist",
  "phone": "+1234567003"
}')

RECEPTIONIST_ID=$(echo "$response" | jq -r '.data.user._id')
echo "Receptionist ID: $RECEPTIONIST_ID"
echo ""

## 2.4: Verify Staff List
echo "Step 2.4: Admin verifies all doctors..."
test_endpoint "List All Doctors" "GET" "/api/doctors" "$ADMIN_TOKEN"
echo ""

echo "Step 2.5: Admin verifies all receptionists..."
test_endpoint "List All Receptionists" "GET" "/api/receptionists" "$ADMIN_TOKEN"
echo ""

# ============================================
# USER STORY 3: Receptionist Logs In
# ============================================
echo -e "${BLUE}=== USER STORY 3: Receptionist Starts Her Day ===${NC}"
echo ""
echo "USER STORY 3: RECEPTIONIST DAY START" >> $RESULTS_FILE

## 3.1: Receptionist Login
echo "Step 3.1: Emily (receptionist) logs in..."
response=$(test_endpoint "Receptionist Login" "POST" "/api/auth/login" "" '{
  "email": "emily@healthcareplus.com",
  "password": "Reception@123"
}')

RECEPTIONIST_TOKEN=$(echo "$response" | jq -r '.data.token')
echo "Receptionist Token: $RECEPTIONIST_TOKEN"
echo ""

# ============================================
# USER STORY 4: First Patient Walk-in
# ============================================
echo -e "${BLUE}=== USER STORY 4: First Patient Walks In ===${NC}"
echo ""
echo "USER STORY 4: FIRST PATIENT" >> $RESULTS_FILE

## 4.1: Quick Register Patient 1 (John Doe)
echo "Step 4.1: Receptionist quick registers John Doe (walk-in)..."
response=$(test_endpoint "Quick Register Patient - John Doe" "POST" "/api/patients/quick-register" "$RECEPTIONIST_TOKEN" '{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1555001001",
  "age": "45",
  "gender": "Male",
  "bloodGroup": "A+"
}')

PATIENT1_ID=$(echo "$response" | jq -r '.data._id')
echo "Patient 1 ID: $PATIENT1_ID"
echo ""

## 4.2: Check in Patient 1 to Dr. Sarah's Queue
echo "Step 4.2: Receptionist checks in John Doe to Dr. Sarah's queue..."
response=$(test_endpoint "Check In Patient 1" "POST" "/api/queue/check-in" "$RECEPTIONIST_TOKEN" '{
  "patientId": "'"$PATIENT1_ID"'",
  "doctorId": "'"$DOCTOR1_ID"'",
  "reason": "Chest pain and shortness of breath",
  "priority": "high",
  "notes": "Patient reports discomfort for 2 hours"
}')

QUEUE1_ID=$(echo "$response" | jq -r '.data._id')
echo "Queue Entry 1 ID: $QUEUE1_ID"
echo ""

# ============================================
# USER STORY 5: Second Patient Appointment
# ============================================
echo -e "${BLUE}=== USER STORY 5: Second Patient Has Appointment ===${NC}"
echo ""
echo "USER STORY 5: SCHEDULED PATIENT" >> $RESULTS_FILE

## 5.1: Register Patient 2 (Mary Smith)
echo "Step 5.1: Receptionist registers Mary Smith (scheduled appointment)..."
response=$(test_endpoint "Quick Register Patient - Mary Smith" "POST" "/api/patients/quick-register" "$RECEPTIONIST_TOKEN" '{
  "firstName": "Mary",
  "lastName": "Smith",
  "phone": "+1555002002",
  "age": "32",
  "gender": "Female",
  "bloodGroup": "O+"
}')

PATIENT2_ID=$(echo "$response" | jq -r '.data._id')
echo "Patient 2 ID: $PATIENT2_ID"
echo ""

## 5.2: Create Appointment for Patient 2
echo "Step 5.2: Receptionist creates appointment for Mary with Dr. Chen..."
response=$(test_endpoint "Create Appointment" "POST" "/api/appointments" "$RECEPTIONIST_TOKEN" '{
  "patient": "'"$PATIENT2_ID"'",
  "doctor": "'"$DOCTOR2_ID"'",
  "date": "2025-10-26",
  "time": "10:00",
  "duration": 30,
  "reason": "Annual checkup",
  "priority": "medium"
}')

APPOINTMENT1_ID=$(echo "$response" | jq -r '.data.appointment._id')
echo "Appointment ID: $APPOINTMENT1_ID"
echo ""

## 5.3: Check in Patient 2 with Appointment
echo "Step 5.3: Receptionist checks in Mary for her appointment..."
response=$(test_endpoint "Check In Patient 2 with Appointment" "POST" "/api/queue/check-in" "$RECEPTIONIST_TOKEN" '{
  "patientId": "'"$PATIENT2_ID"'",
  "doctorId": "'"$DOCTOR2_ID"'",
  "appointmentId": "'"$APPOINTMENT1_ID"'",
  "reason": "Annual checkup",
  "priority": "medium"
}')

QUEUE2_ID=$(echo "$response" | jq -r '.data._id')
echo "Queue Entry 2 ID: $QUEUE2_ID"
echo ""

## 5.4: View Current Queue
echo "Step 5.4: Receptionist views current clinic queue..."
test_endpoint "View Clinic Queue" "GET" "/api/queue" "$RECEPTIONIST_TOKEN"
echo ""

# ============================================
# USER STORY 6: Dr. Sarah Sees Patient 1
# ============================================
echo -e "${BLUE}=== USER STORY 6: Dr. Sarah Treats John Doe ===${NC}"
echo ""
echo "USER STORY 6: DR. SARAH'S CONSULTATION" >> $RESULTS_FILE

## 6.1: Dr. Sarah Logs In
echo "Step 6.1: Dr. Sarah logs in..."
response=$(test_endpoint "Doctor 1 Login" "POST" "/api/auth/login" "" '{
  "email": "dr.sarah@healthcareplus.com",
  "password": "Doctor@123"
}')

DOCTOR1_TOKEN=$(echo "$response" | jq -r '.data.token')
echo "Doctor 1 Token: $DOCTOR1_TOKEN"
echo ""

## 6.2: Dr. Sarah Views Her Queue
echo "Step 6.2: Dr. Sarah views her patient queue..."
test_endpoint "View Dr. Sarah's Queue" "GET" "/api/queue/doctor/$DOCTOR1_ID" "$DOCTOR1_TOKEN"
echo ""

## 6.3: Dr. Sarah Starts Consultation
echo "Step 6.3: Dr. Sarah starts consultation with John..."
test_endpoint "Start Consultation" "PUT" "/api/queue/$QUEUE1_ID/start-consultation" "$DOCTOR1_TOKEN"
echo ""

## 6.4: Dr. Sarah Checks Patient Profile
echo "Step 6.4: Dr. Sarah views John's full medical profile..."
test_endpoint "View Patient Full Profile" "GET" "/api/patients/$PATIENT1_ID/full-profile" "$DOCTOR1_TOKEN"
echo ""

## 6.5: Dr. Sarah Updates Vitals
echo "Step 6.5: Dr. Sarah records John's vitals..."
test_endpoint "Update Patient Vitals" "PUT" "/api/patients/$PATIENT1_ID/vitals" "$DOCTOR1_TOKEN" '{
  "bloodPressure": "140/90",
  "heartRate": "88",
  "temperature": "98.6",
  "oxygenSaturation": "96",
  "weight": "82",
  "height": "175"
}')
echo ""

## 6.6: Dr. Sarah Creates Clinical Note
echo "Step 6.6: Dr. Sarah creates clinical note..."
response=$(test_endpoint "Create Clinical Note" "POST" "/api/clinical-notes" "$DOCTOR1_TOKEN" '{
  "patientId": "'"$PATIENT1_ID"'",
  "appointmentId": null,
  "title": "Chest Pain Consultation",
  "content": "Patient presented with chest discomfort and mild shortness of breath",
  "chiefComplaint": "Chest pain for 2 hours",
  "currentSymptoms": "Chest discomfort, mild dyspnea",
  "painLevel": "6",
  "diagnosis": "Possible angina, requires further cardiac workup",
  "treatmentPlan": "Refer to cardiology, prescribe nitrates PRN",
  "recommendations": "Avoid strenuous activity, follow up in 2 days",
  "category": "consultation"
}')

NOTE1_ID=$(echo "$response" | jq -r '.data.note._id')
echo "Clinical Note ID: $NOTE1_ID"
echo ""

## 6.7: Dr. Sarah Creates Prescription
echo "Step 6.7: Dr. Sarah writes prescription for John..."
response=$(test_endpoint "Create Prescription" "POST" "/api/prescriptions" "$DOCTOR1_TOKEN" '{
  "patientId": "'"$PATIENT1_ID"'",
  "queueId": "'"$QUEUE1_ID"'",
  "medications": [
    {
      "name": "Nitroglycerin",
      "dosage": "0.4mg",
      "frequency": "As needed",
      "duration": "30 days",
      "instructions": "Place under tongue when chest pain occurs"
    },
    {
      "name": "Aspirin",
      "dosage": "81mg",
      "frequency": "Once daily",
      "duration": "Ongoing",
      "instructions": "Take with food"
    }
  ],
  "diagnosis": "Angina",
  "notes": "Follow up with cardiologist within 48 hours"
}')

PRESCRIPTION1_ID=$(echo "$response" | jq -r '.data._id')
echo "Prescription ID: $PRESCRIPTION1_ID"
echo ""

## 6.8: Update Queue Status to Completed
echo "Step 6.8: Dr. Sarah marks consultation as completed..."
test_endpoint "Complete Consultation" "PUT" "/api/queue/$QUEUE1_ID/status" "$DOCTOR1_TOKEN" '{
  "status": "completed"
}'
echo ""

# ============================================
# USER STORY 7: Dr. Chen Sees Patient 2
# ============================================
echo -e "${BLUE}=== USER STORY 7: Dr. Chen Sees Mary Smith ===${NC}"
echo ""
echo "USER STORY 7: DR. CHEN'S CONSULTATION" >> $RESULTS_FILE

## 7.1: Dr. Chen Logs In
echo "Step 7.1: Dr. Chen logs in..."
response=$(test_endpoint "Doctor 2 Login" "POST" "/api/auth/login" "" '{
  "email": "dr.chen@healthcareplus.com",
  "password": "Doctor@123"
}')

DOCTOR2_TOKEN=$(echo "$response" | jq -r '.data.token')
echo "Doctor 2 Token: $DOCTOR2_TOKEN"
echo ""

## 7.2: Dr. Chen Views His Appointments
echo "Step 7.2: Dr. Chen views his appointments..."
test_endpoint "View Dr. Chen's Appointments" "GET" "/api/appointments" "$DOCTOR2_TOKEN"
echo ""

## 7.3: Dr. Chen Views His Queue
echo "Step 7.3: Dr. Chen views his queue..."
test_endpoint "View Dr. Chen's Queue" "GET" "/api/queue/doctor/$DOCTOR2_ID" "$DOCTOR2_TOKEN"
echo ""

## 7.4: Dr. Chen Starts Consultation
echo "Step 7.4: Dr. Chen starts consultation with Mary..."
test_endpoint "Start Consultation with Mary" "PUT" "/api/queue/$QUEUE2_ID/start-consultation" "$DOCTOR2_TOKEN"
echo ""

## 7.5: Dr. Chen Records Vitals
echo "Step 7.5: Dr. Chen records Mary's vitals..."
test_endpoint "Update Mary's Vitals" "PUT" "/api/patients/$PATIENT2_ID/vitals" "$DOCTOR2_TOKEN" '{
  "bloodPressure": "118/75",
  "heartRate": "68",
  "temperature": "98.2",
  "oxygenSaturation": "99",
  "weight": "62",
  "height": "165"
}')
echo ""

## 7.6: Dr. Chen Creates Clinical Note with AI Assistance
echo "Step 7.6: Dr. Chen uses AI to generate clinical note from consultation transcript..."
consultation_transcript="Doctor: Good morning Mary, how are you feeling today?
Patient: I'm doing well doctor, just here for my annual checkup.
Doctor: Great. Any concerns or symptoms lately?
Patient: Not really, maybe some occasional headaches.
Doctor: How often?
Patient: Once or twice a week, usually stress-related.
Doctor: I see. Let me check your vitals. Blood pressure is 118/75, heart rate 68, temperature 98.2, oxygen saturation 99%. Everything looks good.
Patient: That's good to hear.
Doctor: Based on your checkup, you're in excellent health. I'd recommend managing stress with regular exercise and adequate sleep. The headaches are likely tension headaches.
Patient: Okay, I'll try that.
Doctor: Great. See you next year for your annual checkup."

# Note: This will only work if OpenAI API key is properly configured
# echo "Attempting AI generation (may fail if API key not configured)..."
# test_endpoint "AI Generate Clinical Note" "POST" "/api/clinical-notes/ai/generate-from-transcript" "$DOCTOR2_TOKEN" "{
#   \"patientId\": \"$PATIENT2_ID\",
#   \"appointmentId\": \"$APPOINTMENT1_ID\",
#   \"transcript\": \"$consultation_transcript\",
#   \"useGemini\": false
# }"
# echo ""

## 7.7: Dr. Chen Creates Regular Clinical Note
echo "Step 7.7: Dr. Chen creates clinical note for annual checkup..."
response=$(test_endpoint "Create Annual Checkup Note" "POST" "/api/clinical-notes" "$DOCTOR2_TOKEN" '{
  "patientId": "'"$PATIENT2_ID"'",
  "appointmentId": "'"$APPOINTMENT1_ID"'",
  "title": "Annual Physical Examination",
  "content": "Annual checkup completed. Patient reports occasional tension headaches.",
  "chiefComplaint": "Routine annual physical",
  "currentSymptoms": "Occasional headaches (1-2x per week)",
  "diagnosis": "Healthy - Tension headaches",
  "treatmentPlan": "Stress management, regular exercise",
  "recommendations": "Maintain healthy lifestyle, manage stress levels",
  "category": "follow-up"
}')

NOTE2_ID=$(echo "$response" | jq -r '.data.note._id')
echo ""

## 7.8: Mark Consultation Complete
echo "Step 7.8: Dr. Chen marks consultation complete..."
test_endpoint "Complete Mary's Consultation" "PUT" "/api/queue/$QUEUE2_ID/status" "$DOCTOR2_TOKEN" '{
  "status": "completed"
}'
echo ""

# ============================================
# USER STORY 8: Patient Checkout
# ============================================
echo -e "${BLUE}=== USER STORY 8: Patients Check Out ===${NC}"
echo ""
echo "USER STORY 8: PATIENT CHECKOUT" >> $RESULTS_FILE

## 8.1: Receptionist Checks Out Patient 1
echo "Step 8.1: Receptionist checks out John Doe..."
test_endpoint "Check Out Patient 1" "POST" "/api/queue/$QUEUE1_ID/check-out" "$RECEPTIONIST_TOKEN"
echo ""

## 8.2: Receptionist Checks Out Patient 2
echo "Step 8.2: Receptionist checks out Mary Smith..."
test_endpoint "Check Out Patient 2" "POST" "/api/queue/$QUEUE2_ID/check-out" "$RECEPTIONIST_TOKEN"
echo ""

## 8.3: Receptionist Views Queue Statistics
echo "Step 8.3: Receptionist views queue statistics for the day..."
test_endpoint "View Queue Statistics" "GET" "/api/queue/stats" "$ADMIN_TOKEN"
echo ""

# ============================================
# USER STORY 9: Admin Reviews Day's Activity
# ============================================
echo -e "${BLUE}=== USER STORY 9: Admin Reviews Daily Activity ===${NC}"
echo ""
echo "USER STORY 9: ADMIN REVIEW" >> $RESULTS_FILE

## 9.1: Admin Views Dashboard
echo "Step 9.1: Admin views dashboard statistics..."
test_endpoint "View Admin Dashboard" "GET" "/api/admin/dashboard" "$ADMIN_TOKEN"
echo ""

## 9.2: Admin Views All Appointments
echo "Step 9.2: Admin views all appointments..."
test_endpoint "View All Appointments" "GET" "/api/appointments" "$ADMIN_TOKEN"
echo ""

## 9.3: Admin Views All Patients
echo "Step 9.3: Admin views all patients..."
test_endpoint "View All Patients" "GET" "/api/patients" "$ADMIN_TOKEN"
echo ""

## 9.4: Admin Views Prescription History
echo "Step 9.4: Admin views all prescriptions..."
test_endpoint "View All Prescriptions" "GET" "/api/prescriptions" "$ADMIN_TOKEN"
echo ""

## 9.5: Admin Views Patient 1's Full History
echo "Step 9.5: Admin views John Doe's complete medical history..."
test_endpoint "View Patient 1 Full History" "GET" "/api/patients/$PATIENT1_ID/full-profile" "$ADMIN_TOKEN"
echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Suite Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "- Admin account created and configured"
echo "- 2 doctors added (Dr. Sarah - Cardiology, Dr. Chen - General Medicine)"
echo "- 1 receptionist added (Emily)"
echo "- 2 patients registered and checked in"
echo "- 1 appointment created"
echo "- 2 consultations completed"
echo "- 1 prescription created"
echo "- Queue management tested"
echo "- Clinical notes created"
echo "- Patient checkout completed"
echo ""
echo "Check $RESULTS_FILE for detailed test results."

