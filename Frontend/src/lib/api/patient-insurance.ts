import { apiClient } from "@/lib/api-client";

export interface PatientInsuranceRecord {
  _id: string;
  patientId: string;
  provider: string;
  planName?: string;
  policyNumber?: string;
  cardNumber?: string;
  memberName?: string;
  status?: string;
  coverageLimit?: string;
  coverageUsed?: string;
  coverageRemaining?: string;
  validFrom?: string;
  validUntil?: string;
  familyMembersCovered?: number | string;
  notes?: string;
  isPrimary?: boolean;
  selectedBenefits?: string[];
  version?: number;
  isLatest?: boolean;
  previousVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientInsurancePayload {
  patientId?: string;
  provider?: string;
  planName?: string;
  policyNumber?: string;
  cardNumber?: string;
  memberName?: string;
  status?: string;
  coverageLimit?: string;
  coverageUsed?: string;
  coverageRemaining?: string;
  validFrom?: string;
  validUntil?: string;
  familyMembersCovered?: number | string;
  notes?: string;
  isPrimary?: boolean;
  selectedBenefits?: string[];
}

export async function fetchPatientInsurances(patientId: string) {
  const response = await apiClient.get<{
    success: boolean;
    data: { insurances: PatientInsuranceRecord[] };
  }>(`/api/patient-insurances?patientId=${encodeURIComponent(patientId)}`);

  if (!response.success) {
    throw new Error("Failed to load insurance records");
  }

  return response.data.insurances;
}

export async function createPatientInsurance(payload: PatientInsurancePayload & { patientId: string }) {
  const response = await apiClient.post<{
    success: boolean;
    data: PatientInsuranceRecord;
  }>("/api/patient-insurances", payload);

  if (!response.success) {
    throw new Error("Failed to create insurance record");
  }

  return response.data;
}

export async function updatePatientInsurance(insuranceId: string, payload: PatientInsurancePayload) {
  const response = await apiClient.put<{
    success: boolean;
    data: PatientInsuranceRecord;
  }>(`/api/patient-insurances/${insuranceId}`, payload);

  if (!response.success) {
    throw new Error("Failed to update insurance record");
  }

  return response.data;
}

export async function deletePatientInsurance(insuranceId: string) {
  const response = await apiClient.delete<{
    success: boolean;
    data: { insuranceId: string };
  }>(`/api/patient-insurances/${insuranceId}`);

  if (!response.success) {
    throw new Error("Failed to delete insurance record");
  }

  return response.data;
}


