import { apiClient } from "@/lib/api-client";
import type { MedicalHistoryRecord } from "@/lib/api/patients";

export interface PatientMedicalHistoryRecord {
  _id: string;
  patientId: string;
  medicalHistory?: string | MedicalHistoryRecord[];
  familyHistory?: { relation?: string; condition?: string; notes?: string }[] | string;
  previousSurgeries?: {
    surgery?: string;
    date?: string;
    hospital?: string;
    notes?: string;
  }[] | string;
  startDate: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientMedicalHistoryPayload {
  patientId: string;
  medicalHistory?: string | MedicalHistoryRecord[];
  familyHistory?: { relation?: string; condition?: string; notes?: string }[] | string;
  previousSurgeries?: {
    surgery?: string;
    date?: string;
    hospital?: string;
    notes?: string;
  }[] | string;
  startDate?: string;
}

export async function fetchCurrentMedicalHistory(patientId: string): Promise<PatientMedicalHistoryRecord | null> {
  const response = await apiClient.get<{
    success: boolean;
    data: { medicalHistory: PatientMedicalHistoryRecord | null };
  }>(`/api/patient-medical-history/current?patientId=${patientId}`);

  if (response.success && response.data?.medicalHistory) {
    return response.data.medicalHistory;
  }
  return null;
}

export async function fetchAllMedicalHistory(
  patientId: string,
  includeInactive: boolean = true
): Promise<PatientMedicalHistoryRecord[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: { history: PatientMedicalHistoryRecord[] };
  }>(`/api/patient-medical-history/history?patientId=${patientId}&includeInactive=${includeInactive}`);

  if (response.success && response.data?.history) {
    return response.data.history;
  }
  return [];
}

export async function createMedicalHistory(
  payload: PatientMedicalHistoryPayload
): Promise<PatientMedicalHistoryRecord> {
  const response = await apiClient.post<{
    success: boolean;
    data: PatientMedicalHistoryRecord;
  }>("/api/patient-medical-history/", payload);

  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || "Failed to create medical history");
}

export async function updateMedicalHistory(
  historyId: string,
  payload: Partial<PatientMedicalHistoryPayload>
): Promise<PatientMedicalHistoryRecord> {
  const response = await apiClient.put<{
    success: boolean;
    data: PatientMedicalHistoryRecord;
  }>(`/api/patient-medical-history/${historyId}`, payload);

  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || "Failed to update medical history");
}

export async function deleteMedicalHistory(historyId: string): Promise<void> {
  const response = await apiClient.delete(`/api/patient-medical-history/${historyId}`);
  if (!response.success) {
    throw new Error(response.message || "Failed to delete medical history");
  }
}

