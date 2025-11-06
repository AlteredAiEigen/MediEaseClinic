/**
 * MediEase Clinic - Demo Workflow Guide
 *
 * This guide demonstrates the complete patient journey workflow using authentic
 * Indian patient data and scenarios. All UI elements are functional for their
 * respective user roles.
 */

export const demoWorkflowGuide = {
  overview: {
    title: "MediEase Demo - Complete Healthcare Workflow",
    description:
      "Experience the full patient journey from registration to follow-up",
    location: "Indian Healthcare Setting",
    patients: 6,
    doctors: 6,
    staff: 4,
  },

  // Patient Profiles with Complete Journey
  patientJourneys: [
    {
      patient: "Rajesh Kumar Sharma",
      id: "P001",
      scenario: "Chronic Disease Management - Diabetes & Hypertension",
      journey: [
        {
          step: 1,
          action: "Check-in at Reception",
          role: "Receptionist",
          page: "/receptionist-dashboard",
          description: "Patient arrives for scheduled follow-up appointment",
          status: "checked-in",
          time: "09:00 AM",
        },
        {
          step: 2,
          action: "Doctor Consultation",
          role: "Doctor",
          page: "/doctor-workstation",
          description:
            "Dr. Amit Patel reviews vitals, lab results (HbA1c: 7.2%, FBS: 142 mg/dL)",
          details: {
            vitals: "BP: 142/88 mmHg, HR: 78 bpm, Temp: 98.4°F",
            complaints: "Occasional headaches, fatigue",
            examination:
              "Blood pressure slightly elevated, needs medication adjustment",
          },
        },
        {
          step: 3,
          action: "Prescription & Clinical Notes",
          role: "Doctor",
          page: "/consultation/:patientId",
          description: "Doctor writes prescription and clinical notes",
          prescription: [
            "Telmisartan 40mg - Once daily",
            "Metformin 500mg - Twice daily",
            "Atorvastatin 10mg - Once at night",
          ],

          clinicalNotes:
            "BP slightly elevated. Continue current medications. Advised dietary modifications - reduce salt, increase fiber. 30 minutes daily walking recommended.",
        },
        {
          step: 4,
          action: "Schedule Follow-up",
          role: "Doctor/Receptionist",
          page: "/doctor-appointments or /receptionist-appointments",
          description: "Schedule follow-up appointment in 4 weeks",
          nextAppointment: "Jan 25, 2024 - 10:00 AM",
        },
        {
          step: 5,
          action: "Complete Appointment",
          role: "Doctor",
          page: "/doctor-workstation",
          description: "Mark consultation as completed",
          status: "completed",
        },
        {
          step: 6,
          action: "Access Patient History",
          role: "Doctor/Admin",
          page: "/patient-details/:patientId",
          description:
            "View complete medical history, previous visits, prescriptions, lab results",
          historicalData: "2 previous visits with complete records",
        },
      ],
    },
    {
      patient: "Priya Menon",
      id: "P002",
      scenario: "Pregnancy Care - Second Trimester",
      journey: [
        {
          step: 1,
          action: "Scheduled Checkup",
          role: "Receptionist",
          page: "/receptionist-appointments",
          description:
            "Regular prenatal checkup scheduled with Dr. Sneha Reddy",
          time: "09:30 AM",
        },
        {
          step: 2,
          action: "Prenatal Consultation",
          role: "Doctor",
          page: "/consultation/:patientId",
          description: "Comprehensive prenatal examination",
          details: {
            vitals: "BP: 118/76 mmHg, Weight: 62 kg",
            examination: "Fetal heartbeat normal, ultrasound scheduled",
            labResults: "Hemoglobin: 11.2 g/dL (slightly low)",
          },
        },
        {
          step: 3,
          action: "Prescription Update",
          role: "Doctor",
          page: "/consultation/:patientId",
          prescription: [
            "Folic Acid 5mg - Once daily",
            "Calcium + Vitamin D - Once daily",
            "Iron supplement - Once daily (increased dose)",
          ],

          advice: "Increase iron-rich foods, continue prenatal vitamins",
        },
        {
          step: 4,
          action: "Schedule Next Visit",
          role: "Doctor",
          page: "/doctor-appointments",
          description: "Schedule next prenatal checkup in 4 weeks",
        },
      ],
    },
    {
      patient: "Mohammed Farhan Khan",
      id: "P003",
      scenario: "New Patient - Acute Respiratory Infection",
      journey: [
        {
          step: 1,
          action: "New Patient Registration",
          role: "Receptionist",
          page: "/register-patient",
          description: "Register new patient with complete details",
          details: {
            name: "Mohammed Farhan Khan",
            age: 28,
            phone: "+91 97654 32109",
            address: "78, Jubilee Hills, Hyderabad",
            emergencyContact: "+91 97654 32110 (Father)",
          },
        },
        {
          step: 2,
          action: "Book Appointment",
          role: "Receptionist",
          page: "/receptionist-appointments",
          description: "Book immediate consultation with Dr. Amit Patel",
          time: "10:00 AM",
          type: "consultation",
        },
        {
          step: 3,
          action: "First Consultation",
          role: "Doctor",
          page: "/consultation/:patientId",
          description: "Initial examination and diagnosis",
          details: {
            vitals: "Temp: 99.8°F, BP: 122/80 mmHg",
            complaints: "Cough, fever, breathing difficulty for 3 days",
            diagnosis: "Acute Respiratory Infection",
          },
        },
        {
          step: 4,
          action: "Prescribe Treatment",
          role: "Doctor",
          page: "/consultation/:patientId",
          prescription: [
            "Azithromycin 500mg - Once daily for 5 days",
            "Levocetrizine 5mg - Once daily at night",
            "Salbutamol inhaler - As needed",
          ],

          advice: "Rest, plenty of fluids, avoid cold foods",
        },
        {
          step: 5,
          action: "Schedule Follow-up",
          role: "Doctor",
          page: "/doctor-appointments",
          description: "Follow-up in 5 days to review progress",
        },
      ],
    },
    {
      patient: "Lakshmi Iyer",
      id: "P004",
      scenario: "Chronic Arthritis Management",
      journey: [
        {
          step: 1,
          action: "Follow-up Visit",
          role: "Receptionist",
          page: "/receptionist-dashboard",
          description: "Regular arthritis management follow-up",
          status: "completed",
          date: "Jan 19, 2024",
        },
        {
          step: 2,
          action: "Review Lab Results",
          role: "Doctor",
          page: "/patient-details/:patientId",
          description: "Dr. Vikram Singh reviews recent lab results",
          labResults: [
            "TSH: 3.2 mIU/L (Normal)",
            "Vitamin D: 22 ng/mL (Low)",
            "Calcium: 9.2 mg/dL (Normal)",
          ],
        },
        {
          step: 3,
          action: "Medication Review",
          role: "Doctor",
          page: "/consultation/:patientId",
          prescription: [
            "Thyroxine 75mcg - Once daily (morning)",
            "Calcium + Vitamin D - Once daily (increased dose)",
            "Glucosamine - Twice daily",
          ],

          advice: "Physiotherapy exercises, sun exposure for Vitamin D",
        },
        {
          step: 4,
          action: "Schedule Physiotherapy Review",
          role: "Doctor",
          page: "/doctor-appointments",
          description:
            "Next appointment in 2 weeks to review physiotherapy progress",
          nextAppointment: "Jan 27, 2024 - 02:00 PM",
        },
      ],
    },
    {
      patient: "Arjun Desai",
      id: "P005",
      scenario: "Annual Health Checkup",
      journey: [
        {
          step: 1,
          action: "Book Annual Checkup",
          role: "Receptionist",
          page: "/receptionist-appointments",
          description: "Schedule comprehensive health screening",
          time: "10:30 AM",
        },
        {
          step: 2,
          action: "Lab Tests Ordered",
          role: "Doctor",
          page: "/doctor-workstation",
          description: "Dr. Amit Patel orders comprehensive lab panel",
          tests: [
            "Complete Blood Count",
            "Lipid Profile",
            "Liver Function Test",
            "Kidney Function Test",
            "Fasting Blood Sugar",
            "HbA1c",
          ],
        },
        {
          step: 3,
          action: "Review Lab Results",
          role: "Doctor",
          page: "/patient-details/:patientId",
          description: "All results within normal range",
          labResults: "All parameters normal",
        },
        {
          step: 4,
          action: "Health Counseling",
          role: "Doctor",
          page: "/consultation/:patientId",
          advice:
            "Continue healthy lifestyle, regular exercise, balanced diet. Next annual checkup in 12 months.",
        },
      ],
    },
    {
      patient: "Anjali Gupta",
      id: "P006",
      scenario: "Chronic Migraine Management",
      journey: [
        {
          step: 1,
          action: "Check-in for Follow-up",
          role: "Receptionist",
          page: "/receptionist-dashboard",
          description: "Regular migraine management follow-up",
          time: "11:00 AM",
          status: "checked-in",
        },
        {
          step: 2,
          action: "Review Headache Diary",
          role: "Doctor",
          page: "/consultation/:patientId",
          description: "Dr. Priya Nair reviews patient's headache diary",
          details: {
            frequency: "2-3 episodes per month (improved from 5-6)",
            triggers: "Stress, lack of sleep, certain foods",
            currentMedication: "Propranolol 40mg twice daily",
          },
        },
        {
          step: 3,
          action: "Continue Treatment Plan",
          role: "Doctor",
          page: "/consultation/:patientId",
          prescription: [
            "Propranolol 40mg - Twice daily (continue)",
            "Sumatriptan 50mg - As needed for acute attacks",
          ],

          advice:
            "Maintain headache diary, stress management techniques, regular sleep schedule",
        },
        {
          step: 4,
          action: "Schedule Follow-up",
          role: "Doctor",
          page: "/doctor-appointments",
          description: "Next review in 2 months",
        },
      ],
    },
  ],

  // Role-Based Workflow Access
  roleWorkflows: {
    receptionist: {
      name: "Meera Krishnan",
      pages: [
        "/receptionist-dashboard",
        "/receptionist-patients",
        "/receptionist-appointments",
        "/register-patient",
        "/receptionist-settings",
        "/patient-details/:patientId",
      ],

      capabilities: [
        "Patient check-in/check-out",
        "Register new patients",
        "Schedule appointments",
        "Manage patient queue",
        "View patient basic information",
        "Update patient contact details",
      ],

      demoActions: [
        "Check-in Rajesh Kumar Sharma (P001) - Status changes from 'waiting' to 'checked-in'",
        "Register new patient Mohammed Farhan Khan (P003)",
        "Schedule appointment for Arjun Desai (P005)",
        "Move patients in queue to consultation",
        "View patient list and search functionality",
      ],
    },
    doctor: {
      name: "Dr. Amit Patel",
      pages: [
        "/doctor-dashboard",
        "/doctor-patients",
        "/doctor-workstation",
        "/doctor-appointments",
        "/patient-details/:patientId",
        "/patient-overview/:patientId",
        "/consultation/:patientId",
        "/doctor-settings",
      ],

      capabilities: [
        "View patient queue and upcoming appointments",
        "Start consultations",
        "Access complete patient medical history",
        "Write prescriptions",
        "Add clinical notes",
        "Order lab tests",
        "Review lab results",
        "Schedule follow-up appointments",
        "View patient analytics and insights",
      ],

      demoActions: [
        "Start consultation with Rajesh Kumar Sharma (P001) from workstation",
        "Review lab results in patient details page",
        "Write prescription in consultation session",
        "Add clinical notes and diagnosis",
        "Complete appointment and move to next patient",
        "Schedule follow-up appointments",
        "View patient visit history with previous prescriptions",
      ],
    },
    admin: {
      name: "Ravi Shankar",
      pages: [
        "/admin-dashboard",
        "/admin-patients",
        "/admin-appointments",
        "/admin-credentials",
        "/admin/user-profile/:userId",
        "/admin/patient-details/:patientId",
        "/admin-settings",
      ],

      capabilities: [
        "View clinic-wide statistics",
        "Manage all patients",
        "Manage all appointments",
        "Create/edit/delete user credentials",
        "View doctor and staff profiles",
        "Access all patient records",
        "Generate reports",
        "System configuration",
      ],

      demoActions: [
        "View dashboard with clinic statistics",
        "Search and view all patient records",
        "Manage doctor profiles (Dr. Amit Patel - D001)",
        "Create new staff credentials",
        "View appointment calendar for all doctors",
        "Access patient details for any patient",
        "Monitor clinic performance metrics",
      ],
    },
  },

  // Key Features to Demonstrate
  keyFeatures: [
    {
      feature: "Patient Registration",
      page: "/register-patient",
      role: "Receptionist",
      demo: "Register Mohammed Farhan Khan (P003) as new patient with complete details",
    },
    {
      feature: "Appointment Booking",
      page: "/receptionist-appointments or /doctor-appointments",
      role: "Receptionist/Doctor",
      demo: "Book appointment for any patient, view calendar, reschedule if needed",
    },
    {
      feature: "Patient Check-in",
      page: "/receptionist-dashboard",
      role: "Receptionist",
      demo: "Check-in Rajesh Kumar Sharma (P001) - moves to doctor's queue",
    },
    {
      feature: "Doctor Workstation",
      page: "/doctor-workstation",
      role: "Doctor",
      demo: "View patient queue, click 'Start Consultation' for next patient",
    },
    {
      feature: "Consultation Session",
      page: "/consultation/:patientId",
      role: "Doctor",
      demo: "Complete consultation with vitals, diagnosis, prescription, clinical notes",
    },
    {
      feature: "Patient Medical History",
      page: "/patient-details/:patientId",
      role: "Doctor/Admin",
      demo: "View Rajesh Kumar Sharma's complete history - 2 previous visits with prescriptions",
    },
    {
      feature: "Lab Results Review",
      page: "/patient-details/:patientId",
      role: "Doctor",
      demo: "Review lab results for Rajesh Kumar Sharma - HbA1c, FBS, Cholesterol",
    },
    {
      feature: "Prescription Writing",
      page: "/consultation/:patientId",
      role: "Doctor",
      demo: "Write prescription for any patient with medication details",
    },
    {
      feature: "Follow-up Scheduling",
      page: "/doctor-appointments",
      role: "Doctor",
      demo: "Schedule follow-up for Rajesh Kumar Sharma on Jan 25, 2024",
    },
    {
      feature: "Patient Search",
      page: "Any patient management page",
      role: "All roles",
      demo: "Search for patients by name, ID, phone number",
    },
    {
      feature: "User Profile Management",
      page: "/admin/user-profile/:userId",
      role: "Admin",
      demo: "View and edit Dr. Amit Patel's profile (D001)",
    },
    {
      feature: "Credentials Management",
      page: "/admin-credentials",
      role: "Admin",
      demo: "Create, update, delete user credentials, send password reset emails",
    },
  ],

  // Sample Data Summary
  dataSummary: {
    patients: [
      {
        id: "P001",
        name: "Rajesh Kumar Sharma",
        condition: "Diabetes & Hypertension",
        status: "checked-in",
      },
      {
        id: "P002",
        name: "Priya Menon",
        condition: "Pregnancy Care",
        status: "in-consultation",
      },
      {
        id: "P003",
        name: "Mohammed Farhan Khan",
        condition: "Respiratory Infection",
        status: "waiting",
      },
      {
        id: "P004",
        name: "Lakshmi Iyer",
        condition: "Arthritis",
        status: "completed",
      },
      {
        id: "P005",
        name: "Arjun Desai",
        condition: "Annual Checkup",
        status: "waiting",
      },
      {
        id: "P006",
        name: "Anjali Gupta",
        condition: "Migraine",
        status: "checked-in",
      },
    ],

    doctors: [
      {
        id: "D001",
        name: "Dr. Amit Patel",
        specialization: "General Physician & Diabetologist",
      },
      {
        id: "D002",
        name: "Dr. Kavita Deshmukh",
        specialization: "Cardiologist",
      },
      {
        id: "D003",
        name: "Dr. Vikram Singh",
        specialization: "Orthopedic Surgeon",
      },
      {
        id: "D004",
        name: "Dr. Sneha Reddy",
        specialization: "Gynecologist & Obstetrician",
      },
      { id: "D005", name: "Dr. Priya Nair", specialization: "Neurologist" },
      { id: "D006", name: "Dr. Rahul Mehta", specialization: "Pediatrician" },
    ],

    appointments: [
      {
        id: "A001",
        patient: "Rajesh Kumar Sharma",
        doctor: "Dr. Amit Patel",
        time: "09:00 AM",
        status: "in-progress",
      },
      {
        id: "A002",
        patient: "Priya Menon",
        doctor: "Dr. Sneha Reddy",
        time: "09:30 AM",
        status: "in-progress",
      },
      {
        id: "A003",
        patient: "Mohammed Farhan Khan",
        doctor: "Dr. Amit Patel",
        time: "10:00 AM",
        status: "scheduled",
      },
      {
        id: "A005",
        patient: "Arjun Desai",
        doctor: "Dr. Amit Patel",
        time: "10:30 AM",
        status: "scheduled",
      },
      {
        id: "A006",
        patient: "Anjali Gupta",
        doctor: "Dr. Priya Nair",
        time: "11:00 AM",
        status: "scheduled",
      },
    ],
  },

  // Testing Checklist
  testingChecklist: [
    "✓ All navigation items functional for each role",
    "✓ Patient check-in/check-out working",
    "✓ New patient registration form complete",
    "✓ Appointment booking and scheduling active",
    "✓ Doctor workstation queue management functional",
    "✓ Consultation session with all features working",
    "✓ Prescription writing and saving functional",
    "✓ Patient medical history accessible",
    "✓ Lab results display correctly",
    "✓ Follow-up appointment scheduling works",
    "✓ Patient search functionality active",
    "✓ Admin credential management functional",
    "✓ User profile viewing and editing works",
    "✓ All dialogs and modals functional",
    "✓ All buttons and clickable elements active",
    "✓ No disabled UI elements for intended roles",
  ],

  // Indian Healthcare Context
  indianContext: {
    currency: "INR (₹)",
    phoneFormat: "+91 XXXXX XXXXX",
    addressFormat: "House/Flat, Area, City, State - Pincode",
    commonConditions: [
      "Diabetes Type 2",
      "Hypertension",
      "Arthritis",
      "Respiratory infections",
      "Thyroid disorders",
      "Pregnancy care",
    ],

    commonMedications: [
      "Metformin (Diabetes)",
      "Telmisartan (Hypertension)",
      "Atorvastatin (Cholesterol)",
      "Thyroxine (Thyroid)",
      "Paracetamol (Pain/Fever)",
      "Azithromycin (Infections)",
    ],

    labTests: [
      "HbA1c",
      "Fasting Blood Sugar",
      "Lipid Profile",
      "Thyroid Profile",
      "Complete Blood Count",
      "Liver Function Test",
      "Kidney Function Test",
    ],
  },
};

export default demoWorkflowGuide;
