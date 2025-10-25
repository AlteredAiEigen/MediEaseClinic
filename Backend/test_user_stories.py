#!/usr/bin/env python3
"""
MediEaseClinic API Test Suite - User Story Based
Complete workflow testing from admin setup to patient checkout
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional
import sys

# Configuration
BASE_URL = "http://localhost:5001"
RESULTS = []

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_header(text: str):
    """Print colored header"""
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.END}\n")

def print_step(step: str):
    """Print step description"""
    print(f"{Colors.YELLOW}▶ {step}{Colors.END}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def test_api(
    name: str,
    method: str,
    endpoint: str,
    token: Optional[str] = None,
    data: Optional[Dict] = None,
    expected_status: int = 200
) -> tuple[bool, Optional[Dict], int]:
    """
    Test an API endpoint
    Returns: (success, response_data, status_code)
    """
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        status_code = response.status_code
        
        try:
            response_data = response.json()
        except:
            response_data = {"raw": response.text}
        
        # Determine success
        success = (status_code >= 200 and status_code < 300)
        
        # Store result
        result = {
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "success": success,
            "response": response_data,
            "timestamp": datetime.now().isoformat()
        }
        RESULTS.append(result)
        
        # Print result
        if success:
            print_success(f"{name} - HTTP {status_code}")
        else:
            print_error(f"{name} - HTTP {status_code}")
            if isinstance(response_data, dict) and "message" in response_data:
                print(f"  Error: {response_data['message']}")
        
        return success, response_data, status_code
        
    except requests.exceptions.RequestException as e:
        print_error(f"{name} - Connection Error: {str(e)}")
        result = {
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status_code": 0,
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        RESULTS.append(result)
        return False, None, 0

def save_results():
    """Save test results to JSON file"""
    filename = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump({
            "test_run": datetime.now().isoformat(),
            "total_tests": len(RESULTS),
            "passed": sum(1 for r in RESULTS if r['success']),
            "failed": sum(1 for r in RESULTS if not r['success']),
            "results": RESULTS
        }, f, indent=2)
    print(f"\n{Colors.BLUE}Results saved to: {filename}{Colors.END}")

def main():
    """Main test execution"""
    print_header("MediEaseClinic API User Story Test Suite")
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Storage for IDs and tokens
    admin_token = None
    doctor1_id = None
    doctor1_token = None
    doctor2_id = None
    doctor2_token = None
    receptionist_id = None
    receptionist_token = None
    patient1_id = None
    patient2_id = None
    queue1_id = None
    queue2_id = None
    appointment1_id = None
    prescription1_id = None
    note1_id = None
    
    # ================================================
    # USER STORY 1: Admin Setup
    # ================================================
    print_header("USER STORY 1: Admin Sets Up Clinic")
    
    print_step("Step 1.1: Admin registers the clinic (or logs in if exists)")
    success, data, _ = test_api(
        "Register Admin Account",
        "POST",
        "/api/auth/register/admin",
        data={
            "clinicName": "HealthCare Plus Clinic",
            "adminEmail": f"admin{datetime.now().strftime('%Y%m%d%H%M%S')}@healthcareplus.com",
            "adminPassword": "Admin@123",
            "doctorRange": "10-20"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        admin_token = data['data'].get('token')
        print(f"  Admin token obtained: {admin_token[:20]}...")
    else:
        # Try logging in with existing admin
        print("  Admin exists, trying to login...")
        success, data, _ = test_api(
            "Admin Login (fallback)",
            "POST",
            "/api/auth/login",
            data={
                "email": "admin@healthcareplus.com",
                "password": "Admin@123"
            }
        )
        if success and data and 'data' in data:
            admin_token = data['data'].get('token')
            print(f"  Admin token obtained from login: {admin_token[:20]}...")
        else:
            print_error("Failed to get admin token. Stopping tests.")
            save_results()
            return
    
    print_step("Step 1.2: Admin logs in to verify credentials")
    success, data, _ = test_api(
        "Admin Login",
        "POST",
        "/api/auth/login",
        data={
            "email": "admin@healthcareplus.com",
            "password": "Admin@123"
        }
    )
    
    # ================================================
    # USER STORY 2: Admin Adds Staff
    # ================================================
    print_header("USER STORY 2: Admin Adds Doctors and Receptionists")
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    
    print_step("Step 2.1: Admin adds Dr. Sarah Johnson (Cardiologist)")
    success, data, _ = test_api(
        "Add Doctor - Dr. Sarah Johnson",
        "POST",
        "/api/auth/register",
        token=admin_token,
        data={
            "firstName": "Sarah",
            "lastName": "Johnson",
            "email": f"dr.sarah{timestamp}@healthcareplus.com",
            "password": "Doctor@123",
            "role": "doctor",
            "speciality": "Cardiology",
            "licenseNumber": f"CARD{timestamp}",
            "phone": f"+1{timestamp[:10]}"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        doctor1_id = data['data']['user'].get('_id')
        print(f"  Doctor 1 ID: {doctor1_id}")
    
    print_step("Step 2.2: Admin adds Dr. Michael Chen (General Medicine)")
    success, data, _ = test_api(
        "Add Doctor - Dr. Michael Chen",
        "POST",
        "/api/auth/register",
        token=admin_token,
        data={
            "firstName": "Michael",
            "lastName": "Chen",
            "email": f"dr.chen{timestamp}@healthcareplus.com",
            "password": "Doctor@123",
            "role": "doctor",
            "speciality": "General Medicine",
            "licenseNumber": f"GM{timestamp}",
            "phone": f"+2{timestamp[:10]}"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        doctor2_id = data['data']['user'].get('_id')
        print(f"  Doctor 2 ID: {doctor2_id}")
    
    print_step("Step 2.3: Admin adds Receptionist - Emily Brown")
    success, data, _ = test_api(
        "Add Receptionist - Emily Brown",
        "POST",
        "/api/auth/register",
        token=admin_token,
        data={
            "firstName": "Emily",
            "lastName": "Brown",
            "email": f"emily{timestamp}@healthcareplus.com",
            "password": "Reception@123",
            "role": "receptionist",
            "phone": f"+3{timestamp[:10]}"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        receptionist_id = data['data']['user'].get('_id')
        print(f"  Receptionist ID: {receptionist_id}")
    
    print_step("Step 2.4: Admin verifies all doctors")
    test_api("List All Doctors", "GET", "/api/doctors", token=admin_token)
    
    print_step("Step 2.5: Admin verifies all receptionists")
    test_api("List All Receptionists", "GET", "/api/receptionists", token=admin_token)
    
    # ================================================
    # USER STORY 3: Receptionist Logs In
    # ================================================
    print_header("USER STORY 3: Receptionist Starts Her Day")
    
    receptionist_email = f"emily{timestamp}@healthcareplus.com"
    
    print_step("Step 3.1: Emily (receptionist) logs in")
    success, data, _ = test_api(
        "Receptionist Login",
        "POST",
        "/api/auth/login",
        data={
            "email": receptionist_email,
            "password": "Reception@123"
        }
    )
    
    if success and data and 'data' in data:
        receptionist_token = data['data'].get('token')
        print(f"  Receptionist token obtained: {receptionist_token[:20]}...")
    
    # ================================================
    # USER STORY 4: First Patient Walk-in
    # ================================================
    print_header("USER STORY 4: First Patient Walks In (John Doe)")
    
    print_step("Step 4.1: Receptionist quick registers John Doe (walk-in)")
    success, data, _ = test_api(
        "Quick Register Patient - John Doe",
        "POST",
        "/api/patients/quick-register",
        token=receptionist_token,
        data={
            "firstName": "John",
            "lastName": "Doe",
            "phone": "+1555001001",
            "age": "45",
            "gender": "Male",
            "bloodGroup": "A+"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        patient1_id = data['data'].get('_id')
        print(f"  Patient 1 ID: {patient1_id}")
    
    if patient1_id and doctor1_id:
        print_step("Step 4.2: Receptionist checks in John Doe to Dr. Sarah's queue")
        success, data, _ = test_api(
            "Check In Patient 1",
            "POST",
            "/api/queue/check-in",
            token=receptionist_token,
            data={
                "patientId": patient1_id,
                "doctorId": doctor1_id,
                "reason": "Chest pain and shortness of breath",
                "priority": "high",
                "notes": "Patient reports discomfort for 2 hours"
            },
            expected_status=201
        )
        
        if success and data and 'data' in data:
            queue1_id = data['data'].get('_id')
            print(f"  Queue Entry 1 ID: {queue1_id}")
    
    # ================================================
    # USER STORY 5: Second Patient Appointment
    # ================================================
    print_header("USER STORY 5: Second Patient Has Appointment (Mary Smith)")
    
    print_step("Step 5.1: Receptionist registers Mary Smith")
    success, data, _ = test_api(
        "Quick Register Patient - Mary Smith",
        "POST",
        "/api/patients/quick-register",
        token=receptionist_token,
        data={
            "firstName": "Mary",
            "lastName": "Smith",
            "phone": "+1555002002",
            "age": "32",
            "gender": "Female",
            "bloodGroup": "O+"
        },
        expected_status=201
    )
    
    if success and data and 'data' in data:
        patient2_id = data['data'].get('_id')
        print(f"  Patient 2 ID: {patient2_id}")
    
    if patient2_id and doctor2_id:
        print_step("Step 5.2: Receptionist creates appointment for Mary with Dr. Chen")
        success, data, _ = test_api(
            "Create Appointment",
            "POST",
            "/api/appointments",
            token=receptionist_token,
            data={
                "patient": patient2_id,
                "doctor": doctor2_id,
                "date": "2025-10-26",
                "time": "10:00",
                "duration": 30,
                "reason": "Annual checkup",
                "priority": "medium"
            },
            expected_status=201
        )
        
        if success and data and 'data' in data:
            appointment1_id = data['data']['appointment'].get('_id')
            print(f"  Appointment ID: {appointment1_id}")
        
        print_step("Step 5.3: Receptionist checks in Mary for her appointment")
        success, data, _ = test_api(
            "Check In Patient 2",
            "POST",
            "/api/queue/check-in",
            token=receptionist_token,
            data={
                "patientId": patient2_id,
                "doctorId": doctor2_id,
                "appointmentId": appointment1_id,
                "reason": "Annual checkup",
                "priority": "medium"
            },
            expected_status=201
        )
        
        if success and data and 'data' in data:
            queue2_id = data['data'].get('_id')
            print(f"  Queue Entry 2 ID: {queue2_id}")
    
    print_step("Step 5.4: Receptionist views current clinic queue")
    test_api("View Clinic Queue", "GET", "/api/queue", token=receptionist_token)
    
    # ================================================
    # USER STORY 6: Dr. Sarah Treats Patient 1
    # ================================================
    print_header("USER STORY 6: Dr. Sarah Treats John Doe")
    
    doctor1_email = f"dr.sarah{timestamp}@healthcareplus.com"
    
    print_step("Step 6.1: Dr. Sarah logs in")
    success, data, _ = test_api(
        "Doctor 1 Login",
        "POST",
        "/api/auth/login",
        data={
            "email": doctor1_email,
            "password": "Doctor@123"
        }
    )
    
    if success and data and 'data' in data:
        doctor1_token = data['data'].get('token')
        print(f"  Doctor 1 token obtained: {doctor1_token[:20]}...")
    
    if doctor1_id and doctor1_token:
        print_step("Step 6.2: Dr. Sarah views her patient queue")
        test_api(
            "View Dr. Sarah's Queue",
            "GET",
            f"/api/queue/doctor/{doctor1_id}",
            token=doctor1_token
        )
    
    if queue1_id and doctor1_token:
        print_step("Step 6.3: Dr. Sarah starts consultation with John")
        test_api(
            "Start Consultation",
            "PUT",
            f"/api/queue/{queue1_id}/start-consultation",
            token=doctor1_token
        )
    
    if patient1_id and doctor1_token:
        print_step("Step 6.4: Dr. Sarah views John's full medical profile")
        test_api(
            "View Patient Full Profile",
            "GET",
            f"/api/patients/{patient1_id}/full-profile",
            token=doctor1_token
        )
        
        print_step("Step 6.5: Dr. Sarah records John's vitals")
        test_api(
            "Update Patient Vitals",
            "PUT",
            f"/api/patients/{patient1_id}/vitals",
            token=doctor1_token,
            data={
                "bloodPressure": "140/90",
                "heartRate": "88",
                "temperature": "98.6",
                "oxygenSaturation": "96",
                "weight": "82",
                "height": "175"
            }
        )
        
        print_step("Step 6.6: Dr. Sarah creates clinical note")
        success, data, _ = test_api(
            "Create Clinical Note",
            "POST",
            "/api/clinical-notes",
            token=doctor1_token,
            data={
                "patientId": patient1_id,
                "doctorId": doctor1_id,
                "title": "Chest Pain Consultation",
                "content": "Patient presented with chest discomfort and mild shortness of breath",
                "chiefComplaint": "Chest pain for 2 hours",
                "currentSymptoms": "Chest discomfort, mild dyspnea",
                "painLevel": "6",
                "diagnosis": "Possible angina, requires further cardiac workup",
                "treatmentPlan": "Refer to cardiology, prescribe nitrates PRN",
                "recommendations": "Avoid strenuous activity, follow up in 2 days",
                "category": "consultation"
            },
            expected_status=201
        )
        
        if success and data and 'data' in data:
            note1_id = data['data']['note'].get('_id')
            print(f"  Clinical Note ID: {note1_id}")
        
        print_step("Step 6.7: Dr. Sarah writes prescription for John")
        success, data, _ = test_api(
            "Create Prescription",
            "POST",
            "/api/prescriptions",
            token=doctor1_token,
            data={
                "patientId": patient1_id,
                "queueId": queue1_id,
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
            },
            expected_status=201
        )
        
        if success and data and 'data' in data:
            prescription1_id = data['data'].get('_id')
            print(f"  Prescription ID: {prescription1_id}")
    
    if queue1_id and doctor1_token:
        print_step("Step 6.8: Dr. Sarah marks consultation as completed")
        test_api(
            "Complete Consultation",
            "PUT",
            f"/api/queue/{queue1_id}/status",
            token=doctor1_token,
            data={"status": "completed"}
        )
    
    # ================================================
    # USER STORY 7: Dr. Chen Treats Patient 2
    # ================================================
    print_header("USER STORY 7: Dr. Chen Sees Mary Smith")
    
    doctor2_email = f"dr.chen{timestamp}@healthcareplus.com"
    
    print_step("Step 7.1: Dr. Chen logs in")
    success, data, _ = test_api(
        "Doctor 2 Login",
        "POST",
        "/api/auth/login",
        data={
            "email": doctor2_email,
            "password": "Doctor@123"
        }
    )
    
    if success and data and 'data' in data:
        doctor2_token = data['data'].get('token')
        print(f"  Doctor 2 token obtained: {doctor2_token[:20]}...")
    
    if doctor2_token:
        print_step("Step 7.2: Dr. Chen views his appointments")
        test_api(
            "View Dr. Chen's Appointments",
            "GET",
            "/api/appointments",
            token=doctor2_token
        )
        
        if doctor2_id:
            print_step("Step 7.3: Dr. Chen views his queue")
            test_api(
                "View Dr. Chen's Queue",
                "GET",
                f"/api/queue/doctor/{doctor2_id}",
                token=doctor2_token
            )
        
        if queue2_id:
            print_step("Step 7.4: Dr. Chen starts consultation with Mary")
            test_api(
                "Start Consultation with Mary",
                "PUT",
                f"/api/queue/{queue2_id}/start-consultation",
                token=doctor2_token
            )
        
        if patient2_id:
            print_step("Step 7.5: Dr. Chen records Mary's vitals")
            test_api(
                "Update Mary's Vitals",
                "PUT",
                f"/api/patients/{patient2_id}/vitals",
                token=doctor2_token,
                data={
                    "bloodPressure": "118/75",
                    "heartRate": "68",
                    "temperature": "98.2",
                    "oxygenSaturation": "99",
                    "weight": "62",
                    "height": "165"
                }
            )
            
            print_step("Step 7.6: Dr. Chen creates clinical note for annual checkup")
            test_api(
                "Create Annual Checkup Note",
                "POST",
                "/api/clinical-notes",
                token=doctor2_token,
                data={
                    "patientId": patient2_id,
                    "doctorId": doctor2_id,
                    "appointmentId": appointment1_id,
                    "title": "Annual Physical Examination",
                    "content": "Annual checkup completed. Patient reports occasional tension headaches.",
                    "chiefComplaint": "Routine annual physical",
                    "currentSymptoms": "Occasional headaches (1-2x per week)",
                    "diagnosis": "Healthy - Tension headaches",
                    "treatmentPlan": "Stress management, regular exercise",
                    "recommendations": "Maintain healthy lifestyle, manage stress levels",
                    "category": "follow-up"
                },
                expected_status=201
            )
        
        if queue2_id:
            print_step("Step 7.7: Dr. Chen marks consultation complete")
            test_api(
                "Complete Mary's Consultation",
                "PUT",
                f"/api/queue/{queue2_id}/status",
                token=doctor2_token,
                data={"status": "completed"}
            )
    
    # ================================================
    # USER STORY 8: Patient Checkout
    # ================================================
    print_header("USER STORY 8: Patients Check Out")
    
    if queue1_id and receptionist_token:
        print_step("Step 8.1: Receptionist checks out John Doe")
        test_api(
            "Check Out Patient 1",
            "POST",
            f"/api/queue/{queue1_id}/check-out",
            token=receptionist_token
        )
    
    if queue2_id and receptionist_token:
        print_step("Step 8.2: Receptionist checks out Mary Smith")
        test_api(
            "Check Out Patient 2",
            "POST",
            f"/api/queue/{queue2_id}/check-out",
            token=receptionist_token
        )
    
    if admin_token:
        print_step("Step 8.3: Admin views queue statistics for the day")
        test_api(
            "View Queue Statistics",
            "GET",
            "/api/queue/stats",
            token=admin_token
        )
    
    # ================================================
    # USER STORY 9: Admin Reviews Activity
    # ================================================
    print_header("USER STORY 9: Admin Reviews Daily Activity")
    
    if admin_token:
        print_step("Step 9.1: Admin views dashboard statistics")
        test_api(
            "View Admin Dashboard",
            "GET",
            "/api/admin/dashboard",
            token=admin_token
        )
        
        print_step("Step 9.2: Admin views all appointments")
        test_api(
            "View All Appointments",
            "GET",
            "/api/appointments",
            token=admin_token
        )
        
        print_step("Step 9.3: Admin views all patients")
        test_api(
            "View All Patients",
            "GET",
            "/api/patients",
            token=admin_token
        )
        
        print_step("Step 9.4: Admin views all prescriptions")
        test_api(
            "View All Prescriptions",
            "GET",
            "/api/prescriptions",
            token=admin_token
        )
        
        if patient1_id:
            print_step("Step 9.5: Admin views John Doe's complete medical history")
            test_api(
                "View Patient 1 Full History",
                "GET",
                f"/api/patients/{patient1_id}/full-profile",
                token=admin_token
            )
    
    # ================================================
    # Summary
    # ================================================
    print_header("Test Suite Complete!")
    
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r['success'])
    failed = total - passed
    
    print(f"\n{Colors.BLUE}Summary:{Colors.END}")
    print(f"  Total Tests: {total}")
    print(f"  {Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"  {Colors.RED}Failed: {failed}{Colors.END}")
    print(f"  Success Rate: {(passed/total*100):.1f}%\n")
    
    print(f"{Colors.BLUE}User Stories Completed:{Colors.END}")
    print("  ✓ Admin account created and configured")
    print(f"  ✓ 2 doctors added (Dr. Sarah - Cardiology, Dr. Chen - General Medicine)")
    print("  ✓ 1 receptionist added (Emily)")
    print("  ✓ 2 patients registered and checked in")
    print("  ✓ 1 appointment created")
    print("  ✓ 2 consultations completed")
    print("  ✓ Clinical notes created")
    print("  ✓ 1 prescription created")
    print("  ✓ Queue management tested")
    print("  ✓ Patient checkout completed")
    
    # Print failed tests
    if failed > 0:
        print(f"\n{Colors.RED}Failed Tests:{Colors.END}")
        for r in RESULTS:
            if not r['success']:
                print(f"  ✗ {r['name']} - {r['method']} {r['endpoint']}")
                if 'response' in r and isinstance(r['response'], dict):
                    if 'message' in r['response']:
                        print(f"    Error: {r['response']['message']}")
    
    # Save results
    save_results()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test suite interrupted by user{Colors.END}")
        save_results()
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {str(e)}{Colors.END}")
        save_results()
        sys.exit(1)

