# 🏥 MediEaseClinic FastAPI Backend

**HIPAA-compliant Healthcare Management System API** built with FastAPI, MongoDB, AWS, and AI.

## ✅ **100% Implementation Complete**

All modules from the Node.js backend have been successfully converted to FastAPI with enhanced HIPAA compliance and AI capabilities.

## 🚀 **Features**

- 🔐 **JWT Authentication** with role-based access control (Admin, Doctor, Receptionist)
- 👥 **Patient Management** with field-level PHI encryption and data masking
- 📅 **Appointment Scheduling** with status tracking and follow-ups
- 💊 **Prescription Management** with multiple medications support
- 🎙️ **Consultation Recording** with AWS Transcribe integration
- 🤖 **AI-powered Clinical Notes** using OpenAI GPT-4 or Google Gemini
- 🏥 **Queue Management** with real-time patient tracking and wait times
- 👨‍⚕️ **Doctor & Staff Management** with speciality filtering
- 📊 **Admin Dashboard** with comprehensive statistics
- 🔒 **AWS S3** encrypted file storage with presigned URLs
- 📝 **Comprehensive Audit Logging** for HIPAA compliance
- ⚡ **Async operations** with Motor (MongoDB) for high performance

## 📦 **Complete Module List**

| Module | Status | Endpoints | AI-Powered |
|--------|--------|-----------|------------|
| Authentication | ✅ | 4 | ❌ |
| Patient Management | ✅ | 5 | ❌ |
| Appointments | ✅ | 5 | ❌ |
| Prescriptions | ✅ | 5 | ❌ |
| Recordings | ✅ | 6 | ✅ (AWS Transcribe) |
| Clinical Notes | ✅ | 10 | ✅ (OpenAI/Gemini) |
| Queue Management | ✅ | 8 | ❌ |
| Doctors | ✅ | 5 | ❌ |
| Receptionists | ✅ | 4 | ❌ |
| Admin Dashboard | ✅ | 9 | ❌ |

**Total: 61+ API endpoints**

## HIPAA Compliance

This system implements HIPAA security requirements:

- ✅ Encryption at rest (MongoDB Atlas + S3 SSE)
- ✅ Encryption in transit (HTTPS required in production)
- ✅ Field-level encryption for sensitive PHI
- ✅ Comprehensive audit logging (who, what, when)
- ✅ Role-based access control
- ✅ Data retention policies
- ✅ Secure file storage with presigned URLs

## Prerequisites

- Python 3.10+
- MongoDB Atlas account with HIPAA BAA
- AWS account with S3 and Transcribe access
- OpenAI or Google Gemini API key (for clinical notes)

## Installation

1. **Clone and navigate to fastapi directory**
```bash
cd fastapi
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp ENV_TEMPLATE.txt .env
# Edit .env with your configuration (OpenAI key already included!)
```

### Required Environment Variables

See `ENV_TEMPLATE.txt` for complete configuration. Key variables:

```env
# MongoDB Atlas (with HIPAA BAA)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT Secret (min 32 characters) - GENERATE NEW ONES!
JWT_SECRET_KEY=your-secure-secret-key-change-in-production
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key

# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# Encryption Key (32 bytes)
ENCRYPTION_KEY=your-encryption-key-for-phi-fields

# AI API Keys - OpenAI already configured in ENV_TEMPLATE.txt!
OPENAI_API_KEY=sk-proj-... (already provided)
OPENAI_MODEL=gpt-4-turbo-preview

# Google Gemini (alternative)
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-pro
```

## 📚 **Documentation**

This project includes comprehensive documentation:

- **`SETUP_GUIDE.md`** - Complete setup and deployment guide
- **`IMPLEMENTATION_SUMMARY.md`** - Full feature overview and implementation details
- **`API_QUICK_REFERENCE.md`** - Quick API testing guide with examples
- **`ENV_TEMPLATE.txt`** - Environment variables template (with OpenAI key)
- **`README.md`** - This file

## Running the Application

### Development Mode
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

When running in development mode, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - List patients (paginated)
- `GET /api/patients/{id}` - Get patient details
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient (soft delete)

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/{id}` - Get appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - List prescriptions
- `GET /api/prescriptions/{id}` - Get prescription

### Recordings & Transcriptions
- `POST /api/recordings` - Upload audio file
- `POST /api/recordings/{id}/transcribe` - Start transcription
- `GET /api/recordings/{id}` - Get recording with transcript
- `GET /api/recordings/patient/{patient_id}` - Patient recordings

### Clinical Notes (AI-Powered 🤖)
- `POST /api/clinical-notes` - Create clinical note
- `GET /api/clinical-notes` - List clinical notes
- `GET /api/clinical-notes/actionable` - Get actionable notes
- `GET /api/clinical-notes/{id}` - Get clinical note
- `PUT /api/clinical-notes/{id}` - Update clinical note
- `PUT /api/clinical-notes/{id}/complete` - Mark note complete
- `DELETE /api/clinical-notes/{id}` - Delete clinical note
- `POST /api/clinical-notes/ai/generate-from-transcript` - **AI: Generate from transcript**
- `POST /api/clinical-notes/ai/treatment-plan` - **AI: Generate treatment plan**
- `POST /api/clinical-notes/ai/summarize` - **AI: Summarize consultation**

### Queue Management
- `POST /api/queue/check-in` - Check in patient
- `GET /api/queue` - Get active queue
- `GET /api/queue/stats` - Get queue statistics
- `GET /api/queue/doctor/{doctor_id}` - Get doctor's queue
- `GET /api/queue/{id}` - Get queue entry
- `PUT /api/queue/{id}/status` - Update queue status
- `PUT /api/queue/{id}/start-consultation` - Start consultation
- `POST /api/queue/{id}/check-out` - Check out patient

### Doctors
- `GET /api/doctors` - List doctors (filtered, paginated)
- `GET /api/doctors/stats` - Get doctor statistics
- `GET /api/doctors/{id}` - Get single doctor
- `PUT /api/doctors/{id}` - Update doctor (admin)
- `DELETE /api/doctors/{id}` - Delete doctor (admin)

### Receptionists
- `GET /api/receptionists` - List receptionists (admin)
- `GET /api/receptionists/{id}` - Get receptionist (admin)
- `PUT /api/receptionists/{id}` - Update receptionist (admin)
- `DELETE /api/receptionists/{id}` - Delete receptionist (admin)

### Admin Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/patients` - List all patients
- `GET /api/admin/appointments` - List all appointments
- `GET /api/admin/clinical-notes` - List all clinical notes
- `GET /api/admin/recordings` - List all recordings

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

## Project Structure

```
fastapi/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Configuration management
│   ├── database.py          # MongoDB connection
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   ├── middleware/          # Custom middleware
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Security Best Practices

1. **Never commit `.env` file**
2. **Use strong JWT secrets** (min 32 characters)
3. **Enable HTTPS in production**
4. **Regularly rotate encryption keys**
5. **Monitor audit logs**
6. **Implement rate limiting**
7. **Keep dependencies updated**

## HIPAA Audit Logging

All PHI access is logged automatically:
- User identity
- Action performed
- Resource accessed
- Timestamp
- IP address
- Success/failure status

Access audit logs via admin dashboard or database query.

## Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Setup

Ensure MongoDB Atlas and AWS S3:
1. Enable encryption at rest
2. Configure VPC/network security
3. Enable audit logging
4. Sign HIPAA BAA
5. Configure backup policies

## Support

For issues or questions, contact the development team.

## License

MIT License - See LICENSE file for details.

