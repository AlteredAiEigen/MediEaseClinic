# 🔑 Credentials & API Keys Required

This document lists all the credentials and API keys you need to provide to run the MediEase Clinic FastAPI backend.

---

## ✅ **Already Provided**

### 1. OpenAI API Key
**Status:** ✅ **Provided**  
**Location:** `ENV_TEMPLATE.txt`  
**Key:** `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`

---

## ⏳ **Still Needed**

### 2. MongoDB Atlas Connection String
**Status:** ⏳ **Required**  
**Purpose:** Primary database for storing all application data  
**HIPAA Requirement:** Must sign HIPAA BAA with MongoDB Atlas  

**How to get:**
1. Go to https://cloud.mongodb.com
2. Create a free cluster (or use existing)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or 0.0.0.0/0 for development)
5. Click "Connect" → "Connect your application"
6. Copy the connection string

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/mediease?retryWrites=true&w=majority
```

**Add to `.env` as:**
```env
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/mediease?retryWrites=true&w=majority"
DATABASE_NAME="mediease"
```

---

### 3. AWS Credentials (for S3 and Transcribe)
**Status:** ⏳ **Required**  
**Purpose:** 
- S3: Store consultation recordings, prescription images, medical reports
- Transcribe: Automatic transcription of consultation audio

**How to get:**
1. Go to AWS Console → IAM
2. Create new IAM user with programmatic access
3. Attach policies:
   - `AmazonS3FullAccess` (or custom policy for specific bucket)
   - `AmazonTranscribeFullAccess`
4. Save Access Key ID and Secret Access Key

**Create S3 Bucket:**
1. Go to AWS Console → S3
2. Create new bucket (e.g., `mediease-clinic-files`)
3. Enable "Server-side encryption (SSE-S3)"
4. Configure bucket policy for appropriate access

**Add to `.env` as:**
```env
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="mediease-clinic-files"
AWS_TRANSCRIBE_REGION="us-east-1"
```

---

### 4. JWT Secret Keys
**Status:** ⏳ **Required**  
**Purpose:** Secure JWT token generation for authentication  
**Security:** Must be unique, random, and at least 32 characters

**How to generate:**
```bash
# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate refresh token secret (run again)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Add to `.env` as:**
```env
JWT_SECRET_KEY="your-generated-secret-here"
JWT_REFRESH_SECRET_KEY="your-generated-refresh-secret-here"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**⚠️ WARNING:** Never use default/example secrets in production!

---

### 5. Encryption Key for PHI
**Status:** ⏳ **Required**  
**Purpose:** Field-level encryption for Protected Health Information (PHI)  
**HIPAA Requirement:** Required for encrypting sensitive patient data

**How to generate:**
```bash
# Generate 32-byte encryption key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Add to `.env` as:**
```env
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
```

**⚠️ CRITICAL:** Store this key securely! If lost, encrypted data cannot be recovered.

---

### 6. Google Gemini API Key (Optional)
**Status:** ⏳ **Optional**  
**Purpose:** Alternative to OpenAI for AI-powered clinical notes  
**Note:** You already have OpenAI, so this is optional

**How to get:**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key

**Add to `.env` as:**
```env
GEMINI_API_KEY="your-gemini-key-here"
GEMINI_MODEL="gemini-pro"
```

---

## 📝 **Quick Setup Checklist**

Copy this checklist and mark items as you complete them:

- [x] **OpenAI API Key** - Already provided in `ENV_TEMPLATE.txt`
- [ ] **MongoDB Atlas URL** - Create cluster and get connection string
- [ ] **AWS Access Key ID** - Create IAM user
- [ ] **AWS Secret Access Key** - From IAM user creation
- [ ] **S3 Bucket Name** - Create S3 bucket with encryption
- [ ] **JWT Secret Key** - Generate random 32+ character string
- [ ] **JWT Refresh Secret** - Generate another random 32+ character string
- [ ] **Encryption Key** - Generate 32-byte key for PHI encryption
- [ ] **Gemini API Key** (Optional) - For alternative AI provider

---

## 🚀 **Once You Have All Credentials**

1. **Create `.env` file:**
   ```bash
   cd /Users/chanpreetsingh/Documents/GitHub/Untitled/MediEaseClinic/fastapi
   cp ENV_TEMPLATE.txt .env
   ```

2. **Edit `.env` and replace placeholders:**
   - MongoDB URL
   - AWS credentials
   - JWT secrets
   - Encryption key

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Test the API:**
   - Visit http://localhost:8000/docs
   - Try creating a user with `/api/auth/register`
   - Login and test other endpoints

---

## 🔒 **Security Reminders**

### **DO:**
✅ Keep credentials in `.env` file (never commit to Git)  
✅ Use strong, random secrets (32+ characters)  
✅ Rotate secrets regularly in production  
✅ Use MongoDB Atlas with HIPAA BAA signed  
✅ Enable S3 bucket encryption (SSE-S3)  
✅ Store encryption key in secure vault (production)  
✅ Use HTTPS in production  
✅ Restrict AWS IAM permissions to minimum required  

### **DON'T:**
❌ Commit `.env` file to version control  
❌ Use default/example secrets  
❌ Share credentials in plain text  
❌ Use same secrets across environments  
❌ Store encryption key in code  
❌ Use HTTP in production  
❌ Give AWS users more permissions than needed  

---

## 🆘 **Need Help?**

### **MongoDB Atlas Setup Issues:**
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- Check IP whitelist in Atlas → Network Access
- Verify database user credentials

### **AWS Setup Issues:**
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- Ensure IAM user has correct policies attached

### **JWT/Encryption Key Issues:**
- Keys must be URL-safe base64 encoded
- Use the Python command provided above
- Store securely and never commit to Git

---

## 📞 **Priority Order**

If you want to get started quickly, provide credentials in this order:

1. **MongoDB Atlas URL** (Required to run app)
2. **JWT Secrets** (Required for authentication)
3. **Encryption Key** (Required for patient data)
4. **AWS Credentials** (Required for file uploads and transcriptions)
5. **Gemini Key** (Optional - you already have OpenAI)

---

**Once you have these credentials, your FastAPI backend will be fully operational! 🚀**

