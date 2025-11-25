import { apiClient } from "@/lib/api-client";

export interface InsuranceCoverage {
  _id?: string;
  patientId: string;
  policyNumber: string;
  selectedBenefits: string[];
  version?: number;
  isLatest?: boolean;
  previousVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsuranceCoverageCreateInput {
  patientId: string;
  policyNumber: string;
  selectedBenefits: string[];
}

export interface InsuranceCoverageUpdateInput {
  selectedBenefits: string[];
}

export async function fetchInsuranceCoverage(
  patientId: string,
  policyNumber?: string
): Promise<InsuranceCoverage | InsuranceCoverage[]> {
  const url = policyNumber
    ? `/api/insurance-coverage?patientId=${encodeURIComponent(patientId)}&policyNumber=${encodeURIComponent(policyNumber)}`
    : `/api/insurance-coverage?patientId=${encodeURIComponent(patientId)}`;
  
  const response = await apiClient.get<{
    success: boolean;
    data: InsuranceCoverage | InsuranceCoverage[];
  }>(url);

  if (!response.success) {
    throw new Error("Failed to load insurance coverage");
  }

  return response.data;
}

export async function createInsuranceCoverage(
  data: InsuranceCoverageCreateInput
): Promise<InsuranceCoverage> {
  const response = await apiClient.post<{
    success: boolean;
    data: InsuranceCoverage;
  }>("/api/insurance-coverage", data);

  if (!response.success) {
    throw new Error("Failed to create insurance coverage");
  }

  return response.data;
}

export async function updateInsuranceCoverage(
  id: string,
  data: InsuranceCoverageUpdateInput
): Promise<InsuranceCoverage> {
  const response = await apiClient.put<{
    success: boolean;
    data: InsuranceCoverage;
  }>(`/api/insurance-coverage/${id}`, data);

  if (!response.success) {
    throw new Error("Failed to update insurance coverage");
  }

  return response.data;
}

export async function deleteInsuranceCoverage(id: string): Promise<void> {
  const response = await apiClient.delete<{
    success: boolean;
    data: { id: string };
  }>(`/api/insurance-coverage/${id}`);

  if (!response.success) {
    throw new Error("Failed to delete insurance coverage");
  }
}

