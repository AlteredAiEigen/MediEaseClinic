import {
  get,
  post,
  put,
  del,
  ApiResponse,
} from "@/lib/api-client";

export interface PatientSummary {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  age: string;
  email: string;
  phone: string;
  presentInClinic: boolean;
  chiefComplaint?: string | null;
}

export interface MedicalHistoryRecord {
  title?: string;
  diagnosis?: string;
  treatedBy?: string;
  recordedOn?: string;
  notes?: string;
}

type MedicalHistoryValue = string | MedicalHistoryRecord[];

export interface PatientDetail extends PatientSummary {
  bloodGroup: string;
  dateOfBirth: string;
  address: string;
  // Vitals and detailed medical history are handled via dedicated
  // endpoints/collections rather than the core patient record.
  allergies?: string;
  lifestyle?: Record<string, unknown>;
  currentSymptoms?: string;
  painLevel?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medieaseClinicEmail?: string;
  currentMedications?: MedicationEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicationEntry {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  presentInClinic?: boolean;
}

export interface PatientCreateInput {
  firstName: string;
  lastName: string;
  gender: string;
  age: string;
  bloodGroup: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  allergies?: string;
  lifestyle?: Record<string, unknown>;
  currentMedications?: MedicationEntry[];
  chiefComplaint?: string;
  currentSymptoms?: string;
  painLevel?: string;
  condition?: string;
  carePlanSummary?: string;
  followUpPlan?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

export interface PatientUpdateInput extends Partial<PatientCreateInput> {
  presentInClinic?: boolean;
}

export interface PatientListResponse {
  patients: PatientSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PatientSearchResponse {
  patients: PatientSummary[];
}

export async function fetchPatients(params: PatientListParams = {}): Promise<PatientListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);
  if (params.gender) query.set("gender", params.gender);
  if (typeof params.presentInClinic === "boolean") {
    query.set("present_in_clinic", String(params.presentInClinic));
  }

  const response = await get<PatientSummary[]>(
    `/api/patients?${query.toString()}`
  );

  return {
    patients: response.data ?? [],
    total: response.pagination?.total ?? response.data?.length ?? 0,
    page: response.pagination?.page ?? params.page ?? 1,
    limit: response.pagination?.limit ?? params.limit ?? 10,
  };
}

export async function searchPatients(query: string): Promise<PatientSummary[]> {
  if (!query || query.length < 1) {
    return [];
  }

  const response = await get<PatientSearchResponse>(
    `/api/patients/search?q=${encodeURIComponent(query)}`
  );

  return response.data?.patients ?? [];
}

export async function fetchPatient(patientId: string): Promise<PatientDetail | null> {
  const response = await get<{ patient: PatientDetail }>(`/api/patients/${patientId}`);
  return response.data?.patient ?? null;
}

export async function fetchPatientByPatientId(patientId: string): Promise<PatientDetail | null> {
  const response = await get<{ patient: PatientDetail }>(
    `/api/patients/patient-id/${patientId}`
  );
  return response.data?.patient ?? null;
}

export async function createPatient(input: PatientCreateInput): Promise<PatientDetail> {
  const response = await post<{ patient: PatientDetail }>(`/api/patients`, input);
  if (!response.data?.patient) {
    throw new Error(response.message ?? "Failed to create patient");
  }
  return response.data.patient;
}

export async function updatePatient(
  patientId: string,
  input: PatientUpdateInput
): Promise<PatientDetail> {
  const response = await put<{ patient: PatientDetail }>(
    `/api/patients/${patientId}`,
    input
  );
  if (!response.data?.patient) {
    throw new Error(response.message ?? "Failed to update patient");
  }
  return response.data.patient;
}

export async function deletePatient(patientId: string): Promise<void> {
  const response = await del(`/api/patients/${patientId}`);
  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete patient");
  }
}


