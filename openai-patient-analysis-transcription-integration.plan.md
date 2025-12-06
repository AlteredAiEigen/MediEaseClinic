# Clinical Notes & Patient Info Extraction from Transcription

## Overview
Load transcriptions from MongoDB "recordings" collection, generate clinical notes (bullet points + summary) using OpenAI, extract patient information (allergies, medications, medical history, symptoms, diagnosis), update patient records, track clinical trail of updates, and generate patient insights when patient checks in for appointment.

## Implementation Plan

### 1. Update Clinical Notes Model

**Update `[.mediease/fastapi/app/models/clinical_note.py](.mediease/fastapi/app/models/clinical_note.py)`**
- Add `transcription` field (String) - Full transcription text from recordings collection
- Add `bulletPoints` (List[str]) - Key points from consultation
- Add `summary` (String) - Summary of consultation between patient and doctor
- Add `patientInfoUpdates` (Dict) - Tracks what was updated in patient record:
  - `allergies` (Dict with `oldValue`, `newValue`, `updated`)
  - `medications` (Dict with `oldValue`, `newValue`, `updated`)
  - `medicalHistory` (Dict with `oldValue`, `newValue`, `updated`)
  - `symptoms` (Dict with `oldValue`, `newValue`, `updated`)
  - `diagnosis` (Dict with `oldValue`, `newValue`, `updated`)

### 2. Update Patient Model

**Note**: Patient model already has `insights` field with structure:
- `riskAssessment` (String)
- `riskLevel` (String: "low", "medium", "high")
- `successRate` (String)
- `keyFindings` (List[str])
- `recommendations` (List[str])
- `lastUpdatedAt` (String/Date)

**Update `[.mediease/fastapi/app/models/patient.py](.mediease/fastapi/app/models/patient.py)`**
- Ensure `insights` field exists (already present)
- Add `medicalHistory` (List[str]) - if not already present (note: medical history is stored in separate collection)
- Add `symptoms` (List[str]) - note: `currentSymptoms` already exists as string
- Add `diagnosis` (List[str]) - if not already present
- Note: `allergies` already exists (as string, may need to handle as list)
- Note: `currentMedications` already exists (as List[Dict])

### 3. Update Appointment Model

**Update `[.mediease/fastapi/app/models/appointment.py](.mediease/fastapi/app/models/appointment.py)`**
- Add `clinicalNotesId` (Optional[str]) - Reference to clinical notes document ID
- Keep existing fields unchanged

### 4. Update OpenAI Service

**Update `[.mediease/fastapi/app/services/ai_service.py](.mediease/fastapi/app/services/ai_service.py)`**
- Add function `generate_patient_insights(patient_data: Dict) -> Dict`:
  - Takes complete patient data (demographics, medical history, current symptoms, medications, allergies, etc.)
  - Uses OpenAI to analyze patient profile and generate insights for consultation page
  - Returns insights object matching existing structure:
    ```python
    {
        "riskAssessment": "Low risk patient",
        "riskLevel": "low" | "medium" | "high",
        "successRate": "95%",
        "keyFindings": [Array of key findings],
        "recommendations": [Array of recommendations],
        "lastUpdatedAt": datetime.now().isoformat()
    }
    ```
  - This will be called when patient checks in for appointment
- Add function `generate_clinical_notes_bullet_summary(transcription_text: str) -> Dict`:
  - Takes full transcription text
  - Prompts OpenAI to generate:
    - Bullet points (key discussion points from consultation)
    - Summary (concise summary of consultation between patient and doctor)
  - Returns `{"bulletPoints": [], "summary": ""}`
- Add function `extract_patient_info_from_transcription(transcription_text: str, current_patient_data: Dict) -> Dict`:
  - Takes transcription and current patient data (allergies, medications, etc.)
  - Uses OpenAI to extract and identify NEW information:
    - Allergies mentioned
    - Medications mentioned
    - Medical history mentioned
    - Symptoms discussed
    - Diagnosis mentioned
  - Compares with existing patient data
  - Returns object with only NEW/updated information:
    ```python
    {
        "allergies": {"oldValue": [], "newValue": [], "updated": bool},
        "medications": {"oldValue": [], "newValue": [], "updated": bool},
        "medicalHistory": {"oldValue": [], "newValue": [], "updated": bool},
        "symptoms": {"oldValue": [], "newValue": [], "updated": bool},
        "diagnosis": {"oldValue": [], "newValue": [], "updated": bool}
    }
    ```

### 5. Update Clinical Notes Service

**Update `[.mediease/fastapi/app/services/clinical_note_service.py](.mediease/fastapi/app/services/clinical_note_service.py)`**
- Add function `generate_clinical_notes_from_transcription(appointment_id: str) -> Dict`:
  - Fetches transcription from "recordings" collection (linked to appointment)
  - Calls OpenAI service to generate bullet points and summary
  - Creates ClinicalNotes document with transcription, bulletPoints, and summary
  - Links ClinicalNotes to Appointment
  - Returns clinical notes
- Add function `update_patient_info_from_transcription(appointment_id: str) -> Dict`:
  - Fetches transcription from recordings collection
  - Fetches current patient data
  - Calls OpenAI service to extract patient info
  - Updates patient record with new information
  - Updates ClinicalNotes document with patientInfoUpdates trail
  - Returns summary of what was updated
- Add function `get_clinical_notes_with_updates(appointment_id: str) -> Dict`:
  - Fetches ClinicalNotes for appointment
  - Returns clinical notes with patientInfoUpdates trail

### 6. Create Patient Insights Service

**Create `[.mediease/fastapi/app/services/patient_insights_service.py](.mediease/fastapi/app/services/patient_insights_service.py)`**
- Function `generate_patient_insights_on_checkin(patient_id: str) -> Dict`:
  - Called when patient checks in for appointment
  - Fetches complete patient data (all fields including demographics, medical history, symptoms, medications, allergies, etc.)
  - Calls OpenAI service `generate_patient_insights()` to create/update insights
  - Updates patient record with new insights
  - Returns updated insights

### 7. Update Clinical Notes Router

**Update `[.mediease/fastapi/app/routers/clinical_notes.py](.mediease/fastapi/app/routers/clinical_notes.py)`**
- Add `POST /clinical-notes/generate-from-transcription/{appointment_id}` - Generate clinical notes from transcription
- Add `POST /clinical-notes/update-patient-info/{appointment_id}` - Extract and update patient info from transcription
- Add `GET /clinical-notes/appointment/{appointment_id}/with-updates` - Get clinical notes with patient update trail

### 8. Update Patients Router

**Update `[.mediease/fastapi/app/routers/patients.py](.mediease/fastapi/app/routers/patients.py)`**
- Add `POST /patients/{patient_id}/generate-insights` - Generate/update patient insights on check-in
- This endpoint should be called when patient checks in for appointment

### 9. Update Appointments Router

**Update `[.mediease/fastapi/app/routers/appointments.py](.mediease/fastapi/app/routers/appointments.py)`**
- Update check-in endpoint to call patient insights generation
- Add endpoint to get appointment with clinical notes: `GET /appointments/{appointment_id}/with-clinical-notes`

### 10. Integration with Check-in Workflow

**Find and update check-in endpoint in `[.mediease/fastapi/app/routers/appointments.py](.mediease/fastapi/app/routers/appointments.py)` or `[.mediease/fastapi/app/routers/queue.py](.mediease/fastapi/app/routers/queue.py)`**
- When patient checks in (status changes to "checked-in"), automatically call patient insights generation
- This ensures insights are ready when doctor starts consultation

### 11. Environment Configuration

**Update `.env` file or `[.mediease/fastapi/app/config.py](.mediease/fastapi/app/config.py)`**
- Ensure `OPENAI_API_KEY` environment variable is configured
- Document OpenAI model preference (e.g., `gpt-4` or `gpt-3.5-turbo`)

## Files to Create/Modify

**New Files:**
- `.mediease/fastapi/app/services/patient_insights_service.py`

**Modified Files:**
- `.mediease/fastapi/app/models/clinical_note.py`
- `.mediease/fastapi/app/models/patient.py`
- `.mediease/fastapi/app/models/appointment.py`
- `.mediease/fastapi/app/services/ai_service.py`
- `.mediease/fastapi/app/services/clinical_note_service.py`
- `.mediease/fastapi/app/routers/clinical_notes.py`
- `.mediease/fastapi/app/routers/patients.py`
- `.mediease/fastapi/app/routers/appointments.py`
- `.mediease/fastapi/app/config.py` (if needed for OpenAI config)

## Key Features

1. **Patient Insights Generation**: Automatically generates/updates patient insights (risk assessment, key findings, recommendations) when patient checks in for appointment
2. **Clinical Notes Generation**: Uses OpenAI to create structured clinical notes (bullet points + summary) from transcription
3. **Patient Info Extraction**: Intelligently extracts allergies, medications, medical history, symptoms, and diagnosis from transcription
4. **Update Tracking**: Maintains clinical trail showing what patient fields were updated and their old/new values
5. **Appointment Integration**: Clinical notes are linked to appointments and can be viewed per appointment
6. **Patient Record Updates**: Automatically updates patient record when new information is found in transcription

## Workflow

1. **Patient Check-in**: When patient checks in → Generate/update insights → Display on consultation page
2. **After Consultation**: Transcription available → Generate clinical notes → Extract patient info → Update patient record → Track updates in clinical trail

## Implementation Todos

1. Update ClinicalNotes model with transcription, bullet points, summary, and patientInfoUpdates trail
2. Update Patient model to ensure medical fields are properly structured (allergies, medications, medicalHistory, symptoms, diagnosis)
3. Update Appointment model to add clinicalNotesId reference field
4. Update OpenAI service with patient insights generation, clinical notes bullet/summary generation, and patient info extraction functions
5. **Implement AI recommendation construction using OpenAI** - Generate patient insights (riskAssessment, riskLevel, successRate, keyFindings, recommendations) for consultation page when patient checks in
6. Update clinical notes service with functions to generate notes from transcription, update patient info, and fetch notes with updates
7. Create patient insights service with function to generate insights on check-in
8. Update clinical notes router with new endpoints for transcription processing
9. Update patients router with endpoint to generate insights on check-in
10. Update appointments router to integrate insights generation into check-in workflow
11. Test integration with check-in workflow

## Technical Notes

- Use existing `ai_service.py` which already has OpenAI integration
- Leverage existing `clinical_note_service.py` structure
- Recordings collection is already set up with transcription field
- Patient model already has `insights` field structure
- Use Pydantic models for type safety
- Use FastAPI dependency injection for authentication
- Ensure proper error handling and logging
- Consider rate limiting for OpenAI API calls

