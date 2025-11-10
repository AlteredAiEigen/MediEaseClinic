# Seed Doctor Data Script

This script creates mock data (patients, appointments, and queue entries) for the doctor account with email `channusingh1424@gmail.com`.

## Usage

1. Make sure your MongoDB connection is configured in `.env` file
2. Ensure the doctor account exists with email `channusingh1424@gmail.com`
3. Run the script:

```bash
cd fastapi
python seed_doctor_data.py
```

Or if using the virtual environment:

```bash
cd fastapi
source venv/bin/activate  # On Windows: venv\Scripts\activate
python seed_doctor_data.py
```

## What it creates:

- **5 Mock Patients**: John Smith, Sarah Johnson, Michael Brown, Emily Davis, David Wilson
- **Multiple Appointments**: 
  - 3 appointments for today (scheduled/checked-in status)
  - 8 appointments for the next 4 days (scheduled status)
- **3 Queue Entries**: First 3 patients added to the queue for today

## Notes:

- The script checks for existing data and skips duplicates
- Patients are linked to the doctor's clinic
- Appointments are created with proper doctor-patient relationships
- Queue entries are created with proper status (waiting/in-consultation)

