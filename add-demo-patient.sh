#!/bin/bash

# Script to add a demo patient directly to the app's storage

echo "Adding demo patient to MediEaseClinic..."

# Get the device's storage directory
STORAGE_DIR=$(adb shell run-as com.medieaseclinic ls /data/data/com.medieaseclinic/files 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "Error: Could not access app storage. Make sure the app is installed and debuggable."
  exit 1
fi

# Create demo patient data
DEMO_PATIENT='[
  {
    "id": "demo123",
    "patientId": "P999",
    "firstName": "Demo",
    "lastName": "Patient",
    "gender": "Male",
    "age": "42",
    "bloodGroup": "O+",
    "dateOfBirth": "01/01/1982",
    "email": "demo.patient@example.com",
    "phone": "555-DEMO",
    "address": "123 Test Street, Demo City",
    "vitals": {
      "bloodPressure": "120/80",
      "heartRate": "72",
      "temperature": "98.6°F",
      "oxygenSaturation": "98%",
      "weight": "70kg",
      "height": "175cm",
      "bmi": "22.9"
    },
    "medicalHistory": "Asthma, Seasonal Allergies",
    "allergies": "Pollen, Dust",
    "familyHistory": "Father: Hypertension, Mother: Diabetes",
    "previousSurgeries": "None",
    "currentMedication": "Albuterol inhaler as needed",
    "lifestyle": {
      "smoking": "Never",
      "alcohol": "Social",
      "exercise": "Regular",
      "diet": "Balanced",
      "sleep": "7-8 hours",
      "stress": "Moderate"
    },
    "chiefComplaint": "Persistent cough and mild fever",
    "currentSymptoms": "Coughing, slight fever, fatigue for the past 3 days",
    "painLevel": "3",
    "durationOfSymptoms": "3 days",
    "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "waitTime": "5 min",
    "status": "waiting",
    "reason": "Persistent cough and mild fever",
    "presentInClinic": true
  }
]'

# Create demo appointment data
DEMO_APPOINTMENT='[
  {
    "id": "aptDemo",
    "patientId": "demo123",
    "patientFirstName": "Demo",
    "patientLastName": "Patient",
    "patientPhone": "555-DEMO",
    "doctorId": "doc1",
    "date": "'$(date +"%Y-%m-%d")'",
    "time": "10:00",
    "duration": 30,
    "status": "confirmed",
    "reason": "Persistent cough and mild fever",
    "notes": "Demo patient for testing consultation recording",
    "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "presentInClinic": true
  }
]'

# Create temporary files
echo "$DEMO_PATIENT" > /tmp/demo_patient.json
echo "$DEMO_APPOINTMENT" > /tmp/demo_appointment.json

# Push files to device
adb push /tmp/demo_patient.json /sdcard/demo_patient.json
adb push /tmp/demo_appointment.json /sdcard/demo_appointment.json

# Copy files to app storage
adb shell run-as com.medieaseclinic cp /sdcard/demo_patient.json /data/data/com.medieaseclinic/files/patients
adb shell run-as com.medieaseclinic cp /sdcard/demo_appointment.json /data/data/com.medieaseclinic/files/appointments

# Clean up
rm /tmp/demo_patient.json
rm /tmp/demo_appointment.json
adb shell rm /sdcard/demo_patient.json
adb shell rm /sdcard/demo_appointment.json

echo "Demo patient added successfully. Please restart the app to see the changes."
