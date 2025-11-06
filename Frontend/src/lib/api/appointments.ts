import { get, post, put, patch, del } from "@/lib/api-client";

export type AppointmentStatus =
  | "scheduled"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface AppointmentSummary {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason?: string;
  type?: string;
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  date?: string;
  status?: AppointmentStatus;
}

export interface AppointmentListResponse {
  appointments: AppointmentSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AppointmentCreateInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  durationMinutes?: number;
  reason?: string;
  type?: string;
  notes?: string;
}

export interface AppointmentUpdateInput extends Partial<AppointmentCreateInput> {}

export async function fetchAppointments(
  params: AppointmentListParams = {}
): Promise<AppointmentListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.patientId) searchParams.set("patient_id", params.patientId);
  if (params.doctorId) searchParams.set("doctor_id", params.doctorId);
  if (params.date) searchParams.set("date", params.date);
  if (params.status) searchParams.set("status", params.status);

  const response = await get<AppointmentSummary[]>(
    `/api/appointments?${searchParams.toString()}`
  );

  return {
    appointments: response.data ?? [],
    total: response.pagination?.total ?? response.data?.length ?? 0,
    page: response.pagination?.page ?? params.page ?? 1,
    limit: response.pagination?.limit ?? params.limit ?? 10,
  };
}

export async function createAppointment(
  input: AppointmentCreateInput
): Promise<AppointmentSummary> {
  const response = await post<{ appointment: AppointmentSummary }>(
    "/api/appointments",
    input
  );
  if (!response.data?.appointment) {
    throw new Error(response.message ?? "Failed to create appointment");
  }
  return response.data.appointment;
}

export async function updateAppointment(
  appointmentId: string,
  input: AppointmentUpdateInput
): Promise<AppointmentSummary> {
  const response = await put<{ appointment: AppointmentSummary }>(
    `/api/appointments/${appointmentId}`,
    input
  );
  if (!response.data?.appointment) {
    throw new Error(response.message ?? "Failed to update appointment");
  }
  return response.data.appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancellationReason?: string
): Promise<AppointmentSummary> {
  const response = await patch<{ appointment: AppointmentSummary }>(
    `/api/appointments/${appointmentId}/status`,
    { status, cancellationReason }
  );
  if (!response.data?.appointment) {
    throw new Error(response.message ?? "Failed to update appointment status");
  }
  return response.data.appointment;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const response = await del(`/api/appointments/${appointmentId}`);
  if (!response.success) {
    throw new Error(response.message ?? "Failed to cancel appointment");
  }
}

