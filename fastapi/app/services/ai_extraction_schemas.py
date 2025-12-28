"""
AI Extraction JSON Schemas for Consultation Transcription.

This module defines two separate extraction schemas:
1. Appointment-specific extraction - for consultation notes and appointment records
2. Patient record updates - for updating patient profile information
"""

# Appointment-Specific Extraction Schema
APPOINTMENT_EXTRACTION_SCHEMA = {
    "chiefComplaint": "Main reason for visit",
    "historyOfPresentIllness": "Detailed description of current symptoms and timeline",
    "reviewOfSystems": "Systematic review of body systems mentioned",
    "physicalExamination": "Physical findings mentioned during examination",
    "assessment": "Doctor's assessment/diagnosis for this appointment",
    "plan": "Treatment plan and recommendations for this appointment",
    "medications": [
        {
            "name": "Medication name",
            "dosage": "Dose and units (e.g. 500mg)",
            "frequency": "How often (e.g. 1-0-1, twice daily)",
            "duration": "Duration text (e.g. 5 days, 2 weeks, 1 month)",
            "instructions": "Any extra instructions"
        }
    ],
    "allergies": ["allergy name 1", "allergy name 2"],
    "prescribedTests": ["test name 1", "test name 2"],
    "followUpInstructions": "Follow-up care instructions",
    "differentialDiagnosis": ["dx1", "dx2"],
    "clinicalImpression": "Overall clinical impression",
    "consultationNotes": "Detailed consultation notes and observations",
    "painLevel": "Pain level mentioned (e.g., 1-10, mild, moderate, severe)",
    "vitalSigns": {
        "bloodPressure": "Blood pressure if mentioned (e.g., 120/80)",
        "heartRate": "Heart rate if mentioned (e.g., 72 bpm)",
        "temperature": "Temperature if mentioned (e.g., 98.6°F)",
        "weight": "Weight if mentioned (e.g., 70 kg)",
        "bloodGlucose": "Blood glucose if mentioned",
        "oxygenSaturation": "O2 saturation if mentioned",
        "respiratoryRate": "Respiratory rate if mentioned"
    }
}

# Patient Record Updates Extraction Schema
PATIENT_UPDATE_EXTRACTION_SCHEMA = {
    "medications": [
        {
            "name": "Medication name",
            "dosage": "Dose and units (e.g. 500mg)",
            "frequency": "How often (e.g. 1-0-1, twice daily)",
            "duration": "Duration text (e.g. 5 days, 2 weeks, 1 month)",
            "instructions": "Any extra instructions"
        }
    ],
    "allergies": ["allergy name 1", "allergy name 2"],
    "lifestyle": {
        "smoking": "Smoking status/habits mentioned (e.g., 'non-smoker', '10 cigarettes per day', 'quit 2 years ago')",
        "alcohol": "Alcohol consumption mentioned (e.g., 'occasional', '2 drinks per week', 'non-drinker')",
        "exercise": "Exercise habits mentioned (e.g., 'daily walks', '3 times per week', 'sedentary')",
        "diet": "Diet information mentioned (e.g., 'vegetarian', 'low sodium', 'diabetic diet')",
        "sleep": "Sleep patterns mentioned (e.g., '6-7 hours per night', 'insomnia', 'sleeps well')",
        "stress": "Stress levels mentioned (e.g., 'high stress job', 'manages stress well', 'anxiety')"
    },
    "chiefComplaint": "Main reason for visit (updates patient's current chief complaint)",
    "currentSymptoms": "Current symptoms described (updates patient's current symptoms)",
    "condition": "Current condition/diagnosis (updates patient's condition field)",
    "carePlanSummary": "Care plan summary (updates patient's care plan)",
    "followUpPlan": "Follow-up plan (updates patient's follow-up plan)",
    "painLevel": "Pain level mentioned (e.g., 1-10, mild, moderate, severe)",
    "medicalHistory": [
        {
            "title": "Condition or diagnosis name",
            "diagnosis": "Diagnosis details",
            "treatedBy": "Doctor or facility name if mentioned",
            "recordedOn": "Date if mentioned (YYYY-MM-DD format)",
            "notes": "Additional notes about this medical history entry"
        }
    ],
    "familyHistory": [
        {
            "title": "Family member condition (e.g., 'Father - Diabetes', 'Mother - Heart Disease')",
            "diagnosis": "Diagnosis details",
            "notes": "Additional notes"
        }
    ],
    "previousSurgeries": [
        {
            "title": "Surgery name (e.g., 'Appendectomy', 'Knee Replacement')",
            "diagnosis": "Reason for surgery",
            "treatedBy": "Surgeon or facility if mentioned",
            "recordedOn": "Date if mentioned (YYYY-MM-DD format)",
            "notes": "Additional notes about the surgery"
        }
    ]
}

