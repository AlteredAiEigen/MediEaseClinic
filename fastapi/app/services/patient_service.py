"""
Patient service with CRUD operations and PHI encryption.
HIPAA Compliance: Sensitive fields are encrypted before storage.
"""

from datetime import datetime
from typing import Optional, List, Dict
from copy import deepcopy
import re
import logging
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.models.patient import (
    PatientCreate,
    PatientUpdate,
    patient_helper,
    PatientInsights,
    DEFAULT_PATIENT_INSIGHTS,
    MedicalHistoryEntry,
)
from app.utils.security import field_encryption

logger = logging.getLogger(__name__)


class PatientService:
    """Service for handling patient operations with HIPAA compliance."""
    
    # Fields that contain sensitive PHI and should be encrypted
    ENCRYPTED_FIELDS = [
        "insuranceNumber",
        # Add other sensitive fields as needed
    ]
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.patients_collection = db.patients
        self.patient_history_collection = db.patient_history
    
    @staticmethod
    def _normalize_medical_history_payload(value) -> List[Dict[str, str]]:
        """Normalize incoming medical history payload to the stored structure."""
        if value is None:
            return []

        def to_entry(item) -> Optional[Dict[str, str]]:
            if isinstance(item, MedicalHistoryEntry):
                data = {k: v for k, v in item.model_dump().items() if v}
                return data or None
            if isinstance(item, dict):
                data: Dict[str, str] = {}
                for key in ["title", "diagnosis", "treatedBy", "recordedOn", "notes"]:
                    val = item.get(key)
                    if isinstance(val, str) and val.strip():
                        data[key] = val.strip()
                return data or None
            if isinstance(item, str):
                text = item.strip()
                return {"title": text} if text else None
            return None

        normalized: List[Dict[str, str]] = []
        if isinstance(value, list):
            for entry in value:
                parsed = to_entry(entry)
                if parsed:
                    normalized.append(parsed)
        else:
            parsed = to_entry(value)
            if parsed:
                normalized.append(parsed)
        return normalized

    async def generate_patient_id(self) -> str:
        """
        Generate unique patient ID (e.g., P001, P002).
        Finds the maximum numeric ID and increments it, with collision detection.
        
        Returns:
            Unique patient ID
        """
        max_number = 0
        
        # Fetch all patient IDs to find the maximum numeric value
        cursor = self.patients_collection.find(
            {"patientId": {"$exists": True, "$ne": None, "$regex": "^P\\d+$"}},
            {"patientId": 1}
        )
        all_patients = await cursor.to_list(length=None)
        
        # Extract numeric part from all patient IDs and find the maximum
        for patient in all_patients:
            patient_id = patient.get("patientId", "")
            if patient_id and patient_id.startswith("P") and len(patient_id) > 1:
                try:
                    number = int(patient_id[1:])
                    max_number = max(max_number, number)
                except (ValueError, IndexError):
                    continue
        
        # Start from max_number + 1, but check for collisions
        start_number = max_number + 1 if max_number > 0 else 1
        
        # Try up to 1000 times to find an unused ID (safety limit)
        for attempt in range(start_number, start_number + 1000):
            candidate_id = f"P{attempt:03d}"
            
            # Check if this ID already exists
            existing = await self.patients_collection.find_one({"patientId": candidate_id})
            if not existing:
                return candidate_id
        
        # Fallback: if we somehow exhaust all possibilities, use timestamp-based ID
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        return f"P{str(timestamp)[-6:]}"
    
    async def generate_mediease_clinic_email(
        self,
        first_name: str,
        last_name: str,
        date_of_birth: str
    ) -> str:
        """
        Generate unique MediEase clinic email based on patient name and date of birth.

        New format rules (for @mediease.alteredai.care):
        - Primary local part: first initial + full last name + 4-digit birth year
          e.g. Ram Tha, 2000-12-20 -> rtha2000
        - If that exists, extend with more letters from the first name:
          ratha2000, ramtha2000, ...
        - If still collision, append numeric suffix: _01, _02, ...
        - All characters are lowercase a–z0–9, max 30 chars before the @.
        """
        import re
        from datetime import datetime

        DOMAIN = "mediease.alteredai.care"
        MAX_LOCAL_LENGTH = 30

        def normalize(value: str) -> str:
            if not value:
                return ""
            value = value.lower().strip()
            return re.sub(r"[^a-z0-9]", "", value)

        # Normalize name parts
        fn = normalize(first_name)
        ln = normalize(last_name)

        # Extract 4-digit year from DOB
        year = "0000"
        if date_of_birth:
            try:
                year_val = datetime.fromisoformat(date_of_birth).year
                year = f"{year_val:04d}"
            except Exception:
                digits = re.sub(r"[^\d]", "", date_of_birth)
                if len(digits) >= 4:
                    year = digits[:4]

        # Build base local part
        if not fn and not ln:
            base_local = f"patient{year}"
        elif ln:
            base_local = (fn[:1] if fn else "") + ln + year
        else:
            base_local = fn + year

        base_local = (base_local or "patient")[:MAX_LOCAL_LENGTH]

        async def email_exists(local_part: str) -> bool:
            candidate_email = f"{local_part}@{DOMAIN}"
            existing = await self.patients_collection.find_one(
                {"medieaseClinicEmail": candidate_email}
            )
            return existing is not None

        # 1) Try base
        if not await email_exists(base_local):
            return f"{base_local}@{DOMAIN}"

        # 2) Extend first name letters if both names are present
        if fn and ln:
            for i in range(2, len(fn) + 1):
                cand_local = (fn[:i] + ln + year)[:MAX_LOCAL_LENGTH]
                if not await email_exists(cand_local):
                    return f"{cand_local}@{DOMAIN}"

        # 3) Add numeric suffix
        for counter in range(1, 1000):
            suffix = f"_{counter:02d}"
            trimmed_base = base_local
            if len(trimmed_base) + len(suffix) > MAX_LOCAL_LENGTH:
                trimmed_base = trimmed_base[: MAX_LOCAL_LENGTH - len(suffix)]
            cand_local = trimmed_base + suffix
            if not await email_exists(cand_local):
                return f"{cand_local}@{DOMAIN}"

        # 4) Fallback with timestamp
        ts = int(datetime.utcnow().timestamp())
        cand_local = (base_local[: MAX_LOCAL_LENGTH - 6] + f"_{ts % 100000}")[
            :MAX_LOCAL_LENGTH
        ]
        return f"{cand_local}@{DOMAIN}"
    
    async def create_patient(
        self,
        patient_data: PatientCreate,
        clinic_id: Optional[str] = None,
        clinic_name: Optional[str] = None
    ) -> dict:
        """
        Create a new patient with encrypted sensitive fields.
        
        Args:
            patient_data: Patient creation data
        
        Returns:
            Created patient data
        
        Raises:
            HTTPException: If patient creation fails
        """
        # Note: Email is not required to be unique - same email (e.g., Gmail) can be used for multiple patients
        # This allows family members or multiple patients to share the same email address
        
        # Generate patient ID
        patient_id = await self.generate_patient_id()
        
        # Prepare patient document
        patient_dict = patient_data.model_dump()
        
        # Handle lastName - set to empty string if None (for email generation)
        if not patient_dict.get("lastName"):
            patient_dict["lastName"] = ""
        
        # Calculate dateOfBirth from age if age is provided
        # If dateOfBirth is also provided, recalculate year but preserve month/day if it's a full date
        if patient_dict.get("age"):
            try:
                age = int(patient_dict["age"])
                from datetime import date
                today = date.today()
                # Calculate birth year: today's year minus age
                birth_year = today.year - age
                
                # If dateOfBirth already exists, preserve month and day if it's a full date (YYYY-MM-DD)
                existing_dob = patient_dict.get("dateOfBirth")
                if existing_dob and len(existing_dob) >= 7 and existing_dob[4] == "-":
                    # Extract month and day if it's a full date (YYYY-MM-DD)
                    if len(existing_dob) == 10 and existing_dob[7] == "-":
                        # Full date format: preserve month and day
                        month_day = existing_dob[5:]
                        patient_dict["dateOfBirth"] = f"{birth_year}-{month_day}"
                    else:
                        # Month/year format (YYYY-MM): preserve month
                        month = existing_dob[5:7]
                        patient_dict["dateOfBirth"] = f"{birth_year}-{month}-01"
                    logger.info(f"Recalculated dateOfBirth year from age {age}, preserved month/day: {patient_dict['dateOfBirth']}")
                else:
                    # No existing dateOfBirth or invalid format: use January 1st as default
                    patient_dict["dateOfBirth"] = f"{birth_year}-01-01"
                    logger.info(f"Calculated dateOfBirth from age {age}: {patient_dict['dateOfBirth']}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to calculate dateOfBirth from age '{patient_dict.get('age')}': {e}")
                # Set a default dateOfBirth if age conversion fails (optional field)
                if not patient_dict.get("dateOfBirth"):
                    patient_dict["dateOfBirth"] = None
        elif patient_dict.get("dateOfBirth"):
            # Handle month/year only format (YYYY-MM) - convert to YYYY-MM-01
            date_str = patient_dict["dateOfBirth"]
            if date_str and len(date_str) == 7 and date_str[4] == "-":  # Format: YYYY-MM
                patient_dict["dateOfBirth"] = f"{date_str}-01"  # Convert to YYYY-MM-01
                logger.info(f"Converted month/year dateOfBirth to full date: {patient_dict['dateOfBirth']}")
        
        # Extract medical history fields that should be stored in separate table
        medical_history_fields = {}
        for field in ["familyHistory", "previousSurgeries", "pastMedications"]:
            if field in patient_dict:
                medical_history_fields[field] = patient_dict.pop(field)
        
        patient_dict["patientId"] = patient_id
        patient_dict["email"] = patient_dict["email"].lower()
        
        # Generate unique MediEase clinic email
        # Use empty string if lastName is None
        last_name_for_email = patient_dict.get("lastName") or ""
        date_of_birth_for_email = patient_dict.get("dateOfBirth") or ""
        clinic_email = await self.generate_mediease_clinic_email(
            first_name=patient_data.firstName,
            last_name=last_name_for_email,
            date_of_birth=date_of_birth_for_email
        )
        patient_dict["medieaseClinicEmail"] = clinic_email
        
        patient_dict["createdAt"] = datetime.utcnow()
        patient_dict["updatedAt"] = datetime.utcnow()
        # Explicitly remove medical history fields to ensure they're never saved to patient table
        patient_dict.pop("familyHistory", None)
        patient_dict.pop("previousSurgeries", None)
        patient_dict.pop("pastMedications", None)
        
        # Log if these fields were found (shouldn't happen)
        if any(k in patient_dict for k in ["familyHistory", "previousSurgeries", "pastMedications"]):
            logger.warning(f"Medical history fields found in patient_dict after extraction! Keys: {[k for k in patient_dict.keys() if k in ['familyHistory', 'previousSurgeries', 'pastMedications']]}")
        
        patient_dict.setdefault("condition", None)
        patient_dict.setdefault("carePlanSummary", "")
        patient_dict.setdefault("followUpPlan", "")
        patient_dict.setdefault("lastVisit", None)
        if "medicalHistory" in patient_dict:
            patient_dict["medicalHistory"] = self._normalize_medical_history_payload(
                patient_dict.get("medicalHistory")
            )
        if not patient_dict.get("insights"):
            patient_dict["insights"] = deepcopy(DEFAULT_PATIENT_INSIGHTS)
        else:
            # Ensure insights contains all keys
            merged_insights = deepcopy(DEFAULT_PATIENT_INSIGHTS)
            merged_insights.update({k: v for k, v in (patient_dict.get("insights") or {}).items() if v is not None})
            patient_dict["insights"] = merged_insights
        # Store clinic info for reference (which clinic created the patient)
        # but patients are universal and not restricted to this clinic
        if clinic_id:
            patient_dict["createdByClinicId"] = clinic_id
        if clinic_name:
            patient_dict["createdByClinicName"] = clinic_name
        
        # Encrypt sensitive fields
        patient_dict = field_encryption.encrypt_dict_fields(
            patient_dict,
            self.ENCRYPTED_FIELDS
        )
        
        # Insert into database with retry logic for duplicate key errors
        max_retries = 5
        result = None
        for attempt in range(max_retries):
            try:
                # Final safeguard: ensure medical history fields are NEVER in patient_dict
                patient_dict.pop("familyHistory", None)
                patient_dict.pop("previousSurgeries", None)
                patient_dict.pop("pastMedications", None)
                
                result = await self.patients_collection.insert_one(patient_dict)
                break  # Success, exit retry loop
            except DuplicateKeyError as e:
                # Check if it's a patientId duplicate
                error_msg = str(e)
                if "patientId" in error_msg:
                    if attempt < max_retries - 1:
                        # Generate a new patient ID and retry
                        patient_id = await self.generate_patient_id()
                        patient_dict["patientId"] = patient_id
                        continue
                    else:
                        # Max retries reached
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to generate unique patient ID after {max_retries} attempts. Please try again."
                        )
                else:
                    # Different duplicate key error (e.g., email)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="A patient with this information already exists."
                    )
        
        # Ensure we have a result
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create patient. Please try again."
            )
        
        # Retrieve created patient
        created_patient = await self.patients_collection.find_one({"_id": result.inserted_id})
        
        # Decrypt before returning
        created_patient = field_encryption.decrypt_dict_fields(
            created_patient,
            self.ENCRYPTED_FIELDS
        )
        
        # Create medical history record if fields were provided
        if medical_history_fields:
            try:
                from app.services.patient_medical_history_service import PatientMedicalHistoryService
                from app.models.patient_medical_history import PatientMedicalHistoryCreate
                
                medical_history_service = PatientMedicalHistoryService(self.db)
                create_history_data = PatientMedicalHistoryCreate(
                    patientId=str(result.inserted_id),
                    **medical_history_fields
                )
                await medical_history_service.create_medical_history(create_history_data)
            except Exception as e:
                # Log but don't fail patient creation if medical history creation fails
                logger.warning(f"Failed to create medical history: {e}")
        
        return await patient_helper(created_patient)
    
    async def get_patient(self, patient_id: str) -> Optional[dict]:
        """
        Get patient by ID with decrypted sensitive fields.
        Auto-generates MediEase clinic email if missing.
        
        Args:
            patient_id: Patient MongoDB ID
        
        Returns:
            Patient data or None if not found
        """
        if not ObjectId.is_valid(patient_id):
            return None
        
        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            return None
        
        # Decrypt sensitive fields
        patient = field_encryption.decrypt_dict_fields(
            patient,
            self.ENCRYPTED_FIELDS
        )
        
        # Auto-generate MediEase clinic email if missing
        if not patient.get("medieaseClinicEmail"):
            try:
                first_name = patient.get("firstName", "")
                last_name = patient.get("lastName", "")
                date_of_birth = patient.get("dateOfBirth", "")
                
                if first_name and date_of_birth:
                    clinic_email = await self.generate_mediease_clinic_email(
                        first_name=first_name,
                        last_name=last_name,
                        date_of_birth=date_of_birth,
                    )
                    # Update patient in database
                    await self.patients_collection.update_one(
                        {"_id": ObjectId(patient_id)},
                        {"$set": {"medieaseClinicEmail": clinic_email, "updatedAt": datetime.utcnow()}}
                    )
                    patient["medieaseClinicEmail"] = clinic_email
                    logger.info(f"Auto-generated MediEase clinic email for patient {patient_id}: {clinic_email}")
            except Exception as e:
                logger.warning(f"Failed to auto-generate MediEase clinic email for patient {patient_id}: {e}")
        
        return await patient_helper(patient)
    
    async def get_patient_by_patient_id(self, patient_id: str) -> Optional[dict]:
        """
        Get patient by patientId (e.g., P001).
        Auto-generates MediEase clinic email if missing.
        
        Args:
            patient_id: Patient ID (e.g., P001)
        
        Returns:
            Patient data or None if not found
        """
        patient = await self.patients_collection.find_one({"patientId": patient_id})
        
        if not patient:
            return None
        
        # Decrypt sensitive fields
        patient = field_encryption.decrypt_dict_fields(
            patient,
            self.ENCRYPTED_FIELDS
        )
        
        # Auto-generate MediEase clinic email if missing
        patient_obj_id = patient.get("_id")
        if patient_obj_id and not patient.get("medieaseClinicEmail"):
            try:
                first_name = patient.get("firstName", "")
                last_name = patient.get("lastName", "")
                date_of_birth = patient.get("dateOfBirth", "")
                
                if first_name and date_of_birth:
                    clinic_email = await self.generate_mediease_clinic_email(
                        first_name=first_name,
                        last_name=last_name,
                        date_of_birth=date_of_birth,
                    )
                    # Update patient in database
                    await self.patients_collection.update_one(
                        {"_id": patient_obj_id},
                        {"$set": {"medieaseClinicEmail": clinic_email, "updatedAt": datetime.utcnow()}}
                    )
                    patient["medieaseClinicEmail"] = clinic_email
                    logger.info(f"Auto-generated MediEase clinic email for patient {patient_id}: {clinic_email}")
            except Exception as e:
                logger.warning(f"Failed to auto-generate MediEase clinic email for patient {patient_id}: {e}")
        
        return await patient_helper(patient)
    
    async def list_patients(
        self,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        present_in_clinic: Optional[bool] = None,
        phone: Optional[str] = None,
        date_of_birth: Optional[str] = None,
        address: Optional[str] = None,
        email: Optional[str] = None,
        clinic_id: Optional[str] = None  # Kept for backward compatibility but not used for filtering
    ) -> tuple[List[dict], int]:
        """
        List patients with pagination and filtering.
        
        Patients are universal across all clinics - not filtered by clinic.
        clinic_id parameter is kept for backward compatibility but not used.
        
        Args:
            page: Page number (1-indexed)
            limit: Items per page
            search: Search term for name, phone, email
            gender: Filter by gender
            present_in_clinic: Filter by clinic presence
            phone: Filter by phone number (exact match or partial)
            date_of_birth: Filter by date of birth (YYYY-MM-DD format)
            address: Filter by address (partial match)
        
        Returns:
            Tuple of (patient list, total count)
        """
        # Build query
        query = {}
        
        if search:
            # Build $or query, but exclude phone and email if they are provided as separate filters
            search_fields = [
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"patientId": {"$regex": search, "$options": "i"}},
            ]
            # Only include phone in search if phone filter is not provided separately
            if not phone:
                search_fields.append({"phone": {"$regex": search, "$options": "i"}})
            # Only include email in search if email filter is not provided separately
            if not email:
                search_fields.append({"email": {"$regex": search, "$options": "i"}})
            query["$or"] = search_fields
        
        if gender:
            query["gender"] = gender
        
        if present_in_clinic is not None:
            query["presentInClinic"] = present_in_clinic
        
        # Additional filters
        # Phone: Use exact digit matching (must match exactly the digits, allowing for formatting)
        if phone:
            try:
                # Normalize phone search: extract only digits
                phone_digits = re.sub(r'[^0-9]', '', phone.strip())  # Extract only digits
                
                # Remove +91 prefix if present (for Indian numbers)
                if phone_digits.startswith("91") and len(phone_digits) > 10:
                    phone_digits = phone_digits[2:]
                
                # Only proceed if we have digits to search (minimum 10 digits for valid phone)
                if len(phone_digits) >= 10:
                    # Create a simpler, more reliable regex pattern for MongoDB
                    # Match the exact digits in sequence, accounting for +91 prefix and formatting
                    
                    # Build a pattern that matches digits with optional non-digit characters between
                    # Escape each digit to handle special regex characters
                    escaped_digits = [re.escape(d) for d in phone_digits]
                    
                    # Create pattern: optionally +91 prefix, then digits with optional formatting, then end
                    # Use character class [^0-9] instead of \D for MongoDB compatibility
                    # Build pattern parts - escape + properly
                    prefix_part = "(\\+?91[^0-9]*)?"
                    digits_part = "[^0-9]*".join(escaped_digits)
                    end_part = "[^0-9]*$"
                    
                    phone_pattern = "^" + prefix_part + digits_part + end_part
                    
                    # Validate the pattern before using it
                    try:
                        test_pattern = re.compile(phone_pattern)
                        query["phone"] = {"$regex": phone_pattern, "$options": "i"}
                    except re.error as regex_error:
                        logger.error(f"Invalid regex pattern '{phone_pattern}' for phone '{phone}': {regex_error}")
                        # Fallback to simple digit matching (matches digits anywhere in phone)
                        query["phone"] = {"$regex": re.escape(phone_digits), "$options": "i"}
                        
            except Exception as e:
                logger.error(f"Error processing phone filter '{phone}': {e}", exc_info=True)
                # Fall back to simple exact digit matching if pattern creation fails
                try:
                    phone_digits = re.sub(r'[^0-9]', '', phone.strip())
                    if phone_digits.startswith("91") and len(phone_digits) > 10:
                        phone_digits = phone_digits[2:]
                    if len(phone_digits) >= 10:
                        query["phone"] = {"$regex": re.escape(phone_digits), "$options": "i"}
                except Exception as fallback_error:
                    logger.error(f"Fallback phone filter also failed: {fallback_error}")
                    # Don't add phone filter if all attempts fail
        
        # Date of Birth: Use exact match only (YYYY-MM-DD format)
        if date_of_birth:
            # Validate and normalize date format - must be exact YYYY-MM-DD
            dob_cleaned = date_of_birth.strip()
            # Ensure it's in YYYY-MM-DD format (exact match required)
            if re.match(r'^\d{4}-\d{2}-\d{2}$', dob_cleaned):
                query["dateOfBirth"] = dob_cleaned
        
        # Address: Use partial regex matching (as intended for text search)
        if address:
            query["address"] = {"$regex": address, "$options": "i"}
        
        # Email: Use case-insensitive exact or partial matching
        if email:
            email_cleaned = email.strip()
            if email_cleaned:
                query["email"] = {"$regex": re.escape(email_cleaned), "$options": "i"}
        
        # Note: clinic_id is NOT used for filtering - patients are universal
        
        # Calculate skip (defensive)
        skip = max((page - 1) * limit, 0)

        # Use a lightweight projection to speed up list queries
        projection = {
            "patientId": 1,
            "firstName": 1,
            "lastName": 1,
            "gender": 1,
            "age": 1,
            "phone": 1,
            "email": 1,
            "medieaseClinicEmail": 1,
            "presentInClinic": 1,
            "chiefComplaint": 1,
            "carePlanSummary": 1,
            "insights": 1,
            "emailVerified": 1,
            "createdAt": 1,
            "updatedAt": 1,
        }

        # Get total count
        total = await self.patients_collection.count_documents(query)

        # Get patients with projection and pagination
        cursor = (
            self.patients_collection
            .find(query, projection)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
        patients = await cursor.to_list(length=limit)

        # Format patients without decrypting unused fields for speed
        formatted_patients = [await patient_helper(patient) for patient in patients]

        return formatted_patients, total
    
    async def update_patient(self, patient_id: str, update_data: PatientUpdate, updated_by: Optional[dict] = None) -> Optional[dict]:
        """
        Update patient information.
        
        Args:
            patient_id: Patient MongoDB ID
            update_data: Update data
        
        Returns:
            Updated patient data or None if not found
        
        Raises:
            HTTPException: If patient not found
        """
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check if patient exists
        existing_patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not existing_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # ------------------------------------------------------------------
        # Record history: store the previous version in `patient_history`
        # before applying any updates. This ensures `patients` only contains
        # the latest active record, while older versions are queryable from
        # the history table.
        # ------------------------------------------------------------------
        try:
            valid_from = existing_patient.get("updatedAt") or existing_patient.get("createdAt") or datetime.utcnow()
            history_doc = {
                "patientMongoId": existing_patient["_id"],
                "patientId": existing_patient.get("patientId"),
                "snapshot": existing_patient,
                "validFrom": valid_from,
                "validTo": datetime.utcnow(),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            await self.patient_history_collection.insert_one(history_doc)
        except Exception as history_err:
            # Do not block the main update if history write fails, but log it.
            logger.warning(f"Failed to write patient history for {patient_id}: {history_err}", exc_info=True)

        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Log for debugging
        logger.info(f"Patient update for {patient_id}: update_dict keys: {list(update_dict.keys())}")

        if "medicalHistory" in update_dict:
            update_dict["medicalHistory"] = self._normalize_medical_history_payload(
                update_dict.get("medicalHistory")
            )
        
        # Extract legacy medical history fields that should be stored in separate table.
        # These should no longer be used, but we keep this block as a safeguard in case
        # old clients still send them.
        medical_history_fields = {}
        for field in ["familyHistory", "previousSurgeries", "pastMedications"]:
            if field in update_dict:
                medical_history_fields[field] = update_dict.pop(field)
                logger.warning(
                    f"Found deprecated field {field} in update_dict - this should not happen! "
                    f"Extracted: {str(medical_history_fields[field])[:50] if medical_history_fields[field] else 'empty'}..."
                )
        
        # Handle legacy medical history fields - create/update in separate table
        if medical_history_fields:
            try:
                from app.services.patient_medical_history_service import PatientMedicalHistoryService
                from app.models.patient_medical_history import PatientMedicalHistoryCreate, PatientMedicalHistoryUpdate
                
                medical_history_service = PatientMedicalHistoryService(self.db)
                
                # Get current medical history record
                current_history = await medical_history_service.get_current_medical_history(patient_id)
                
                if current_history:
                    # Update existing current record by creating new version
                    update_history_data = PatientMedicalHistoryUpdate(**medical_history_fields)
                    await medical_history_service.update_medical_history(
                        current_history["_id"],
                        update_history_data
                    )
                else:
                    # Create new record
                    create_history_data = PatientMedicalHistoryCreate(
                        patientId=patient_id,
                        **medical_history_fields
                    )
                    await medical_history_service.create_medical_history(create_history_data)
            except Exception as e:
                # Log but don't fail patient update if medical history update fails
                logger.warning(f"Failed to update medical history: {e}")
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Explicitly remove medical history fields to ensure they're never saved to patient table
        update_dict.pop("familyHistory", None)
        update_dict.pop("previousSurgeries", None)
        update_dict.pop("pastMedications", None)
        
        # Encrypt sensitive fields
        if update_dict.get("email"):
            update_dict["email"] = update_dict["email"].lower()

        # Backfill MediEase clinic email for legacy patients that don't have it yet.
        # We only generate it if it doesn't already exist on the document.
        if not existing_patient.get("medieaseClinicEmail"):
            try:
                first_name = update_dict.get("firstName", existing_patient.get("firstName", ""))
                last_name = update_dict.get("lastName", existing_patient.get("lastName", ""))
                date_of_birth = update_dict.get("dateOfBirth", existing_patient.get("dateOfBirth", ""))

                if first_name and date_of_birth:
                    clinic_email = await self.generate_mediease_clinic_email(
                        first_name=first_name,
                        last_name=last_name,
                        date_of_birth=date_of_birth,
                    )
                    update_dict["medieaseClinicEmail"] = clinic_email
                    logger.info(f"Generated MediEase clinic email during update for patient {patient_id}: {clinic_email}")
            except Exception as e:
                logger.warning(f"Failed to generate MediEase clinic email during update for patient {patient_id}: {e}")

        update_dict = field_encryption.encrypt_dict_fields(
            update_dict,
            self.ENCRYPTED_FIELDS
        )
        
        # Add updated timestamp
        update_dict["updatedAt"] = datetime.utcnow()
        
        # ALWAYS unset medical history fields from patient document (safeguard)
        # These fields should NEVER be in the patient table - remove them on EVERY update
        unset_fields = {
            "familyHistory": "",
            "previousSurgeries": "",
            "pastMedications": ""
        }
        
        # Update patient - always unset these fields as a safeguard
        # This ensures they're removed even if they somehow got into the document
        update_operation = {
            "$set": update_dict,
            "$unset": unset_fields  # Always remove these fields on every update
        }
        
        logger.info(f"Updating patient {patient_id}: $set keys={list(update_dict.keys())}, ALWAYS removing medical history fields via $unset")
        
        update_result = await self.patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            update_operation
        )
        
        if update_result.modified_count > 0:
            logger.info(f"Patient {patient_id} updated. Modified count: {update_result.modified_count}")
        
        # Retrieve updated patient
        updated_patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        
        # Decrypt sensitive fields
        updated_patient = field_encryption.decrypt_dict_fields(
            updated_patient,
            self.ENCRYPTED_FIELDS
        )
        
        formatted_patient = await patient_helper(updated_patient)
        
        return formatted_patient
    
    async def delete_patient(self, patient_id: str) -> bool:
        """
        Soft delete patient (mark as inactive rather than removing).
        HIPAA requires maintaining records, so we don't hard delete.
        
        Args:
            patient_id: Patient MongoDB ID
        
        Returns:
            True if deleted successfully
        
        Raises:
            HTTPException: If patient not found
        """
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        result = await self.patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$set": {
                    "isActive": False,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return True
    
    async def search_patients(self, query: str, clinic_id: Optional[str] = None) -> List[dict]:
        """
        Search patients by multiple fields.
        
        Patients are universal across all clinics - not filtered by clinic.
        clinic_id parameter is kept for backward compatibility but not used.
        
        Args:
            query: Search query (minimum 2 characters required for performance)
        
        Returns:
            List of matching patients
        """
        import re
        
        # Require minimum 2 characters for search to prevent expensive single-char queries
        if len(query) < 2:
            return []
        
        # Optimize regex pattern for better performance using prefix matching
        # Escape special regex characters and use prefix match for index usage
        escaped_query = re.escape(query)
        regex_pattern = f"^{escaped_query}"  # Prefix match with escaping

        search_query = {
            "$or": [
                {"firstName": {"$regex": regex_pattern, "$options": "i"}},
                {"lastName": {"$regex": regex_pattern, "$options": "i"}},
                {"email": {"$regex": regex_pattern, "$options": "i"}},
                {"phone": {"$regex": regex_pattern, "$options": "i"}},
                {"patientId": {"$regex": regex_pattern, "$options": "i"}},
            ]
        }
        
        # Note: clinic_id is NOT used for filtering - patients are universal
        
        cursor = self.patients_collection.find(search_query).limit(20)
        patients = await cursor.to_list(length=20)
        
        # Decrypt and format
        formatted_patients = []
        for patient in patients:
            patient = field_encryption.decrypt_dict_fields(
                patient,
                self.ENCRYPTED_FIELDS
            )
            formatted_patients.append(await patient_helper(patient))
        
        return formatted_patients

