# MediEase Clinic - Transcription & AI Extraction Cron Job Server

## Overview

This server handles transcription and AI extraction for consultation recordings. It runs cron jobs to:

1. **Transcription Job**: Find recordings with `transcriptionStatus: "pending"` → transcribe using Whisper model
2. **AI Extraction Job**: Find recordings with `transcriptionStatus: "completed"` and `aiProcessing.notesExtractionStatus: "pending"` → extract structured notes using OpenAI GPT-4

## Prerequisites

- Python 3.8+
- MongoDB access (read/write)
- AWS S3 access (read recordings)
- OpenAI API key (for AI extraction)
- Whisper model installed and running

## Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB Connection
MONGODB_URL=mongodb://username:password@host:port/database?authSource=admin
DATABASE_NAME=mediease

# AWS Credentials (to download recordings from S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# OpenAI API (for AI extraction)
OPENAI_API_KEY=your_openai_api_key

# Cron Schedule (optional, defaults shown)
TRANSCRIPTION_CRON_SCHEDULE=*/5 * * * *  # Every 5 minutes
AI_EXTRACTION_CRON_SCHEDULE=*/10 * * * *  # Every 10 minutes

# Optional: Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/cron_jobs.log
```

## Installation

### 1. Install Python Dependencies

```bash
pip install pymongo boto3 openai whisper transformers torch schedule python-dotenv
```

### 2. Install Whisper Model

Whisper should already be running on your server. Make sure it's accessible. The code will use the Whisper API or local model.

## Database Schema

### Recording Document Structure

```python
{
    "_id": ObjectId("..."),
    "recordingId": "REC12345678",
    "patientId": "patient_object_id",
    "appointmentId": "appointment_object_id",
    "doctorId": "doctor_object_id",
    "s3Url": "https://bucket.s3.region.amazonaws.com/path/to/recording.wav",
    "filePath": "recordings/clinic_id/appointment_id/recording.wav",
    "fileName": "recording.wav",
    "fileSize": 1234567,
    "duration": 300,  # seconds
    "status": "pending",  # "pending" | "processed" | "error"
    "transcriptionStatus": "pending",  # "pending" | "completed" | "failed"
    "transcriptionLanguage": "hi",  # "hi" | "en" | "hi-en" | "en-hi" | "auto"
    "transcription": "",  # Will be filled after transcription
    "transcriptionConfidence": None,
    "aiProcessing": {
        "model": "gpt-4",
        "version": "1.0",
        "language": "en-US",
        "transcriptionModel": None,  # Will be set to "Whisper" after transcription
        "notesExtractionModel": "GPT-4",
        "notesExtractionStatus": "pending",  # "pending" | "success" | "failed"
        "notesExtractionError": None,
        "structuredNotes": None  # Will be filled after extraction
    },
    "createdAt": ISODate("..."),
    "updatedAt": ISODate("...")
}
```

### Collections Used

- `recordings` - Main collection for recordings
- `patients` - For patient context during AI extraction
- `appointments` - To update appointment with structured notes

## Implementation

### Project Structure

```
cron-job-server/
├── .env
├── requirements.txt
├── main.py
├── transcription_job.py
├── ai_extraction_job.py
└── logs/
    └── cron_jobs.log
```

### requirements.txt

```
pymongo>=4.6.0
boto3>=1.28.0
openai>=1.0.0
whisper>=1.0.0
transformers>=4.35.0
torch>=2.1.0
schedule>=1.2.0
python-dotenv>=1.0.0
```

### transcription_job.py

```python
"""
Transcription job for processing pending recordings using Whisper.
"""
import os
import boto3
import whisper
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import logging

load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv("LOG_FILE", "./logs/cron_jobs.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize connections
mongo_client = MongoClient(os.getenv("MONGODB_URL"))
db = mongo_client[os.getenv("DATABASE_NAME")]
recordings_collection = db.recordings

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)
bucket_name = os.getenv("S3_BUCKET_NAME")

# Load Whisper model (load once, reuse)
# Adjust model size based on your needs: "tiny", "base", "small", "medium", "large"
whisper_model = whisper.load_model("base")
logger.info("Whisper model loaded successfully")

def transcribe_recording(recording):
    """Transcribe a single recording using Whisper."""
    recording_id = recording["_id"]
    recording_id_str = str(recording_id)
    
    try:
        file_path = recording["filePath"]
        transcription_language = recording.get("transcriptionLanguage", "hi")
        
        logger.info(f"Processing recording {recording['recordingId']} with language: {transcription_language}")
        
        # Download file from S3 to temporary location
        temp_file = f"/tmp/recording_{recording_id_str}.wav"
        os.makedirs("/tmp", exist_ok=True)
        
        logger.info(f"Downloading {file_path} from S3...")
        s3_client.download_file(bucket_name, file_path, temp_file)
        logger.info(f"Downloaded to {temp_file}")
        
        # Map language codes to Whisper language codes
        language_map = {
            "hi": "hi",      # Hindi
            "en": "en",      # English
            "hi-en": "hi",   # Hindi-English mix (start with Hindi)
            "en-hi": "en",   # English-Hindi mix (start with English)
            "auto": None     # Auto-detect
        }
        whisper_lang = language_map.get(transcription_language)
        
        # Transcribe using Whisper
        logger.info(f"Transcribing with language: {whisper_lang or 'auto-detect'}")
        if whisper_lang:
            result = whisper_model.transcribe(temp_file, language=whisper_lang)
        else:
            result = whisper_model.transcribe(temp_file)  # Auto-detect
        
        transcript = result["text"].strip()
        language_detected = result.get("language", transcription_language)
        
        logger.info(f"Transcription completed. Length: {len(transcript)} characters. Language detected: {language_detected}")
        
        # Clean up temp file
        os.remove(temp_file)
        
        # Update recording in MongoDB
        update_data = {
            "transcriptionStatus": "completed",
            "transcription": transcript,
            "transcriptionConfidence": 0.95,  # Whisper doesn't provide confidence, use default
            "status": "processed",  # Update overall status
            "updatedAt": datetime.utcnow(),
            "aiProcessing.transcriptionModel": "Whisper",
            "aiProcessing.language": language_detected
        }
        
        recordings_collection.update_one(
            {"_id": recording_id},
            {"$set": update_data}
        )
        
        logger.info(f"✅ Successfully transcribed recording {recording['recordingId']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error transcribing recording {recording.get('recordingId', 'unknown')}: {str(e)}", exc_info=True)
        
        # Update recording with error
        try:
            recordings_collection.update_one(
                {"_id": recording_id},
                {"$set": {
                    "transcriptionStatus": "failed",
                    "status": "error",
                    "errorMessage": str(e),
                    "updatedAt": datetime.utcnow()
                }}
            )
        except Exception as update_error:
            logger.error(f"Failed to update recording error status: {update_error}")
        
        # Clean up temp file if it exists
        temp_file = f"/tmp/recording_{recording_id_str}.wav"
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass
        
        return False

def process_pending_transcriptions():
    """Find and process all recordings with pending transcription."""
    logger.info("=" * 60)
    logger.info(f"[{datetime.now()}] Starting transcription job...")
    
    try:
        # Find all recordings with pending transcription
        pending_recordings = list(recordings_collection.find({
            "transcriptionStatus": "pending"
        }).limit(10))  # Process 10 at a time to avoid overload
        
        logger.info(f"Found {len(pending_recordings)} recordings with pending transcription")
        
        count = 0
        for recording in pending_recordings:
            if transcribe_recording(recording):
                count += 1
        
        logger.info(f"✅ Transcription job completed. Processed {count}/{len(pending_recordings)} recordings successfully")
        return count
        
    except Exception as e:
        logger.error(f"❌ Error in transcription job: {str(e)}", exc_info=True)
        return 0
```

### ai_extraction_job.py

```python
"""
AI extraction job for processing transcriptions and extracting structured notes.
"""
import os
import json
import openai
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import logging

load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv("LOG_FILE", "./logs/cron_jobs.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize connections
mongo_client = MongoClient(os.getenv("MONGODB_URL"))
db = mongo_client[os.getenv("DATABASE_NAME")]
recordings_collection = db.recordings
patients_collection = db.patients
appointments_collection = db.appointments

openai.api_key = os.getenv("OPENAI_API_KEY")

def extract_structured_notes(transcript, patient_context=None):
    """Extract structured clinical notes from transcription using OpenAI."""
    try:
        # Build prompt for OpenAI
        patient_info = ""
        if patient_context:
            patient_info = f"""
Patient Context:
- Age: {patient_context.get('age', 'N/A')}
- Gender: {patient_context.get('gender', 'N/A')}
- Medical History: {', '.join(patient_context.get('medicalHistory', [])) if patient_context.get('medicalHistory') else 'None'}
- Allergies: {', '.join(patient_context.get('allergies', [])) if patient_context.get('allergies') else 'None'}
- Chief Complaint: {patient_context.get('chiefComplaint', 'N/A')}
"""
        
        prompt = f"""Extract structured clinical notes from the following doctor-patient consultation transcript.

{patient_info}

Transcript:
{transcript}

Extract and return a JSON object with the following structure:
{{
    "chiefComplaint": "main complaint",
    "historyOfPresentIllness": "detailed history",
    "reviewOfSystems": "systems review",
    "physicalExamination": "examination findings",
    "assessment": "diagnosis/assessment",
    "plan": "treatment plan",
    "medications": [{{"name": "medication", "dosage": "dosage", "frequency": "frequency", "duration": "duration"}}],
    "allergies": ["allergy1", "allergy2"],
    "followUpInstructions": "follow-up instructions",
    "differentialDiagnosis": ["diagnosis1", "diagnosis2"],
    "clinicalImpression": "clinical impression"
}}

Return only valid JSON, no additional text."""

        logger.info("Calling OpenAI API for structured notes extraction...")
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a medical assistant that extracts structured clinical notes from consultation transcripts. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from response (in case there's extra text)
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        structured_notes = json.loads(response_text)
        logger.info("Successfully extracted structured notes")
        return {"success": True, "structured_notes": structured_notes}
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from OpenAI response: {e}")
        logger.error(f"Response was: {response_text[:500]}")
        return {"success": False, "error": f"JSON parsing error: {str(e)}"}
    except Exception as e:
        logger.error(f"Error in OpenAI API call: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}

def format_notes_for_appointment(structured_notes):
    """Format structured notes for appointment display."""
    formatted = []
    if structured_notes.get("chiefComplaint"):
        formatted.append(f"**Chief Complaint:** {structured_notes['chiefComplaint']}")
    if structured_notes.get("assessment"):
        formatted.append(f"**Assessment:** {structured_notes['assessment']}")
    if structured_notes.get("plan"):
        formatted.append(f"**Plan:** {structured_notes['plan']}")
    if structured_notes.get("followUpInstructions"):
        formatted.append(f"**Follow-up:** {structured_notes['followUpInstructions']}")
    return "\n\n".join(formatted)

def build_appointment_summary(structured_notes):
    """Build appointment summary object."""
    return {
        "chiefComplaint": structured_notes.get("chiefComplaint"),
        "assessment": structured_notes.get("assessment"),
        "plan": structured_notes.get("plan"),
        "followUpInstructions": structured_notes.get("followUpInstructions"),
        "differentialDiagnosis": structured_notes.get("differentialDiagnosis"),
        "clinicalImpression": structured_notes.get("clinicalImpression")
    }

def process_ai_extraction(recording):
    """Extract structured notes for a recording."""
    recording_id = recording["_id"]
    
    try:
        transcript = recording.get("transcription", "")
        
        if not transcript:
            logger.warning(f"⚠️ No transcription available for recording {recording['recordingId']}")
            return False
        
        logger.info(f"Processing AI extraction for recording {recording['recordingId']}")
        
        # Get patient context
        patient_context = {}
        if recording.get("patientId"):
            try:
                from bson import ObjectId
                patient = patients_collection.find_one({"_id": ObjectId(recording["patientId"])})
                if patient:
                    patient_context = {
                        "age": patient.get("age"),
                        "gender": patient.get("gender"),
                        "medicalHistory": patient.get("medicalHistory", []),
                        "allergies": patient.get("allergies", []),
                        "chiefComplaint": patient.get("chiefComplaint")
                    }
                    logger.info(f"Loaded patient context for extraction")
            except Exception as e:
                logger.warning(f"Could not load patient context: {e}")
        
        # Extract structured notes
        result = extract_structured_notes(transcript, patient_context)
        
        if result["success"]:
            structured_notes = result["structured_notes"]
            
            # Update recording
            update_data = {
                "aiProcessing.notesExtractionStatus": "success",
                "aiProcessing.structuredNotes": structured_notes,
                "aiProcessing.notesExtractionError": None,
                "aiProcessing.notesConfidence": 0.85,
                "updatedAt": datetime.utcnow()
            }
            
            recordings_collection.update_one(
                {"_id": recording_id},
                {"$set": update_data}
            )
            
            # Update appointment with structured notes
            if recording.get("appointmentId"):
                try:
                    from bson import ObjectId
                    appointment_notes = format_notes_for_appointment(structured_notes)
                    appointment_summary = build_appointment_summary(structured_notes)
                    
                    appointment_updates = {
                        "consultationNotes": appointment_notes,
                        "transcription": transcript,
                        "structuredNotes": structured_notes,
                        "consultationSummary": appointment_summary,
                        "followUpNotes": structured_notes.get("followUpInstructions"),
                        "updatedAt": datetime.utcnow()
                    }
                    
                    # Extract additional fields
                    if structured_notes.get("chiefComplaint"):
                        appointment_updates["reason"] = structured_notes["chiefComplaint"]
                    if structured_notes.get("historyOfPresentIllness"):
                        appointment_updates["notes"] = structured_notes["historyOfPresentIllness"]
                    if structured_notes.get("prescribedTests"):
                        tests = structured_notes["prescribedTests"]
                        if isinstance(tests, list) and tests:
                            prescribed_test_str = ", ".join([str(t).strip() for t in tests if t])
                            if prescribed_test_str:
                                appointment_updates["prescribedTest"] = prescribed_test_str
                    
                    appointments_collection.update_one(
                        {"_id": ObjectId(recording["appointmentId"])},
                        {"$set": appointment_updates}
                    )
                    logger.info(f"Updated appointment with structured notes")
                except Exception as e:
                    logger.warning(f"Could not update appointment: {e}")
            
            logger.info(f"✅ Successfully extracted notes for recording {recording['recordingId']}")
            return True
        else:
            # Mark as failed
            recordings_collection.update_one(
                {"_id": recording_id},
                {"$set": {
                    "aiProcessing.notesExtractionStatus": "failed",
                    "aiProcessing.notesExtractionError": result.get("error", "Extraction failed"),
                    "updatedAt": datetime.utcnow()
                }}
            )
            logger.error(f"❌ Failed to extract notes: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error in AI extraction for recording {recording.get('recordingId', 'unknown')}: {str(e)}", exc_info=True)
        try:
            recordings_collection.update_one(
                {"_id": recording_id},
                {"$set": {
                    "aiProcessing.notesExtractionStatus": "failed",
                    "aiProcessing.notesExtractionError": str(e),
                    "updatedAt": datetime.utcnow()
                }}
            )
        except:
            pass
        return False

def process_pending_ai_extractions():
    """Find and process all recordings with pending AI extraction."""
    logger.info("=" * 60)
    logger.info(f"[{datetime.now()}] Starting AI extraction job...")
    
    try:
        # Find recordings with completed transcription but pending AI extraction
        pending_recordings = list(recordings_collection.find({
            "transcriptionStatus": "completed",
            "aiProcessing.notesExtractionStatus": "pending"
        }).limit(10))  # Process 10 at a time
        
        logger.info(f"Found {len(pending_recordings)} recordings with pending AI extraction")
        
        count = 0
        for recording in pending_recordings:
            if process_ai_extraction(recording):
                count += 1
        
        logger.info(f"✅ AI extraction job completed. Processed {count}/{len(pending_recordings)} recordings successfully")
        return count
        
    except Exception as e:
        logger.error(f"❌ Error in AI extraction job: {str(e)}", exc_info=True)
        return 0
```

### main.py

```python
"""
Main entry point for cron job server.
Runs transcription and AI extraction jobs on schedule.
"""
import schedule
import time
import os
from dotenv import load_dotenv
from transcription_job import process_pending_transcriptions
from ai_extraction_job import process_pending_ai_extractions
import logging

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("🚀 Starting MediEase Transcription & AI Extraction Cron Jobs...")
    logger.info("Press Ctrl+C to stop")
    
    # Get cron schedules from environment or use defaults
    transcription_schedule = os.getenv("TRANSCRIPTION_CRON_SCHEDULE", "*/5 * * * *")
    ai_extraction_schedule = os.getenv("AI_EXTRACTION_CRON_SCHEDULE", "*/10 * * * *")
    
    # Parse cron schedule (simple format: */5 * * * * means every 5 minutes)
    # For schedule library, we'll use simpler format
    transcription_interval = int(os.getenv("TRANSCRIPTION_INTERVAL_MINUTES", "5"))
    ai_extraction_interval = int(os.getenv("AI_EXTRACTION_INTERVAL_MINUTES", "10"))
    
    # Run immediately on startup
    logger.info("Running initial jobs...")
    process_pending_transcriptions()
    process_pending_ai_extractions()
    
    # Schedule jobs
    schedule.every(transcription_interval).minutes.do(process_pending_transcriptions)
    schedule.every(ai_extraction_interval).minutes.do(process_pending_ai_extractions)
    
    logger.info(f"Transcription job scheduled: every {transcription_interval} minutes")
    logger.info(f"AI extraction job scheduled: every {ai_extraction_interval} minutes")
    
    # Run scheduler
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("Shutting down cron job server...")
```

## Setup Instructions

### 1. Create Project Directory

```bash
mkdir -p cron-job-server/logs
cd cron-job-server
```

### 2. Create Files

- Copy the code above into respective files:
  - `transcription_job.py`
  - `ai_extraction_job.py`
  - `main.py`
  - `requirements.txt`
  - `.env` (create from template above)

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Edit `.env` file with your actual credentials:
- MongoDB connection string
- AWS credentials
- OpenAI API key
- S3 bucket name

### 5. Test Connection

Create a test script `test_connections.py`:

```python
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import boto3
import openai

load_dotenv()

# Test MongoDB
try:
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME")]
    db.command('ping')
    print("✅ MongoDB connection successful")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

# Test S3
try:
    s3 = boto3.client('s3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION")
    )
    s3.list_buckets()
    print("✅ AWS S3 connection successful")
except Exception as e:
    print(f"❌ AWS S3 connection failed: {e}")

# Test OpenAI
try:
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Simple test - just check if key is set
    if openai.api_key:
        print("✅ OpenAI API key configured")
    else:
        print("❌ OpenAI API key not set")
except Exception as e:
    print(f"❌ OpenAI configuration failed: {e}")
```

Run: `python test_connections.py`

## Running the Server

### Development Mode

```bash
python main.py
```

### Production Mode (using systemd)

Create `/etc/systemd/system/mediease-cron-jobs.service`:

```ini
[Unit]
Description=MediEase Transcription & AI Extraction Cron Jobs
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/cron-job-server
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable mediease-cron-jobs
sudo systemctl start mediease-cron-jobs
sudo systemctl status mediease-cron-jobs
```

### Using PM2 (Alternative)

```bash
npm install -g pm2
pm2 start main.py --name mediease-cron-jobs --interpreter python3
pm2 save
pm2 startup
```

## Monitoring

### Check Logs

```bash
tail -f logs/cron_jobs.log
```

### Check MongoDB for Status

```javascript
// Check pending transcriptions
db.recordings.countDocuments({ transcriptionStatus: "pending" })

// Check failed transcriptions
db.recordings.find({ transcriptionStatus: "failed" })

// Check pending AI extractions
db.recordings.countDocuments({ 
    transcriptionStatus: "completed",
    "aiProcessing.notesExtractionStatus": "pending"
})
```

### Health Check Script

Create `health_check.py`:

```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DATABASE_NAME")]

pending_transcriptions = db.recordings.count_documents({"transcriptionStatus": "pending"})
pending_extractions = db.recordings.count_documents({
    "transcriptionStatus": "completed",
    "aiProcessing.notesExtractionStatus": "pending"
})
failed_transcriptions = db.recordings.count_documents({"transcriptionStatus": "failed"})
failed_extractions = db.recordings.count_documents({
    "aiProcessing.notesExtractionStatus": "failed"
})

print(f"Pending Transcriptions: {pending_transcriptions}")
print(f"Pending AI Extractions: {pending_extractions}")
print(f"Failed Transcriptions: {failed_transcriptions}")
print(f"Failed AI Extractions: {failed_extractions}")
```

## Troubleshooting

### Common Issues

1. **Whisper model not loading**
   - Check if Whisper is installed: `pip show whisper`
   - Check available models: `whisper --help`
   - Try smaller model: `whisper.load_model("tiny")`

2. **S3 download fails**
   - Verify AWS credentials
   - Check bucket permissions
   - Verify file path in MongoDB

3. **OpenAI API errors**
   - Check API key validity
   - Check rate limits
   - Verify account has credits

4. **MongoDB connection fails**
   - Verify connection string format
   - Check network access
   - Verify authentication

5. **High memory usage**
   - Reduce batch size (limit in queries)
   - Use smaller Whisper model
   - Process fewer recordings at once

## Language Support

### Transcription Language Mapping

- `"hi"` → Hindi (Whisper language code: `hi`)
- `"en"` → English (Whisper language code: `en`)
- `"hi-en"` → Hindi-English mix (uses `hi` as primary)
- `"en-hi"` → English-Hindi mix (uses `en` as primary)
- `"auto"` → Auto-detect language

The language is stored in the recording document as `transcriptionLanguage` and comes from the doctor's settings (default: `"hi"`).

## Notes

1. **Batch Processing**: Jobs process 10 recordings at a time to avoid overwhelming resources
2. **Error Handling**: Failed transcriptions/extractions are marked in database with error messages
3. **Cleanup**: Temporary files are automatically removed after processing
4. **Logging**: All operations are logged for debugging and monitoring
5. **Rate Limiting**: Adjust intervals based on your server capacity and recording volume

## Support

For issues or questions, check:
- Log files in `./logs/cron_jobs.log`
- MongoDB recording documents for error messages
- Server resource usage (CPU, memory, disk)

