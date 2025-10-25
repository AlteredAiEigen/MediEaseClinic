import apiClient from './ApiClient';

export interface Patient {
  _id: string;
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
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateRequest {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  age: string;
  bloodGroup: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  medicalHistory?: string;
  allergies?: string;
  familyHistory?: string;
  previousSurgeries?: string;
  currentMedication?: string;
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
    sleep?: string;
    stress?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
}

export interface PatientUpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  familyHistory?: string;
  previousSurgeries?: string;
  currentMedication?: string;
  medicationDosage?: string;
  medicationFrequency?: string;
  lastMedicationReview?: string;
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
    sleep?: string;
    stress?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  insurance?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
  };
}

export interface PatientSearchResult {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

export interface PatientStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  patientsByGender: { [key: string]: number };
  patientsByAgeGroup: { [key: string]: number };
}

class PatientApiService {
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data: { patients: Patient[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/patients${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ patients: Patient[]; pagination?: any }>(endpoint);
  }

  async getPatient(id: string): Promise<{ success: boolean; data: { patient: Patient } }> {
    return apiClient.get<{ patient: Patient }>(`/patients/${id}`);
  }

  async getPatientByPatientId(patientId: string): Promise<{ success: boolean; data: { patient: Patient } }> {
    return apiClient.get<{ patient: Patient }>(`/patients/patient-id/${patientId}`);
  }

  async searchPatients(query: string): Promise<{ success: boolean; data: { results: PatientSearchResult[] } }> {
    return apiClient.get<{ results: PatientSearchResult[] }>(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  async createPatient(patientData: PatientCreateRequest): Promise<{ success: boolean; data: { patient: Patient } }> {
    return apiClient.post<{ patient: Patient }>('/patients', patientData);
  }

  async updatePatient(id: string, patientData: PatientUpdateRequest): Promise<{ success: boolean; data: { patient: Patient } }> {
    return apiClient.put<{ patient: Patient }>(`/patients/${id}`, patientData);
  }

  async deletePatient(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/patients/${id}`);
  }

  async getPatientStats(): Promise<{ success: boolean; data: PatientStats }> {
    return apiClient.get<PatientStats>('/patients/stats');
  }
}

export const patientApiService = new PatientApiService();
export default patientApiService;
