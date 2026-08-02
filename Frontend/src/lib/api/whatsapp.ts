import { get, post, ApiResponse } from "../api-client";

export interface WhatsAppPatient {
  patient_id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_phone: string | null;
  consent_whatsapp: boolean;
  message_count?: number;
  last_message_at?: string;
}

export interface WhatsAppMessage {
  message_sid: string;
  direction: "inbound" | "outbound" | "unknown";
  body: string;
  link_url?: string | null;
  status: string;
  received_at: string;
  from: string;
  to: string;
  type: "manual" | "scheduler" | "inbound" | "prescription" | string;
  scenario?: string;
  appointment_id?: string;
}

export interface PatientMessageHistory {
  patient: WhatsAppPatient;
  messages: WhatsAppMessage[];
  total: number;
}

export interface SendMessageRequest {
  to: string;
  message: string;
  patient_id?: string;
  appointment_id?: string;
}

export interface SendMessageResponse {
  message_sid: string;
  status: string;
  to: string;
  from_number: string;
  timestamp: string;
}

/**
 * Search patients by name, email, or phone number
 */
export async function searchPatientsForWhatsApp(
  query: string,
  limit: number = 10
): Promise<ApiResponse<{ patients: WhatsAppPatient[] }>> {
  return get<{ patients: WhatsAppPatient[] }>(
    `/api/whatsapp/search-patients?query=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/**
 * Get WhatsApp message history for a patient
 */
export async function getPatientWhatsAppMessages(
  patientId: string,
  limit: number = 50
): Promise<ApiResponse<PatientMessageHistory>> {
  return get<PatientMessageHistory>(
    `/api/whatsapp/messages/${patientId}?limit=${limit}`
  );
}

/**
 * Send a WhatsApp message to a patient
 */
export async function sendWhatsAppMessage(
  data: SendMessageRequest
): Promise<ApiResponse<SendMessageResponse>> {
  return post<SendMessageResponse>("/api/whatsapp/send", data);
}

/**
 * Get WhatsApp service configuration
 */
export async function getWhatsAppConfig(): Promise<
  ApiResponse<{ configured: boolean; from_number: string | null }>
> {
  return get<{ configured: boolean; from_number: string | null }>(
    "/api/whatsapp/config"
  );
}

/**
 * Get all patients with existing WhatsApp conversations
 */
export async function getWhatsAppConversations(
  limit: number = 50
): Promise<ApiResponse<{ patients: WhatsAppPatient[] }>> {
  return get<{ patients: WhatsAppPatient[] }>(
    `/api/whatsapp/conversations?limit=${limit}`
  );
}

