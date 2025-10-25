import apiClient from './ApiClient';

export interface Appointment {
  _id: string;
  appointmentId: string;
  patient: string;
  doctor: string;
  scheduledBy: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  priority: 'low' | 'medium' | 'high';
  reason: string;
  notes?: string;
  presentInClinic?: boolean;
  insurance?: boolean;
  patientName?: string;
  doctorName?: string;
  scheduledByName?: string;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentCreateRequest {
  patient: string;
  doctor: string;
  date: string;
  time: string;
  duration?: number;
  reason: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface AppointmentUpdateRequest {
  doctor?: string;
  date?: string;
  time?: string;
  duration?: number;
  reason?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  status?: Appointment['status'];
}

export interface AppointmentStats {
  totalAppointments: number;
  todayAppointments: number;
  completedToday: number;
  cancelledToday: number;
  appointmentsByStatus: { [key: string]: number };
  appointmentsByDoctor: { [key: string]: number };
}

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  timeSlots: Array<{
    time: string;
    available: boolean;
  }>;
}

class AppointmentApiService {
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    patient?: string;
    doctor?: string;
    date?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: { appointments: Appointment[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/appointments${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ appointments: Appointment[]; pagination?: any }>(endpoint);
  }

  async getAppointment(id: string): Promise<{ success: boolean; data: { appointment: Appointment } }> {
    return apiClient.get<{ appointment: Appointment }>(`/appointments/${id}`);
  }

  async createAppointment(appointmentData: AppointmentCreateRequest): Promise<{ success: boolean; data: { appointment: Appointment } }> {
    return apiClient.post<{ appointment: Appointment }>('/appointments', appointmentData);
  }

  async updateAppointment(id: string, appointmentData: AppointmentUpdateRequest): Promise<{ success: boolean; data: { appointment: Appointment } }> {
    return apiClient.put<{ appointment: Appointment }>(`/appointments/${id}`, appointmentData);
  }

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<{ success: boolean; data: { appointment: Appointment } }> {
    return apiClient.put<{ appointment: Appointment }>(`/appointments/${id}/status`, { status });
  }

  async deleteAppointment(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/appointments/${id}`);
  }

  async getAppointmentStats(): Promise<{ success: boolean; data: AppointmentStats }> {
    return apiClient.get<AppointmentStats>('/appointments/stats');
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<{ success: boolean; data: DoctorAvailability }> {
    return apiClient.get<DoctorAvailability>(`/appointments/availability/${doctorId}?date=${date}`);
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<{ success: boolean; data: { appointments: Appointment[] } }> {
    return apiClient.get<{ appointments: Appointment[] }>(`/appointments/date-range?startDate=${startDate}&endDate=${endDate}`);
  }
}

export const appointmentApiService = new AppointmentApiService();
export default appointmentApiService;
