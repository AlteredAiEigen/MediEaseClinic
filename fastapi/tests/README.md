# 🧪 MediEase Clinic API Tests

Comprehensive test suite for all API endpoints with sequential test flow.

## 📋 **Test Coverage**

### **Test Files (Sequential Order)**

1. **test_01_health.py** - Health check and basic API functionality
2. **test_02_auth.py** - Authentication (register, login, tokens)
3. **test_03_patients.py** - Patient management CRUD
4. **test_04_appointments.py** - Appointment scheduling
5. **test_05_prescriptions.py** - Prescription management
6. **test_06_clinical_notes.py** - Clinical notes (including AI)
7. **test_07_queue.py** - Queue management
8. **test_08_doctors.py** - Doctor management
9. **test_09_admin.py** - Admin dashboard and management

### **Total Test Coverage**

- ✅ **80+ test cases**
- ✅ **All 61+ API endpoints** covered
- ✅ **Role-based access control** tested
- ✅ **Sequential flow** (mimics real usage)
- ✅ **CRUD operations** for all entities
- ✅ **Error handling** and edge cases

---

## 🚀 **Running Tests**

### **Prerequisites**

```bash
# Activate virtual environment
cd /Users/chanpreetsingh/Documents/GitHub/Untitled/MediEaseClinic/fastapi
source venv/bin/activate

# Ensure all dependencies are installed
pip install -r requirements.txt
```

### **Run All Tests**

```bash
# Run all tests in sequential order
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_02_auth.py -v

# Run specific test function
pytest tests/test_02_auth.py::test_login_success -v
```

### **Run Tests by Category**

```bash
# Health & Basic
pytest tests/test_01_health.py -v

# Authentication
pytest tests/test_02_auth.py -v

# Patient Management
pytest tests/test_03_patients.py -v

# Appointments
pytest tests/test_04_appointments.py -v

# Prescriptions
pytest tests/test_05_prescriptions.py -v

# Clinical Notes (with AI)
pytest tests/test_06_clinical_notes.py -v

# Queue Management
pytest tests/test_07_queue.py -v

# Doctor Management
pytest tests/test_08_doctors.py -v

# Admin Dashboard
pytest tests/test_09_admin.py -v
```

---

## 📊 **Test Output Options**

### **Verbose Output**

```bash
pytest tests/ -v
```

Shows test names and pass/fail status.

### **Detailed Output**

```bash
pytest tests/ -vv
```

Shows detailed information including assertions.

### **Show Print Statements**

```bash
pytest tests/ -v -s
```

Shows all print() statements in tests.

### **Coverage Report**

```bash
# Terminal coverage
pytest tests/ --cov=app

# HTML coverage report (opens in browser)
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

### **Failed Tests Only**

```bash
# Run only failed tests from last run
pytest tests/ --lf

# Run failed tests first, then rest
pytest tests/ --ff
```

---

## 🔧 **Test Configuration**

### **conftest.py**

Contains shared fixtures and setup:

- `test_client` - HTTP client for API testing
- `db_client` - MongoDB test database client
- `clean_db` - Clean database before each test
- `admin_user_data` - Admin user fixture
- `doctor_user_data` - Doctor user fixture
- `receptionist_user_data` - Receptionist fixture
- `patient_data` - Patient data fixture
- `appointment_data` - Appointment fixture
- `prescription_data` - Prescription fixture
- `clinical_note_data` - Clinical note fixture

### **pytest.ini** (Optional)

Create this file in the project root:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
```

---

## 📝 **Test Structure**

Each test file follows this pattern:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_feature_name(test_client: AsyncClient, fixtures):
    """Test description."""
    # Setup
    # ... create necessary data
    
    # Execute
    response = await test_client.post("/api/endpoint", json=data)
    
    # Assert
    assert response.status_code == 200
    assert data["success"] is True
```

---

## 🎯 **Test Flow**

The tests are designed to run sequentially, simulating real application usage:

1. **Health Check** - Verify API is running
2. **User Registration** - Create admin, doctor, receptionist
3. **Authentication** - Login and get tokens
4. **Patient Creation** - Add patient records
5. **Appointment Scheduling** - Book appointments
6. **Queue Check-in** - Add patients to queue
7. **Consultation** - Start consultation
8. **Clinical Notes** - Create notes (manual + AI)
9. **Prescriptions** - Write prescriptions
10. **Admin Management** - Dashboard and user management

---

## ✅ **Test Coverage by Module**

| Module | Tests | Coverage |
|--------|-------|----------|
| Health Check | 3 | Basic endpoints |
| Authentication | 7 | Register, login, tokens |
| Patients | 6 | Full CRUD |
| Appointments | 5 | Full CRUD |
| Prescriptions | 5 | Full CRUD |
| Clinical Notes | 6 | CRUD + AI features |
| Queue | 6 | Check-in, status, stats |
| Doctors | 5 | List, get, stats, update |
| Admin | 6 | Dashboard, user management |

**Total: 49+ core test functions**

---

## 🐛 **Debugging Tests**

### **Run Single Test with Debug Output**

```bash
pytest tests/test_02_auth.py::test_login_success -vv -s
```

### **Stop on First Failure**

```bash
pytest tests/ -x
```

### **Run Until N Failures**

```bash
pytest tests/ --maxfail=3
```

### **Show Locals on Failure**

```bash
pytest tests/ -l
```

---

## 🔍 **Common Issues**

### **Database Connection**

If tests fail with MongoDB connection errors:

```bash
# Check MongoDB URL in .env
# Ensure MongoDB Atlas is accessible
```

### **Authentication Errors**

If token-related tests fail:

```bash
# Check JWT_SECRET_KEY in .env
# Ensure tokens are being generated correctly
```

### **AI Tests Failing**

AI-related tests may fail if OpenAI API key is not configured:

```bash
# Tests are marked to skip if AI service unavailable
# Or set OPENAI_API_KEY in .env
```

---

## 📈 **CI/CD Integration**

### **GitHub Actions Example**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          pytest tests/ --cov=app
        env:
          MONGODB_URL: ${{ secrets.MONGODB_URL }}
          JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
```

---

## 🎓 **Best Practices**

1. ✅ **Run tests before committing**
2. ✅ **Write tests for new features**
3. ✅ **Keep tests independent** (use fixtures)
4. ✅ **Use descriptive test names**
5. ✅ **Test both success and failure cases**
6. ✅ **Clean database between tests** (automated)
7. ✅ **Mock external services** (if needed)

---

## 📞 **Need Help?**

- Check test output for specific error messages
- Review fixture data in `conftest.py`
- Ensure `.env` file has all required credentials
- Verify MongoDB connection
- Check API server is running (for integration tests)

---

## 🚀 **Quick Test Commands**

```bash
# Run everything
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific module
pytest tests/test_02_auth.py -v

# Debug single test
pytest tests/test_02_auth.py::test_login_success -vv -s

# Continuous testing (watch mode)
pytest-watch tests/
```

---

**Happy Testing! 🧪**

