export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  age: string;
  bloodGroup: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation: string;
    weight: string;
    height: string;
    bmi: string;
  };
  medicalHistory: string;
  allergies: string;
  familyHistory: string;
  previousSurgeries: string;
  currentMedication: string;
  medicationDosage?: string;
  medicationFrequency?: string;
  lastMedicationReview?: string;
  lifestyle: {
    smoking: string;
    alcohol: string;
    exercise: string;
    diet: string;
    sleep: string;
    stress: string;
  };
  chiefComplaint?: string;
  currentSymptoms?: string;
  painLevel?: string;
  durationOfSymptoms?: string;
  carePlan?: string;
  treatmentGoals?: string;
  followUpSchedule?: string;
  doctorNotes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  recommendations?: string;
  userName?: string;
  portalPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSearchResult {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  gender: string;
  age: string;
  bloodGroup: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  familyHistory: string;
  previousSurgeries: string;
  currentMedication: string;
  lifestyle: {
    smoking: string;
    alcohol: string;
    exercise: string;
    diet: string;
    sleep: string;
    stress: string;
  };
}

export const createEmptyPatient = (): Patient => ({
  id: '',
  patientId: '',
  firstName: '',
  lastName: '',
  gender: 'Male',
  age: '',
  bloodGroup: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
  vitals: {
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: ''
  },
  medicalHistory: '',
  allergies: '',
  familyHistory: '',
  previousSurgeries: '',
  currentMedication: '',
  lifestyle: {
    smoking: '',
    alcohol: '',
    exercise: '',
    diet: '',
    sleep: '',
    stress: ''
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generatePatientId = (): string => {
  const prefix = 'P';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const validatePatientData = (patient: Partial<Patient>): string[] => {
  const errors: string[] = [];
  
  if (!patient.firstName?.trim()) errors.push('First name is required');
  if (!patient.lastName?.trim()) errors.push('Last name is required');
  if (!patient.gender) errors.push('Gender is required');
  if (!patient.age?.trim()) errors.push('Age is required');
  if (!patient.phone?.trim()) errors.push('Phone number is required');
  if (!patient.email?.trim()) errors.push('Email is required');
  
  // Email validation
  if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone validation (basic)
  if (patient.phone && !/^[\d\s\-\+\(\)]+$/.test(patient.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return errors;
};

export const formatPatientName = (patient: Patient): string => {
  return `${patient.firstName} ${patient.lastName}`;
};

export const getPatientAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
