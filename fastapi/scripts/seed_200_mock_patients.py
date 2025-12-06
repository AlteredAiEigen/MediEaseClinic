#!/usr/bin/env python3
"""
Seed script to create 200 mock patients with diverse medical data for testing.

Generates patients with:
- Realistic Indian names, addresses, phone numbers
- Diverse ages (18-85), genders, blood groups
- Various medical conditions, allergies, medications
- Different clinic statuses and visit histories
- Proper patient IDs (P001, P002, etc.)
"""

import asyncio
import os
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from faker import Faker

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Parse MongoDB URI - handle case where DB name is in URI
MONGO_URI_RAW = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI") or os.getenv("mongodb_url") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGODB_DB_NAME") or os.getenv("database_name") or "mediease"

# If URI contains database name after the port/host, extract it
uri_without_query = MONGO_URI_RAW.split("?")[0]
if uri_without_query.count("/") >= 3:
    parts = uri_without_query.rsplit("/", 1)
    if len(parts) == 2 and parts[1] and parts[1] not in ["", "test", "admin", "local"]:
        MONGO_URI = parts[0]
        if not DB_NAME or DB_NAME == "mediease":
            DB_NAME = parts[1]
    else:
        MONGO_URI = MONGO_URI_RAW
else:
    MONGO_URI = MONGO_URI_RAW

fake = Faker('en_IN')  # Indian locale for realistic data

# Medical data pools
BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
GENDERS = ['Male', 'Female', 'Other']
ALLERGIES_POOL = [
    'Penicillin', 'Sulfa drugs', 'Aspirin', 'NSAIDs', 'Morphine', 'Codeine',
    'Latex', 'Iodine', 'Shellfish', 'Peanuts', 'Dust mites', 'Pollen',
    'Cat dander', 'Dog hair', 'Eggs', 'Milk', 'Soy', 'Wheat', None
]

MEDICAL_CONDITIONS = [
    'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Arthritis', 'Thyroid Disorder',
    'Heart Disease', 'Chronic Kidney Disease', 'COPD', 'Depression', 'Anxiety',
    'Migraine', 'GERD', 'Osteoporosis', 'Sleep Apnea', 'Obesity',
    'Hyperlipidemia', 'Atrial Fibrillation', 'Osteoarthritis', 'Gout',
    'Chronic Fatigue Syndrome', 'Fibromyalgia', 'IBS', 'Crohn\'s Disease',
    'Ulcerative Colitis', 'Psoriasis', 'Eczema', 'Allergic Rhinitis',
    'Sinusitis', 'Bronchitis', 'Pneumonia', 'UTI', 'Kidney Stones',
    'Gallstones', 'Hepatitis', 'Cirrhosis', 'Pancreatitis', 'Cholecystitis',
    'Appendicitis', 'Diverticulitis', 'Hemorrhoids', 'Varicose Veins'
]

SYMPTOMS_POOL = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Shortness of breath',
    'Chest pain', 'Abdominal pain', 'Joint pain', 'Back pain', 'Muscle pain',
    'Fever', 'Cough', 'Sore throat', 'Runny nose', 'Sneezing',
    'Itchy eyes', 'Skin rash', 'Swelling', 'Numbness', 'Tingling',
    'Insomnia', 'Anxiety', 'Depression', 'Memory problems', 'Concentration issues'
]

MEDICATIONS_POOL = [
    'Amlodipine 5mg', 'Metformin 500mg', 'Losartan 50mg', 'Atorvastatin 20mg',
    'Omeprazole 20mg', 'Levothyroxine 50mcg', 'Albuterol inhaler', 'Ibuprofen 400mg',
    'Prednisone 10mg', 'Warfarin 5mg', 'Insulin glargine', 'Furosemide 40mg',
    'Lisinopril 10mg', 'Metoprolol 25mg', 'Gabapentin 300mg', 'Sertraline 50mg',
    'Fluoxetine 20mg', 'Citalopram 20mg', 'Escitalopram 10mg', 'Venlafaxine 75mg',
    'Duloxetine 30mg', 'Trazodone 50mg', 'Zolpidem 10mg', 'Lorazepam 0.5mg',
    'Alprazolam 0.25mg', 'Clonazepam 0.5mg', 'Diazepam 5mg', 'Hydrocodone/APAP 5/325mg'
]

INSURANCE_PROVIDERS = [
    'Star Health Insurance', 'Max Bupa Health Insurance', 'ICICI Lombard Health',
    'HDFC ERGO Health Insurance', 'Apollo Munich Health Insurance',
    'Reliance Health Insurance', 'ManipalCigna Health Insurance',
    'Bajaj Allianz Health Insurance', 'New India Assurance', 'United India Insurance',
    'Oriental Insurance', 'National Insurance', None
]

INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune',
    'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
    'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan',
    'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
    'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Jabalpur', 'Gwalior',
    'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh',
    'Guwahati', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore',
    'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar',
    'Salem', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur',
    'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack',
    'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
    'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga',
    'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar',
    'Jammu', 'Sangli-Miraj', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur',
    'Tirunelveli', 'Malegaon', 'Gaya', 'Tiruppur', 'Davanagere', 'Kozhikode',
    'Akbarpur', 'Kurnool', 'Bokaro', 'Rajpur Sonarpur', 'South Dumdum',
    'Bellary', 'Patiala', 'Cuddalore', 'Bhagalpur', 'Durg-Bhilai Nagar',
    'Rajahmundry', 'Bijapur', 'Bharatpur', 'Rampur', 'Shivamogga',
    'Chandrapur', 'Junagadh', 'Thrissur', 'Alwar', 'Bardhaman', 'Kulti',
    'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur', 'Khammam', 'Ozhukarai',
    'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas',
    'Ichalkaranji', 'Karnal', 'Bathinda', 'Jalna', 'Eluru', 'Kirari Suleman Nagar',
    'Barasat', 'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar',
    'Rourkela', 'Durg', 'Imphal', 'Ratlam', 'Hapur', 'Arrah', 'Karimnagar',
    'Anantapur', 'Etawah', 'Ambernath', 'North Dumdum', 'Bharuch', 'Begusarai',
    'New Delhi', 'Gandhidham', 'Baranagar', 'Tiruvottiyur', 'Pondicherry',
    'Sikar', 'Thoothukudi', 'Rewa', 'Mirzapur', 'Raichur', 'Pali', 'Ramagundam',
    'Haridwar', 'Vijayanagaram', 'Katihar', 'Nagarcoil', 'Sri Ganganagar',
    'Karawal Nagar', 'Mango', 'Thanjavur', 'Bulandshahr', 'Uluberia',
    'Kishanganj', 'Fatehpur', 'Bongaigaon', 'Tenali', 'Ramnagar', 'Udaipur',
    'Munger', 'Morvi', 'Madhyamgram', 'Latur', 'Machilipatnam', 'Raebareli',
    'Porbandar', 'Orai', 'Bahraich', 'Vellore', 'Mehsana', 'Raiganj',
    'Sirsa', 'Danapur', 'Serampore', 'Sultan Pur Majra', 'Guna', 'Jaunpur',
    'Panvel', 'Shivpuri', 'Adoni', 'Suryapet', 'Mirasol', 'Tonk', 'Naihati',
    'Kirari Suleman Nagar', 'Yamunanagar', 'Kharagpur', 'Bidhannagar',
    'Barasat', 'Firozabad', 'Dibrugarh', 'Bhadreswar', 'Malkajgiri',
    'Deoghar', 'Bhusawal', 'Baharampur', 'Khandwa', 'Gondiya', 'Singrauli',
    'Nandurbar', 'Amroha', 'Anand', 'Deoria', 'Bhind', 'Bhalswa Jahangir Pur',
    'Madhyamgram', 'Saharsa', 'Vidisha', 'Giridih'
]


def generate_patient_id(index: int) -> str:
    """Generate patient ID like P001, P002, etc."""
    return f"P{index:03d}"


def generate_phone_number() -> str:
    """Generate realistic Indian phone number."""
    prefixes = ['98765', '87654', '76543', '65432', '9876', '8765', '7654']
    suffix = ''.join([str(random.randint(0, 9)) for _ in range(5)])
    return f"+91-{random.choice(prefixes)}-{suffix}"


def generate_address() -> str:
    """Generate realistic Indian address."""
    house_types = ['Apartment', 'House', 'Villa', 'Flat', 'Bungalow', 'Row House']
    house_number = random.randint(1, 999)
    street_types = ['Street', 'Road', 'Lane', 'Avenue', 'Nagar', 'Colony', 'Society']
    street_name = fake.street_name().split()[0]  # Take first word to avoid long names
    city = random.choice(INDIAN_CITIES)
    pincode = fake.postcode()

    return f"{random.choice(house_types)} {house_number}, {street_name} {random.choice(street_types)}, {city}, India - {pincode}"


def generate_medical_history() -> str:
    """Generate medical history."""
    conditions = random.sample(MEDICAL_CONDITIONS, random.randint(0, 3))
    if not conditions:
        return ""

    history_parts = []
    for condition in conditions:
        family_member = random.choice(['Father', 'Mother', 'Brother', 'Sister', 'Grandfather', 'Grandmother'])
        age = random.randint(40, 80)
        history_parts.append(f"{family_member} had {condition.lower()} at age {age}")

    return "; ".join(history_parts)


def generate_current_medications() -> List[Dict[str, str]]:
    """Generate current medications list."""
    num_meds = random.randint(0, 4)
    if num_meds == 0:
        return []

    medications = random.sample(MEDICATIONS_POOL, num_meds)
    meds_list = []
    for med in medications:
        meds_list.append({
            "name": med.split()[0],  # Medication name
            "dosage": med,  # Full dosage info
            "frequency": random.choice(["Once daily", "Twice daily", "Three times daily", "As needed", "Weekly"]),
            "prescribedDate": (datetime.utcnow() - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d")
        })

    return meds_list


def generate_insights() -> Dict[str, Any]:
    """Generate AI insights for patient."""
    risk_levels = ['low', 'medium', 'high']
    risk_level = random.choice(risk_levels)

    key_findings = []
    recommendations = []

    # Generate findings based on risk level
    if risk_level == 'high':
        key_findings.extend([
            "Elevated cardiovascular risk factors detected",
            "Multiple chronic conditions requiring close monitoring",
            "Recent lab values outside optimal range"
        ])
        recommendations.extend([
            "Schedule immediate follow-up consultation",
            "Consider medication adjustment",
            "Recommend lifestyle modification program"
        ])
    elif risk_level == 'medium':
        key_findings.extend([
            "Some risk factors present but manageable",
            "Good medication adherence noted",
            "Regular monitoring recommended"
        ])
        recommendations.extend([
            "Continue current treatment plan",
            "Schedule routine follow-up in 3 months",
            "Maintain healthy lifestyle habits"
        ])
    else:  # low
        key_findings.extend([
            "Low risk profile maintained",
            "Stable vital signs and lab values",
            "Good overall health indicators"
        ])
        recommendations.extend([
            "Continue preventive care measures",
            "Annual health screening recommended",
            "Maintain current healthy habits"
        ])

    return {
        "riskAssessment": f"Overall health risk assessment: {risk_level.title()}",
        "riskLevel": risk_level,
        "successRate": f"{random.randint(85, 98)}%",
        "keyFindings": random.sample(key_findings, random.randint(1, 3)),
        "recommendations": random.sample(recommendations, random.randint(1, 3)),
        "lastUpdatedAt": datetime.utcnow().isoformat()
    }


async def seed_200_mock_patients():
    """Create 200 mock patients with diverse data."""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    try:
        # Get a doctor for reference
        doctor = await db.users.find_one({"role": "doctor"})
        if not doctor:
            # Create a default doctor if none exists
            doctor = {
                "_id": ObjectId(),
                "firstName": "Dr. Test",
                "lastName": "Doctor",
                "email": "test.doctor@example.com"
            }

        doctor_id = str(doctor["_id"])
        clinic_id = doctor.get("clinicId", "TESTCLINIC")
        clinic_name = doctor.get("clinicName", "Test Clinic")

        patients_collection = db.patients

        print(f"🔌 Connected to MongoDB: {MONGO_URI}")
        print(f"📊 Database: {DB_NAME}")
        print("🏥 Starting creation of 200 mock patients...")
        # Check existing patients to avoid duplicates
        existing_count = await patients_collection.count_documents({})
        print(f"📊 Existing patients in database: {existing_count}")

        created_count = 0
        for i in range(1, 201):  # Generate patients P001 to P200
            patient_id = generate_patient_id(i)

            # Check if patient already exists
            existing = await patients_collection.find_one({"patientId": patient_id})
            if existing:
                print(f"⏭️  Patient {patient_id} already exists, skipping...")
                continue

            # Generate personal information
            gender = random.choice(GENDERS)
            first_name = fake.first_name_male() if gender == "Male" else fake.first_name_female()
            last_name = fake.last_name()

            # Calculate age and birth date
            age = random.randint(18, 85)
            birth_year = datetime.now().year - age
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)  # Avoid invalid dates
            date_of_birth = f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

            # Generate medical data
            blood_group = random.choice(BLOOD_GROUPS)
            allergies = random.choice(ALLERGIES_POOL)
            allergies_str = allergies if allergies else ""

            # Generate symptoms and conditions
            num_symptoms = random.randint(0, 3)
            current_symptoms = random.sample(SYMPTOMS_POOL, num_symptoms) if num_symptoms > 0 else []
            symptoms_str = ", ".join(current_symptoms) if current_symptoms else ""

            num_conditions = random.randint(0, 2)
            conditions = random.sample(MEDICAL_CONDITIONS, num_conditions) if num_conditions > 0 else []
            condition_str = ", ".join(conditions) if conditions else ""

            # Generate contact info
            email = f"{first_name.lower()}.{last_name.lower()}@{fake.domain_name()}"
            phone = generate_phone_number()
            address = generate_address()

            # Generate medical history
            family_history = generate_medical_history()

            # Generate current medications
            current_medications = generate_current_medications()

            # Generate chief complaint
            chief_complaints = [
                "Regular health checkup", "Follow-up consultation", "New symptoms evaluation",
                "Medication review", "Chronic condition management", "Acute illness",
                "Preventive care", "Diagnostic workup", "Treatment adjustment"
            ]
            chief_complaint = random.choice(chief_complaints) if random.random() > 0.3 else None

            # Generate care plans
            care_plans = [
                "Maintain healthy lifestyle with regular exercise",
                "Continue medication as prescribed",
                "Schedule follow-up in 3 months",
                "Monitor blood pressure regularly",
                "Dietary modifications recommended",
                "Regular lab work monitoring",
                "Physical therapy sessions",
                "Mental health support",
                "Weight management program",
                "Smoking cessation support"
            ]
            care_plan_summary = random.choice(care_plans) if random.random() > 0.4 else ""

            # Generate emergency contact
            emergency_contact = f"{fake.name()} ({random.choice(['Spouse', 'Parent', 'Sibling', 'Child', 'Friend'])})"
            emergency_contact_phone = generate_phone_number()

            # Generate insurance info
            insurance_provider = random.choice(INSURANCE_PROVIDERS)
            insurance_number = f"INS{random.randint(100000, 999999)}" if insurance_provider else None

            # Determine clinic presence (20% chance of being in clinic)
            present_in_clinic = random.random() < 0.2

            # Generate insights
            insights = generate_insights()

            # Create patient document
            patient_doc = {
                "_id": ObjectId(),
                "patientId": patient_id,
                "firstName": first_name,
                "lastName": last_name,
                "gender": gender,
                "age": str(age),
                "bloodGroup": blood_group,
                "dateOfBirth": date_of_birth,
                "email": email,
                "phone": phone,
                "address": address,
                "allergies": allergies_str,
                "familyHistory": family_history,
                "currentMedications": current_medications,
                "chiefComplaint": chief_complaint,
                "currentSymptoms": symptoms_str,
                "condition": condition_str,
                "carePlanSummary": care_plan_summary,
                "followUpPlan": "Follow up as needed",
                "insights": insights,
                "presentInClinic": present_in_clinic,
                "emergencyContact": emergency_contact,
                "emergencyContactPhone": emergency_contact_phone,
                "insuranceProvider": insurance_provider,
                "insuranceNumber": insurance_number,
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }

            # Insert patient
            await patients_collection.insert_one(patient_doc)
            created_count += 1

            if created_count % 20 == 0:
                print(f"✅ Created {created_count} patients so far...")

        print(f"\n🎉 Successfully created {created_count} new mock patients!")
        print("📊 Total patients in database:", await patients_collection.count_documents({}))

        # Show some sample patients
        print("\n📋 Sample patients created:")
        sample_patients = await patients_collection.find({}).limit(5).to_list(length=None)
        for patient in sample_patients:
            print(f"   {patient['patientId']}: {patient['firstName']} {patient['lastName']} ({patient['age']}y, {patient['gender']}) - {patient['email']}")

    except Exception as e:
        print(f"\n❌ ERROR during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


if __name__ == "__main__":
    print("🏥 MediEase Mock Patient Generator")
    print("=" * 50)
    print("Creating 200 diverse mock patients for testing...")
    print("This may take a few minutes...")
    print()

    asyncio.run(seed_200_mock_patients())

    print("\n✅ Mock patient generation complete!")
    print("🔍 Check your admin dashboard to see all the new patients!")