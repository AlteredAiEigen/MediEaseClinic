interface LabTest {
  name: string;
  result: string;
  unit: string;
  normalRange: string;
  status: "normal" | "high" | "low" | "critical";
  flag?: string;
}

export interface LabReportData {
  reportId: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  reportType: string;
  category: string;
  orderedBy: string;
  collectedDate: string;
  reportedDate: string;
  labName: string;
  tests: LabTest[];
  clinicalNotes?: string;
  interpretation?: string;
  previousResults?: LabTest[];
  previousDate?: string;
}

export const labReportsData: Record<string, LabReportData[]> = {
  // Rajesh Kumar Sharma - P001
  P001: [
    {
      reportId: "LAB-2024-001234",
      patientName: "Rajesh Kumar Sharma",
      patientId: "P001",
      age: 58,
      gender: "Male",
      reportType: "Complete Blood Count (CBC) with Differential",
      category: "Hematology",
      orderedBy: "Dr. Amit Patel",
      collectedDate: "January 15, 2024 08:30 AM",
      reportedDate: "January 15, 2024 02:45 PM",
      labName: "Apollo Diagnostics, Bangalore",
      tests: [
        {
          name: "Hemoglobin",
          result: "13.2",
          unit: "g/dL",
          normalRange: "13.5-17.5",
          status: "low",
          flag: "Slightly Low",
        },
        {
          name: "White Blood Cell Count",
          result: "7.8",
          unit: "10³/µL",
          normalRange: "4.5-11.0",
          status: "normal",
        },
        {
          name: "Red Blood Cell Count",
          result: "4.9",
          unit: "10⁶/µL",
          normalRange: "4.5-5.9",
          status: "normal",
        },
        {
          name: "Platelet Count",
          result: "245",
          unit: "10³/µL",
          normalRange: "150-400",
          status: "normal",
        },
        {
          name: "Hematocrit",
          result: "41.5",
          unit: "%",
          normalRange: "40-52",
          status: "normal",
        },
      ],

      previousResults: [
        {
          name: "Hemoglobin",
          result: "12.8",
          unit: "g/dL",
          normalRange: "13.5-17.5",
          status: "low",
        },
        {
          name: "White Blood Cell Count",
          result: "7.5",
          unit: "10³/µL",
          normalRange: "4.5-11.0",
          status: "normal",
        },
        {
          name: "Red Blood Cell Count",
          result: "4.7",
          unit: "10⁶/µL",
          normalRange: "4.5-5.9",
          status: "normal",
        },
        {
          name: "Platelet Count",
          result: "238",
          unit: "10³/µL",
          normalRange: "150-400",
          status: "normal",
        },
        {
          name: "Hematocrit",
          result: "40.2",
          unit: "%",
          normalRange: "40-52",
          status: "normal",
        },
      ],

      previousDate: "December 10, 2023 09:00 AM",
      clinicalNotes:
        "Patient shows slightly low hemoglobin levels. This may indicate mild anemia. Recommend iron supplementation and dietary modifications. Follow-up CBC recommended in 4-6 weeks to monitor improvement.",
      interpretation:
        "Overall blood count is within acceptable range with mild anemia noted. No immediate concerns. Patient advised to increase iron-rich foods in diet and consider iron supplements as prescribed.",
    },
    {
      reportId: "LAB-2024-001235",
      patientName: "Rajesh Kumar Sharma",
      patientId: "P001",
      age: 58,
      gender: "Male",
      reportType: "HbA1c (Glycated Hemoglobin)",
      category: "Diabetes Management",
      orderedBy: "Dr. Amit Patel",
      collectedDate: "January 15, 2024 08:30 AM",
      reportedDate: "January 15, 2024 04:15 PM",
      labName: "Apollo Diagnostics, Bangalore",
      tests: [
        {
          name: "HbA1c",
          result: "7.2",
          unit: "%",
          normalRange: "< 5.7",
          status: "high",
          flag: "Elevated - Diabetes",
        },
        {
          name: "Average Blood Glucose",
          result: "160",
          unit: "mg/dL",
          normalRange: "< 100",
          status: "high",
        },
      ],

      previousResults: [
        {
          name: "HbA1c",
          result: "7.8",
          unit: "%",
          normalRange: "< 5.7",
          status: "high",
          flag: "Elevated - Diabetes",
        },
        {
          name: "Average Blood Glucose",
          result: "175",
          unit: "mg/dL",
          normalRange: "< 100",
          status: "high",
        },
      ],

      previousDate: "October 20, 2023 10:15 AM",
      clinicalNotes:
        "HbA1c level indicates suboptimal diabetes control. Patient needs medication adjustment and stricter dietary compliance. Recommend consultation with dietitian and increase in physical activity.",
      interpretation:
        "Diabetes management needs improvement. Current HbA1c of 7.2% is above target of <7.0%. Medication dosage may need adjustment. Patient counseled on importance of diet and exercise.",
    },
  ],

  // Priya Menon - P002
  P002: [
    {
      reportId: "LAB-2024-001236",
      patientName: "Priya Menon",
      patientId: "P002",
      age: 28,
      gender: "Female",
      reportType: "Prenatal Panel - First Trimester",
      category: "Obstetrics",
      orderedBy: "Dr. Kavita Deshmukh",
      collectedDate: "January 12, 2024 09:00 AM",
      reportedDate: "January 12, 2024 05:30 PM",
      labName: "Thyrocare Labs, Chennai",
      tests: [
        {
          name: "Hemoglobin",
          result: "11.8",
          unit: "g/dL",
          normalRange: "12.0-16.0",
          status: "low",
          flag: "Mild Anemia",
        },
        {
          name: "Blood Group",
          result: "O Positive",
          unit: "",
          normalRange: "N/A",
          status: "normal",
        },
        {
          name: "TSH (Thyroid Stimulating Hormone)",
          result: "2.1",
          unit: "mIU/L",
          normalRange: "0.4-4.0",
          status: "normal",
        },
        {
          name: "Blood Glucose (Fasting)",
          result: "88",
          unit: "mg/dL",
          normalRange: "70-100",
          status: "normal",
        },
      ],

      clinicalNotes:
        "Mild anemia noted, common in pregnancy. Iron and folic acid supplementation recommended. All other parameters within normal range. Continue prenatal vitamins as prescribed.",
      interpretation:
        "Overall prenatal panel shows good health with mild anemia requiring iron supplementation. Patient advised to maintain balanced diet rich in iron and continue prenatal care.",
    },
  ],

  // Mohammed Farhan Khan - P003
  P003: [
    {
      reportId: "LAB-2024-001237",
      patientName: "Mohammed Farhan Khan",
      patientId: "P003",
      age: 35,
      gender: "Male",
      reportType: "Chest X-Ray Report",
      category: "Radiology",
      orderedBy: "Dr. Vikram Singh",
      collectedDate: "January 18, 2024 10:15 AM",
      reportedDate: "January 18, 2024 02:00 PM",
      labName: "Max Imaging Center, Mumbai",
      tests: [
        {
          name: "Chest X-Ray PA View",
          result: "Mild bronchial wall thickening noted",
          unit: "",
          normalRange: "Clear lung fields",
          status: "low",
          flag: "Abnormal Finding",
        },
      ],

      clinicalNotes:
        "Chest X-ray shows mild bronchial wall thickening consistent with acute bronchitis. No evidence of pneumonia or pleural effusion. Heart size normal. Recommend antibiotic therapy and follow-up if symptoms persist.",
      interpretation:
        "Findings consistent with respiratory infection (acute bronchitis). No serious complications noted. Patient advised to complete antibiotic course and return if symptoms worsen.",
    },
  ],

  // Lakshmi Iyer - P004
  P004: [
    {
      reportId: "LAB-2024-001238",
      patientName: "Lakshmi Iyer",
      patientId: "P004",
      age: 62,
      gender: "Female",
      reportType: "Rheumatoid Factor & Anti-CCP",
      category: "Rheumatology",
      orderedBy: "Dr. Sneha Reddy",
      collectedDate: "January 10, 2024 08:45 AM",
      reportedDate: "January 10, 2024 06:00 PM",
      labName: "SRL Diagnostics, Hyderabad",
      tests: [
        {
          name: "Rheumatoid Factor (RF)",
          result: "42",
          unit: "IU/mL",
          normalRange: "< 20",
          status: "high",
          flag: "Positive",
        },
        {
          name: "Anti-CCP Antibodies",
          result: "68",
          unit: "U/mL",
          normalRange: "< 20",
          status: "high",
          flag: "Positive",
        },
        {
          name: "ESR (Erythrocyte Sedimentation Rate)",
          result: "35",
          unit: "mm/hr",
          normalRange: "0-20",
          status: "high",
          flag: "Elevated",
        },
        {
          name: "C-Reactive Protein (CRP)",
          result: "12",
          unit: "mg/L",
          normalRange: "< 5",
          status: "high",
          flag: "Elevated",
        },
      ],

      clinicalNotes:
        "Positive RF and Anti-CCP antibodies confirm rheumatoid arthritis diagnosis. Elevated inflammatory markers (ESR and CRP) indicate active disease. Recommend starting DMARD therapy and regular monitoring.",
      interpretation:
        "Laboratory findings confirm active rheumatoid arthritis. Patient requires disease-modifying antirheumatic drugs (DMARDs) and close follow-up to prevent joint damage.",
    },
  ],

  // Arjun Desai - P005
  P005: [
    {
      reportId: "LAB-2024-001239",
      patientName: "Arjun Desai",
      patientId: "P005",
      age: 45,
      gender: "Male",
      reportType: "Comprehensive Metabolic Panel",
      category: "General Health",
      orderedBy: "Dr. Priya Nair",
      collectedDate: "January 14, 2024 07:30 AM",
      reportedDate: "January 14, 2024 01:00 PM",
      labName: "Metropolis Healthcare, Pune",
      tests: [
        {
          name: "Glucose (Fasting)",
          result: "95",
          unit: "mg/dL",
          normalRange: "70-100",
          status: "normal",
        },
        {
          name: "Creatinine",
          result: "1.0",
          unit: "mg/dL",
          normalRange: "0.7-1.3",
          status: "normal",
        },
        {
          name: "Blood Urea Nitrogen (BUN)",
          result: "18",
          unit: "mg/dL",
          normalRange: "7-20",
          status: "normal",
        },
        {
          name: "Total Cholesterol",
          result: "195",
          unit: "mg/dL",
          normalRange: "< 200",
          status: "normal",
        },
        {
          name: "HDL Cholesterol",
          result: "52",
          unit: "mg/dL",
          normalRange: "> 40",
          status: "normal",
        },
        {
          name: "LDL Cholesterol",
          result: "118",
          unit: "mg/dL",
          normalRange: "< 130",
          status: "normal",
        },
        {
          name: "Triglycerides",
          result: "125",
          unit: "mg/dL",
          normalRange: "< 150",
          status: "normal",
        },
      ],

      clinicalNotes:
        "All metabolic parameters within normal range. Excellent overall health status. Continue current lifestyle and dietary habits. Annual checkup recommended.",
      interpretation:
        "Comprehensive metabolic panel shows excellent health. All values within optimal range. Patient advised to maintain current healthy lifestyle.",
    },
  ],

  // Anjali Gupta - P006
  P006: [
    {
      reportId: "LAB-2024-001240",
      patientName: "Anjali Gupta",
      patientId: "P006",
      age: 32,
      gender: "Female",
      reportType: "Thyroid Function Test",
      category: "Endocrinology",
      orderedBy: "Dr. Rahul Mehta",
      collectedDate: "January 16, 2024 08:00 AM",
      reportedDate: "January 16, 2024 03:30 PM",
      labName: "Dr. Lal PathLabs, Delhi",
      tests: [
        {
          name: "TSH (Thyroid Stimulating Hormone)",
          result: "2.5",
          unit: "mIU/L",
          normalRange: "0.4-4.0",
          status: "normal",
        },
        {
          name: "Free T4 (Thyroxine)",
          result: "1.2",
          unit: "ng/dL",
          normalRange: "0.8-1.8",
          status: "normal",
        },
        {
          name: "Free T3 (Triiodothyronine)",
          result: "3.1",
          unit: "pg/mL",
          normalRange: "2.3-4.2",
          status: "normal",
        },
      ],

      clinicalNotes:
        "Thyroid function tests are within normal range. No evidence of hypothyroidism or hyperthyroidism. Symptoms may be related to stress or other factors. Consider lifestyle modifications and stress management.",
      interpretation:
        "Normal thyroid function. Patient's symptoms are not related to thyroid dysfunction. Recommend stress management and follow-up if symptoms persist.",
    },
  ],
};

// Helper function to get lab reports for a specific patient
export function getLabReportsForPatient(patientId: string): LabReportData[] {
  return labReportsData[patientId] || [];
}

// Helper function to get a specific lab report
export function getLabReportById(
  patientId: string,
  reportId: string
): LabReportData | null {
  const reports = labReportsData[patientId] || [];
  return reports.find((report) => report.reportId === reportId) || null;
}
