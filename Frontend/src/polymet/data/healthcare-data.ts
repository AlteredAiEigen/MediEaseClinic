export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  bloodType: string;
  lastVisit: string;
  nextAppointment?: string;
  status: "checked-in" | "waiting" | "in-consultation" | "completed";
  condition?: string;
  avatar: string;
  isNew: boolean;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
  };
  labResults?: {
    test: string;
    value: string;
    date: string;
    status: "normal" | "high" | "low";
  }[];
  visitHistory?: {
    id: string;
    date: string;
    time: string;
    title: string;
    description: string;
    doctor: string;
    relativeTime: string;
    prescription: string[];
    clinicalNotes: string;
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency" | "checkup";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  reason: string;
  avatar: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  patients: number;
  experience: string;
  avatar: string;
  status: "available" | "busy" | "off-duty";
}

export interface Staff {
  id: string;
  name: string;
  role: "receptionist" | "nurse" | "admin";
  email: string;
  phone: string;
  avatar: string;
  status: "active" | "on-break" | "off-duty";
}

export interface Review {
  rating: "excellent" | "great" | "good" | "average" | "poor";
  count: number;
}

export const patients: Patient[] = [
  {
    id: "P001",
    name: "Rajesh Kumar Sharma",
    age: 45,
    gender: "Male",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@email.com",
    bloodType: "B+",
    lastVisit: "2024-01-18",
    nextAppointment: "2024-01-25",
    status: "checked-in",
    condition: "Hypertension Follow-up",
    avatar: "https://github.com/yusufhilmi.png",
    isNew: false,
    address: "45, MG Road, Bangalore, Karnataka - 560001",
    emergencyContact: "+91 98765 43211 (Wife - Priya Sharma)",
    medicalHistory: [
      "Hypertension (diagnosed 2020)",
      "Type 2 Diabetes (diagnosed 2019)",
      "High Cholesterol",
    ],

    allergies: ["Penicillin", "Sulfa drugs"],
    currentMedications: [
      "Telmisartan 40mg - Once daily",
      "Metformin 500mg - Twice daily",
      "Atorvastatin 10mg - Once at night",
    ],

    vitals: {
      bloodPressure: "142/88 mmHg",
      heartRate: "78 bpm",
      temperature: "98.4°F",
      weight: "82 kg",
      height: "172 cm",
    },
    labResults: [
      { test: "HbA1c", value: "7.2%", date: "2024-01-15", status: "high" },
      {
        test: "Fasting Blood Sugar",
        value: "142 mg/dL",
        date: "2024-01-15",
        status: "high",
      },
      {
        test: "Total Cholesterol",
        value: "198 mg/dL",
        date: "2024-01-15",
        status: "normal",
      },
      {
        test: "LDL Cholesterol",
        value: "118 mg/dL",
        date: "2024-01-15",
        status: "normal",
      },
    ],

    visitHistory: [
      {
        id: "V001-1",
        date: "Dec 28, 2023",
        time: "10:30 AM",
        title: "Diabetes & Hypertension Review",
        description:
          "Quarterly review of diabetes and blood pressure management",
        doctor: "Dr. Amit Patel",
        relativeTime: "3 weeks ago",
        prescription: [
          "Telmisartan 40mg - Once daily",
          "Metformin 500mg - Twice daily",
          "Atorvastatin 10mg - Once at night",
        ],

        clinicalNotes:
          "BP: 138/86 mmHg, FBS: 135 mg/dL. Patient showing good compliance. Advised to continue current medications. Recommended 30 minutes daily walking and reduced salt intake. Follow-up in 4 weeks with lab reports.",
      },
      {
        id: "V001-2",
        date: "Oct 15, 2023",
        time: "02:00 PM",
        title: "Routine Checkup",
        description: "General health assessment and medication review",
        doctor: "Dr. Amit Patel",
        relativeTime: "3 months ago",
        prescription: [
          "Telmisartan 40mg - Once daily",
          "Metformin 500mg - Twice daily",
        ],

        clinicalNotes:
          "BP: 145/90 mmHg. Added Atorvastatin for cholesterol management. Patient advised on dietary modifications - reduce oil, increase fiber intake. Regular exercise recommended.",
      },
    ],
  },
  {
    id: "P002",
    name: "Priya Menon",
    age: 32,
    gender: "Female",
    phone: "+91 98234 56789",
    email: "priya.menon@email.com",
    bloodType: "O+",
    lastVisit: "2024-01-20",
    status: "in-consultation",
    condition: "Pregnancy - Second Trimester Checkup",
    avatar: "https://github.com/kdrnp.png",
    isNew: false,
    address: "12/3, Anna Nagar, Chennai, Tamil Nadu - 600040",
    emergencyContact: "+91 98234 56790 (Husband - Arun Menon)",
    medicalHistory: ["First pregnancy", "No previous complications"],
    allergies: ["None known"],
    currentMedications: [
      "Folic Acid 5mg - Once daily",
      "Calcium + Vitamin D - Once daily",
      "Iron supplement - Once daily",
    ],

    vitals: {
      bloodPressure: "118/76 mmHg",
      heartRate: "82 bpm",
      temperature: "98.2°F",
      weight: "62 kg",
      height: "160 cm",
    },
    labResults: [
      {
        test: "Hemoglobin",
        value: "11.2 g/dL",
        date: "2024-01-18",
        status: "low",
      },
      {
        test: "Blood Sugar (Random)",
        value: "102 mg/dL",
        date: "2024-01-18",
        status: "normal",
      },
      {
        test: "Thyroid (TSH)",
        value: "2.4 mIU/L",
        date: "2024-01-10",
        status: "normal",
      },
    ],

    visitHistory: [
      {
        id: "V002-1",
        date: "Dec 20, 2023",
        time: "11:00 AM",
        title: "First Trimester Checkup",
        description: "Initial pregnancy consultation and ultrasound",
        doctor: "Dr. Sneha Reddy",
        relativeTime: "1 month ago",
        prescription: [
          "Folic Acid 5mg - Once daily",
          "Calcium + Vitamin D - Once daily",
        ],

        clinicalNotes:
          "First pregnancy confirmed. Ultrasound shows healthy fetus. All vitals normal. Started on prenatal vitamins. Advised on nutrition - increase protein, green vegetables, and fruits. Avoid junk food. Next visit in 4 weeks.",
      },
    ],
  },
  {
    id: "P003",
    name: "Mohammed Farhan Khan",
    age: 28,
    gender: "Male",
    phone: "+91 97654 32109",
    email: "farhan.khan@email.com",
    bloodType: "A+",
    lastVisit: "2024-01-20",
    status: "waiting",
    condition: "Respiratory Infection",
    avatar: "https://github.com/denizbuyuktas.png",
    isNew: true,
    address: "78, Jubilee Hills, Hyderabad, Telangana - 500033",
    emergencyContact: "+91 97654 32110 (Father - Abdul Khan)",
    medicalHistory: ["Asthma (childhood, resolved)"],
    allergies: ["Dust", "Pollen"],
    currentMedications: ["None"],
    vitals: {
      bloodPressure: "122/80 mmHg",
      heartRate: "88 bpm",
      temperature: "99.8°F",
      weight: "75 kg",
      height: "178 cm",
    },
    labResults: [],
    visitHistory: [],
  },
  {
    id: "P004",
    name: "Lakshmi Iyer",
    age: 58,
    gender: "Female",
    phone: "+91 96543 21098",
    email: "lakshmi.iyer@email.com",
    bloodType: "AB+",
    lastVisit: "2024-01-19",
    nextAppointment: "2024-01-27",
    status: "completed",
    condition: "Arthritis Management",
    avatar: "https://github.com/yahyabedirhan.png",
    isNew: false,
    address: "23, Koramangala, Bangalore, Karnataka - 560034",
    emergencyContact: "+91 96543 21099 (Son - Ramesh Iyer)",
    medicalHistory: [
      "Osteoarthritis (diagnosed 2018)",
      "Hypothyroidism (diagnosed 2015)",
    ],

    allergies: ["NSAIDs (causes gastric issues)"],
    currentMedications: [
      "Thyroxine 75mcg - Once daily (morning)",
      "Calcium + Vitamin D - Once daily",
      "Glucosamine - Twice daily",
    ],

    vitals: {
      bloodPressure: "135/82 mmHg",
      heartRate: "72 bpm",
      temperature: "98.1°F",
      weight: "68 kg",
      height: "158 cm",
    },
    labResults: [
      { test: "TSH", value: "3.2 mIU/L", date: "2024-01-12", status: "normal" },
      {
        test: "Vitamin D",
        value: "22 ng/mL",
        date: "2024-01-12",
        status: "low",
      },
      {
        test: "Calcium",
        value: "9.2 mg/dL",
        date: "2024-01-12",
        status: "normal",
      },
    ],

    visitHistory: [
      {
        id: "V004-1",
        date: "Dec 15, 2023",
        time: "03:00 PM",
        title: "Arthritis Review",
        description: "Joint pain assessment and medication adjustment",
        doctor: "Dr. Vikram Singh",
        relativeTime: "5 weeks ago",
        prescription: [
          "Thyroxine 75mcg - Once daily",
          "Calcium + Vitamin D - Once daily",
          "Glucosamine - Twice daily",
        ],

        clinicalNotes:
          "Patient reports reduced joint pain with current regimen. Knee joints show mild inflammation. Advised physiotherapy exercises. Continue current medications. Vitamin D levels to be monitored.",
      },
    ],
  },
  {
    id: "P005",
    name: "Arjun Desai",
    age: 35,
    gender: "Male",
    phone: "+91 95432 10987",
    email: "arjun.desai@email.com",
    bloodType: "O-",
    lastVisit: "2024-01-17",
    nextAppointment: "2024-01-22",
    status: "waiting",
    condition: "Annual Health Checkup",
    avatar: "https://github.com/shoaibux1.png",
    isNew: false,
    address: "56, Bandra West, Mumbai, Maharashtra - 400050",
    emergencyContact: "+91 95432 10988 (Wife - Neha Desai)",
    medicalHistory: ["No chronic conditions"],
    allergies: ["None known"],
    currentMedications: ["Multivitamin - Once daily"],
    vitals: {
      bloodPressure: "128/82 mmHg",
      heartRate: "75 bpm",
      temperature: "98.6°F",
      weight: "78 kg",
      height: "175 cm",
    },
    labResults: [
      {
        test: "Complete Blood Count",
        value: "Normal",
        date: "2024-01-15",
        status: "normal",
      },
      {
        test: "Lipid Profile",
        value: "Total: 185 mg/dL",
        date: "2024-01-15",
        status: "normal",
      },
      {
        test: "Liver Function",
        value: "Normal",
        date: "2024-01-15",
        status: "normal",
      },
      {
        test: "Kidney Function",
        value: "Normal",
        date: "2024-01-15",
        status: "normal",
      },
    ],

    visitHistory: [
      {
        id: "V005-1",
        date: "Jan 10, 2023",
        time: "09:30 AM",
        title: "Annual Checkup 2023",
        description: "Comprehensive health screening",
        doctor: "Dr. Amit Patel",
        relativeTime: "1 year ago",
        prescription: ["Multivitamin - Once daily"],
        clinicalNotes:
          "Complete physical examination done. All parameters within normal range. Patient maintains active lifestyle. Advised to continue regular exercise and balanced diet. Annual checkup recommended.",
      },
    ],
  },
  {
    id: "P006",
    name: "Anjali Gupta",
    age: 42,
    gender: "Female",
    phone: "+91 94321 09876",
    email: "anjali.gupta@email.com",
    bloodType: "A-",
    lastVisit: "2024-01-20",
    status: "checked-in",
    condition: "Migraine Follow-up",
    avatar: "https://github.com/shoaibux1.png",
    isNew: false,
    address: "89, Sector 15, Noida, Uttar Pradesh - 201301",
    emergencyContact: "+91 94321 09877 (Husband - Rajiv Gupta)",
    medicalHistory: ["Chronic Migraine (diagnosed 2017)", "Anxiety (managed)"],
    allergies: ["Aspirin"],
    currentMedications: [
      "Propranolol 40mg - Twice daily",
      "Sumatriptan 50mg - As needed for acute attacks",
    ],

    vitals: {
      bloodPressure: "118/75 mmHg",
      heartRate: "68 bpm",
      temperature: "98.3°F",
      weight: "58 kg",
      height: "162 cm",
    },
    labResults: [
      {
        test: "Complete Blood Count",
        value: "Normal",
        date: "2024-01-10",
        status: "normal",
      },
      {
        test: "Thyroid Profile",
        value: "Normal",
        date: "2024-01-10",
        status: "normal",
      },
    ],

    visitHistory: [
      {
        id: "V006-1",
        date: "Nov 25, 2023",
        time: "04:00 PM",
        title: "Migraine Management",
        description:
          "Review of migraine frequency and medication effectiveness",
        doctor: "Dr. Priya Nair",
        relativeTime: "2 months ago",
        prescription: [
          "Propranolol 40mg - Twice daily",
          "Sumatriptan 50mg - As needed",
        ],

        clinicalNotes:
          "Patient reports 2-3 migraine episodes per month, down from 5-6. Current prophylactic medication effective. Advised to maintain headache diary, avoid triggers (stress, lack of sleep, certain foods). Continue current regimen.",
      },
    ],
  },
];

export const appointments: Appointment[] = [
  {
    id: "A001",
    patientId: "P001",
    patientName: "Rajesh Kumar Sharma",
    doctorId: "D001",
    doctorName: "Dr. Amit Patel",
    date: "2024-01-20",
    time: "09:00 AM",
    type: "follow-up",
    status: "in-progress",
    reason: "Hypertension & Diabetes Follow-up",
    avatar: "https://github.com/yusufhilmi.png",
  },
  {
    id: "A002",
    patientId: "P002",
    patientName: "Priya Menon",
    doctorId: "D004",
    doctorName: "Dr. Sneha Reddy",
    date: "2024-01-20",
    time: "09:30 AM",
    type: "checkup",
    status: "in-progress",
    reason: "Pregnancy - Second Trimester Checkup",
    avatar: "https://github.com/kdrnp.png",
  },
  {
    id: "A003",
    patientId: "P003",
    patientName: "Mohammed Farhan Khan",
    doctorId: "D001",
    doctorName: "Dr. Amit Patel",
    date: "2024-01-20",
    time: "10:00 AM",
    type: "consultation",
    status: "scheduled",
    reason: "Respiratory Infection",
    avatar: "https://github.com/denizbuyuktas.png",
  },
  {
    id: "A004",
    patientId: "P004",
    patientName: "Lakshmi Iyer",
    doctorId: "D003",
    doctorName: "Dr. Vikram Singh",
    date: "2024-01-19",
    time: "03:00 PM",
    type: "follow-up",
    status: "completed",
    reason: "Arthritis Management",
    avatar: "https://github.com/yahyabedirhan.png",
  },
  {
    id: "A005",
    patientId: "P005",
    patientName: "Arjun Desai",
    doctorId: "D001",
    doctorName: "Dr. Amit Patel",
    date: "2024-01-20",
    time: "10:30 AM",
    type: "checkup",
    status: "scheduled",
    reason: "Annual Health Checkup",
    avatar: "https://github.com/shoaibux1.png",
  },
  {
    id: "A006",
    patientId: "P006",
    patientName: "Anjali Gupta",
    doctorId: "D005",
    doctorName: "Dr. Priya Nair",
    date: "2024-01-20",
    time: "11:00 AM",
    type: "follow-up",
    status: "scheduled",
    reason: "Migraine Follow-up",
    avatar: "https://github.com/shoaibux1.png",
  },
  {
    id: "A007",
    patientId: "P001",
    patientName: "Rajesh Kumar Sharma",
    doctorId: "D001",
    doctorName: "Dr. Amit Patel",
    date: "2024-01-25",
    time: "10:00 AM",
    type: "follow-up",
    status: "scheduled",
    reason: "Lab Results Review",
    avatar: "https://github.com/yusufhilmi.png",
  },
  {
    id: "A008",
    patientId: "P004",
    patientName: "Lakshmi Iyer",
    doctorId: "D003",
    doctorName: "Dr. Vikram Singh",
    date: "2024-01-27",
    time: "02:00 PM",
    type: "follow-up",
    status: "scheduled",
    reason: "Physiotherapy Progress Review",
    avatar: "https://github.com/yahyabedirhan.png",
  },
  {
    id: "A009",
    patientId: "P005",
    patientName: "Arjun Desai",
    doctorId: "D001",
    doctorName: "Dr. Amit Patel",
    date: "2024-01-22",
    time: "09:30 AM",
    type: "consultation",
    status: "scheduled",
    reason: "Lab Results Discussion",
    avatar: "https://github.com/shoaibux1.png",
  },
];

export const doctors: Doctor[] = [
  {
    id: "D001",
    name: "Dr. Amit Patel",
    specialization: "General Physician & Diabetologist",
    email: "amit.patel@mediease.com",
    phone: "+91 98765 11111",
    patients: 245,
    experience: "15 years",
    avatar: "https://github.com/yusufhilmi.png",
    status: "busy",
  },
  {
    id: "D002",
    name: "Dr. Kavita Deshmukh",
    specialization: "Cardiologist",
    email: "kavita.deshmukh@mediease.com",
    phone: "+91 98765 22222",
    patients: 178,
    experience: "12 years",
    avatar: "https://github.com/kdrnp.png",
    status: "available",
  },
  {
    id: "D003",
    name: "Dr. Vikram Singh",
    specialization: "Orthopedic Surgeon",
    email: "vikram.singh@mediease.com",
    phone: "+91 98765 33333",
    patients: 156,
    experience: "18 years",
    avatar: "https://github.com/denizbuyuktas.png",
    status: "available",
  },
  {
    id: "D004",
    name: "Dr. Sneha Reddy",
    specialization: "Gynecologist & Obstetrician",
    email: "sneha.reddy@mediease.com",
    phone: "+91 98765 44444",
    patients: 198,
    experience: "14 years",
    avatar: "https://github.com/shoaibux1.png",
    status: "busy",
  },
  {
    id: "D005",
    name: "Dr. Priya Nair",
    specialization: "Neurologist",
    email: "priya.nair@mediease.com",
    phone: "+91 98765 55555",
    patients: 132,
    experience: "10 years",
    avatar: "https://github.com/yahyabedirhan.png",
    status: "available",
  },
  {
    id: "D006",
    name: "Dr. Rahul Mehta",
    specialization: "Pediatrician",
    email: "rahul.mehta@mediease.com",
    phone: "+91 98765 66666",
    patients: 210,
    experience: "16 years",
    avatar: "https://github.com/yusufhilmi.png",
    status: "available",
  },
];

export const staff: Staff[] = [
  {
    id: "S001",
    name: "Meera Krishnan",
    role: "receptionist",
    email: "meera.krishnan@mediease.com",
    phone: "+91 98765 77777",
    avatar: "https://github.com/yahyabedirhan.png",
    status: "active",
  },
  {
    id: "S002",
    name: "Suresh Kumar",
    role: "receptionist",
    email: "suresh.kumar@mediease.com",
    phone: "+91 98765 88888",
    avatar: "https://github.com/yusufhilmi.png",
    status: "active",
  },
  {
    id: "S003",
    name: "Ravi Shankar",
    role: "admin",
    email: "ravi.shankar@mediease.com",
    phone: "+91 98765 99999",
    avatar: "https://github.com/polymet-ai.png",
    status: "active",
  },
  {
    id: "S004",
    name: "Divya Sharma",
    role: "nurse",
    email: "divya.sharma@mediease.com",
    phone: "+91 98765 00000",
    avatar: "https://github.com/kdrnp.png",
    status: "active",
  },
];

export const patientReviews: Review[] = [
  { rating: "excellent", count: 145 },
  { rating: "great", count: 98 },
  { rating: "good", count: 67 },
  { rating: "average", count: 23 },
  { rating: "poor", count: 8 },
];

export const monthlyPatientData = [
  { month: "Jul", oldPatients: 185, newPatients: 58, total: 243 },
  { month: "Aug", oldPatients: 198, newPatients: 62, total: 260 },
  { month: "Sep", oldPatients: 210, newPatients: 71, total: 281 },
  { month: "Oct", oldPatients: 225, newPatients: 68, total: 293 },
  { month: "Nov", oldPatients: 238, newPatients: 75, total: 313 },
  { month: "Dec", oldPatients: 252, newPatients: 82, total: 334 },
  { month: "Jan", oldPatients: 268, newPatients: 89, total: 357 },
];

// Prescription templates for common conditions
export const prescriptionTemplates = {
  hypertension: [
    "Telmisartan 40mg - Once daily (morning)",
    "Amlodipine 5mg - Once daily",
    "Aspirin 75mg - Once daily (after dinner)",
  ],

  diabetes: [
    "Metformin 500mg - Twice daily (after meals)",
    "Glimepiride 2mg - Once daily (before breakfast)",
  ],

  respiratory: [
    "Azithromycin 500mg - Once daily for 5 days",
    "Levocetrizine 5mg - Once daily (at night)",
    "Salbutamol inhaler - As needed for breathing difficulty",
  ],

  arthritis: [
    "Paracetamol 650mg - Twice daily (after meals)",
    "Glucosamine 1500mg - Once daily",
    "Calcium + Vitamin D - Once daily",
  ],

  migraine: [
    "Propranolol 40mg - Twice daily",
    "Sumatriptan 50mg - As needed during attack",
    "Vitamin B12 supplement - Once daily",
  ],
};

// Common lab tests for Indian clinics
export const commonLabTests = [
  "Complete Blood Count (CBC)",
  "Fasting Blood Sugar (FBS)",
  "HbA1c (Glycated Hemoglobin)",
  "Lipid Profile",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Thyroid Profile (TSH, T3, T4)",
  "Vitamin D",
  "Vitamin B12",
  "Urine Routine",
  "ECG",
  "Chest X-Ray",
  "Ultrasound Abdomen",
];
