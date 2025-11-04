#!/usr/bin/env python3
"""
Comprehensive API Testing Script for MediEase Clinic
Tests all major API endpoints with real HTTP requests
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"
TIMEOUT = 10

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {}

    def log(self, message: str, status: str = "INFO"):
        """Log messages with timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None,
                    headers: Optional[Dict] = None, auth_token: Optional[str] = None) -> Dict:
        """Make HTTP request and return parsed response"""
        url = f"{BASE_URL}{endpoint}"

        headers = headers or {}
        headers["Content-Type"] = "application/json"

        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=TIMEOUT)
            else:
                raise ValueError(f"Unsupported method: {method}")

            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return {
                "status_code": response.status_code,
                "data": response_data,
                "success": response.status_code < 400
            }

        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }

    def test_health(self) -> bool:
        """Test health endpoint"""
        self.log("Testing health endpoint...")
        result = self.make_request("GET", "/health")
        success = result["success"] and result["data"].get("status") == "healthy"
        self.log(f"Health check: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_auth_registration(self) -> bool:
        """Test user registration"""
        self.log("Testing user registration...")

        # Test data
        users = [
            {
                "email": f"admin_{int(time.time())}@test.com",
                "firstName": "Test",
                "lastName": "Admin",
                "password": "Admin123!",
                "role": "admin"
            },
            {
                "email": f"doctor_{int(time.time())}@test.com",
                "firstName": "Dr. Test",
                "lastName": "Doctor",
                "password": "Doctor123!",
                "role": "doctor",
                "speciality": "General Medicine",
                "licenseNumber": f"DOC{int(time.time())}"
            }
        ]

        success_count = 0
        for user_data in users:
            result = self.make_request("POST", "/api/auth/register", user_data)
            if result["success"]:
                self.log(f"Registration successful for {user_data['role']}")
                success_count += 1
            else:
                self.log(f"Registration failed for {user_data['role']}: {result['data']}", "FAIL")

        self.test_data["admin_user"] = users[0]
        self.test_data["doctor_user"] = users[1]

        success = success_count == len(users)
        self.log(f"Auth registration: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_auth_login(self) -> bool:
        """Test user login"""
        self.log("Testing user login...")

        success_count = 0
        for user_key, user_data in [("admin", self.test_data.get("admin_user")),
                                   ("doctor", self.test_data.get("doctor_user"))]:
            if not user_data:
                continue

            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }

            result = self.make_request("POST", "/api/auth/login", login_data)
            if result["success"]:
                token_data = result["data"].get("data", {})
                access_token = token_data.get("accessToken")
                user_info = token_data.get("user", {})
                if access_token:
                    self.tokens[user_key] = access_token
                    # Store user ID for later use
                    if user_key == "doctor":
                        self.test_data["doctor_id"] = user_info.get("_id")
                    self.log(f"Login successful for {user_key}")
                    success_count += 1
                else:
                    self.log(f"Login failed for {user_key}: No access token", "FAIL")
            else:
                self.log(f"Login failed for {user_key}: {result['data']}", "FAIL")

        success = success_count == 2
        self.log(f"Auth login: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_patient_management(self) -> bool:
        """Test patient CRUD operations"""
        self.log("Testing patient management...")

        doctor_token = self.tokens.get("doctor")
        if not doctor_token:
            self.log("No doctor token available, skipping patient tests", "SKIP")
            return False

        # Create patient
        patient_data = {
            "firstName": "John",
            "lastName": "Doe",
            "gender": "Male",
            "age": "35",
            "bloodGroup": "A+",
            "dateOfBirth": "1990-01-15",
            "email": f"patient_{int(time.time())}@test.com",
            "phone": "+1234567890",
            "address": "123 Main St, New York, NY, USA"
        }

        # Test CREATE
        result = self.make_request("POST", "/api/patients", patient_data, auth_token=doctor_token)
        if not result["success"]:
            self.log(f"Patient creation failed: {result['data']}", "FAIL")
            return False

        # Extract patient ID from response - handle nested structure
        response_data = result["data"].get("data", {})
        if isinstance(response_data, dict) and "patient" in response_data:
            patient_data = response_data["patient"]
            if isinstance(patient_data, dict) and "_id" in patient_data:
                patient_id = patient_data["_id"]
            else:
                self.log(f"Cannot find patient _id in response: {result['data']}", "FAIL")
                return False
        else:
            self.log(f"Unexpected response structure: {result['data']}", "FAIL")
            return False

        self.log(f"Patient created with ID: {patient_id}")

        # Test READ
        result = self.make_request("GET", f"/api/patients/{patient_id}", auth_token=doctor_token)
        read_data = result["data"].get("data", result["data"])
        if isinstance(read_data, dict) and "patient" in read_data:
            read_data = read_data["patient"]
        success_read = result["success"] and isinstance(read_data, dict) and read_data.get("firstName") == "John"
        if not success_read:
            self.log(f"READ failed: {result['data']}", "DEBUG")

        # Test UPDATE
        update_data = {"phone": "+1987654321"}
        result = self.make_request("PUT", f"/api/patients/{patient_id}", update_data, auth_token=doctor_token)
        success_update = result["success"]
        if not success_update:
            self.log(f"UPDATE failed: {result['data']}", "DEBUG")

        # Test LIST
        result = self.make_request("GET", "/api/patients?page=1&limit=10", auth_token=doctor_token)
        list_data = result["data"].get("data", result["data"])
        success_list = result["success"] and isinstance(list_data, list)
        if not success_list:
            self.log(f"LIST failed: {result['data']}", "DEBUG")

        # Store patient ID for appointment testing
        self.test_data["patient_id"] = patient_id

        success = success_read and success_update and success_list
        self.log(f"Patient management: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_appointment_management(self) -> bool:
        """Test appointment CRUD operations"""
        self.log("Testing appointment management...")

        doctor_token = self.tokens.get("doctor")
        patient_id = self.test_data.get("patient_id")
        doctor_id = self.test_data.get("doctor_id")

        if not doctor_token or not patient_id or not doctor_id:
            self.log("Missing doctor token, patient ID, or doctor ID, skipping appointment tests", "SKIP")
            return False

        # Create appointment
        appointment_data = {
            "patientId": patient_id,
            "doctorId": doctor_id,
            "date": "2024-12-15",
            "time": "10:00",
            "duration": 30,
            "reason": "Regular checkup"
        }

        # Test CREATE
        result = self.make_request("POST", "/api/appointments", appointment_data, auth_token=doctor_token)
        if not result["success"]:
            self.log(f"Appointment creation failed: {result['data']}", "FAIL")
            return False

        # Extract appointment ID from nested response
        response_data = result["data"].get("data", {})
        if isinstance(response_data, dict) and "appointment" in response_data:
            appointment_data_resp = response_data["appointment"]
            if isinstance(appointment_data_resp, dict) and "_id" in appointment_data_resp:
                appointment_id = appointment_data_resp["_id"]
            else:
                self.log(f"Cannot find appointment _id in response: {result['data']}", "FAIL")
                return False
        else:
            self.log(f"Unexpected appointment response structure: {result['data']}", "FAIL")
            return False

        self.log(f"Appointment created with ID: {appointment_id}")

        # Test READ
        result = self.make_request("GET", f"/api/appointments/{appointment_id}", auth_token=doctor_token)
        success_read = result["success"]
        if not success_read:
            self.log(f"Appointment READ failed: {result['data']}", "DEBUG")

        # Test UPDATE
        update_data = {"notes": "Updated appointment notes"}
        result = self.make_request("PUT", f"/api/appointments/{appointment_id}", update_data, auth_token=doctor_token)
        success_update = result["success"]
        if not success_update:
            self.log(f"Appointment UPDATE failed: {result['data']}", "DEBUG")

        # Test LIST
        result = self.make_request("GET", "/api/appointments?page=1&limit=10", auth_token=doctor_token)
        success_list = result["success"]
        if not success_list:
            self.log(f"Appointment LIST failed: {result['data']}", "DEBUG")

        success = success_read and success_update and success_list
        self.log(f"Appointment management: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_prescription_management(self) -> bool:
        """Test prescription CRUD operations"""
        self.log("Testing prescription management...")

        doctor_token = self.tokens.get("doctor")
        patient_id = self.test_data.get("patient_id")
        doctor_id = self.test_data.get("doctor_id")

        if not doctor_token or not patient_id or not doctor_id:
            self.log("Missing doctor token, patient ID, or doctor ID, skipping prescription tests", "SKIP")
            return False

        # Create prescription
        prescription_data = {
            "patientId": patient_id,
            "doctorId": doctor_id,
            "medications": [
                {
                    "name": "Aspirin",
                    "dosage": "100mg",
                    "frequency": "Once daily",
                    "duration": "30 days"
                }
            ],
            "diagnosis": "Hypertension",
            "notes": "Take with food"
        }

        # Test CREATE
        result = self.make_request("POST", "/api/prescriptions", prescription_data, auth_token=doctor_token)
        if not result["success"]:
            self.log(f"Prescription creation failed: {result['data']}", "FAIL")
            return False

        # Extract prescription ID from nested response
        response_data = result["data"].get("data", {})
        if isinstance(response_data, dict) and "prescription" in response_data:
            prescription_data_resp = response_data["prescription"]
            if isinstance(prescription_data_resp, dict) and "_id" in prescription_data_resp:
                prescription_id = prescription_data_resp["_id"]
            else:
                self.log(f"Cannot find prescription _id in response: {result['data']}", "FAIL")
                return False
        else:
            self.log(f"Unexpected prescription response structure: {result['data']}", "FAIL")
            return False

        self.log(f"Prescription created with ID: {prescription_id}")

        # Test READ
        result = self.make_request("GET", f"/api/prescriptions/{prescription_id}", auth_token=doctor_token)
        success_read = result["success"]

        # Test LIST
        result = self.make_request("GET", "/api/prescriptions?page=1&limit=10", auth_token=doctor_token)
        success_list = result["success"]

        success = success_read and success_list
        self.log(f"Prescription management: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_queue_management(self) -> bool:
        """Test queue management"""
        self.log("Testing queue management...")

        admin_token = self.tokens.get("admin")
        if not admin_token:
            self.log("No admin token available, skipping queue tests", "SKIP")
            return False

        # Test GET queue
        result = self.make_request("GET", "/api/queue", auth_token=admin_token)
        success = result["success"] and isinstance(result["data"].get("data", result["data"]), list)
        if not success:
            self.log(f"Queue GET failed: {result['data']}", "DEBUG")
        self.log(f"Queue management: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_doctor_management(self) -> bool:
        """Test doctor management"""
        self.log("Testing doctor management...")

        admin_token = self.tokens.get("admin")
        if not admin_token:
            self.log("No admin token available, skipping doctor tests", "SKIP")
            return False

        # Test GET doctors
        result = self.make_request("GET", "/api/doctors", auth_token=admin_token)
        success = result["success"] and isinstance(result["data"].get("data", result["data"]), list)
        if not success:
            self.log(f"Doctor GET failed: {result['data']}", "DEBUG")
        self.log(f"Doctor management: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def test_admin_dashboard(self) -> bool:
        """Test admin dashboard"""
        self.log("Testing admin dashboard...")

        admin_token = self.tokens.get("admin")
        if not admin_token:
            self.log("No admin token available, skipping admin tests", "SKIP")
            return False

        # Test dashboard stats
        result = self.make_request("GET", "/api/admin/dashboard", auth_token=admin_token)
        success_dashboard = result["success"]
        if not success_dashboard:
            self.log(f"Dashboard GET failed: {result['data']}", "DEBUG")

        # Test system stats
        result = self.make_request("GET", "/api/admin/stats", auth_token=admin_token)
        success_stats = result["success"]
        if not success_stats:
            self.log(f"Admin stats GET failed: {result['data']}", "DEBUG")

        success = success_dashboard and success_stats
        self.log(f"Admin dashboard: {'✅ PASS' if success else '❌ FAIL'}", "PASS" if success else "FAIL")
        return success

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting MediEase Clinic API Testing Suite")
        self.log("=" * 50)

        # Wait for server to start
        time.sleep(3)

        test_results = []

        # Core tests
        test_results.append(("Health Check", self.test_health()))
        test_results.append(("Auth Registration", self.test_auth_registration()))
        test_results.append(("Auth Login", self.test_auth_login()))

        # Feature tests
        test_results.append(("Patient Management", self.test_patient_management()))
        test_results.append(("Appointment Management", self.test_appointment_management()))
        test_results.append(("Prescription Management", self.test_prescription_management()))
        test_results.append(("Queue Management", self.test_queue_management()))
        test_results.append(("Doctor Management", self.test_doctor_management()))
        test_results.append(("Admin Dashboard", self.test_admin_dashboard()))

        # Summary
        self.log("\n" + "=" * 50)
        self.log("📊 TEST RESULTS SUMMARY")

        passed = 0
        total = len(test_results)

        for test_name, success in test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if success:
                passed += 1

        self.log(f"\n🎯 Overall: {passed}/{total} tests passed")

        if passed == total:
            self.log("🎉 ALL APIs are working correctly!")
            return True
        else:
            self.log("⚠️  Some APIs have issues")
            return False


if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
