import apiClient from './ApiClient';

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalAppointments: number;
  totalClinicalNotes: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  newPatientsThisMonth: number;
  activeDoctors: number;
  activeReceptionists: number;
}

export interface SystemStats {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  totalRequests: number;
  activeConnections: number;
  databaseConnections: number;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'receptionist';
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

class AdminApiService {
  async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
    return apiClient.get<DashboardStats>('/admin/dashboard');
  }

  async getSystemStats(): Promise<{ success: boolean; data: SystemStats }> {
    return apiClient.get<SystemStats>('/admin/stats');
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ success: boolean; data: { users: User[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/admin/users${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ users: User[]; pagination?: any }>(endpoint);
  }

  async createUser(userData: UserCreateRequest): Promise<{ success: boolean; data: { user: User } }> {
    return apiClient.post<{ user: User }>('/admin/users', userData);
  }

  async updateUser(id: string, userData: UserUpdateRequest): Promise<{ success: boolean; data: { user: User } }> {
    return apiClient.put<{ user: User }>(`/admin/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/admin/users/${id}`);
  }

  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ success: boolean; data: { patients: any[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/admin/patients${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ patients: any[]; pagination?: any }>(endpoint);
  }

  async getAppointments(params?: {
    page?: number;
    limit?: number;
    date?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { appointments: any[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/admin/appointments${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ appointments: any[]; pagination?: any }>(endpoint);
  }

  async getClinicalNotes(params?: {
    page?: number;
    limit?: number;
    doctorId?: string;
    type?: string;
  }): Promise<{ success: boolean; data: { notes: any[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/admin/clinical-notes${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ notes: any[]; pagination?: any }>(endpoint);
  }

  async getRecordings(params?: {
    page?: number;
    limit?: number;
    doctorId?: string;
    patientId?: string;
  }): Promise<{ success: boolean; data: { recordings: any[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/admin/recordings${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ recordings: any[]; pagination?: any }>(endpoint);
  }
}

export const adminApiService = new AdminApiService();
export default adminApiService;
