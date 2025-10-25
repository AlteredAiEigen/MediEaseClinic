import apiClient from './ApiClient';
import { UserRole } from '../context/AppContext';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
}

export interface AdminRegisterRequest {
  clinicName: string;
  adminEmail: string;
  adminPassword: string;
  doctorRange?: '1-10' | '10-20' | '20+';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface AdminRegisterResponse {
  success: boolean;
  message: string;
  data: {
    clinic: {
      id: string;
      clinicName: string;
      adminEmail: string;
      doctorRange: string;
      createdAt: string;
    };
    admin: User;
    token: string;
  };
}

class AuthService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    apiClient.setToken(token);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async registerAdmin(clinicData: AdminRegisterRequest): Promise<AdminRegisterResponse> {
    const response = await apiClient.post<AdminRegisterResponse>('/auth/register/admin', clinicData);

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
    return apiClient.get<{ user: User }>('/auth/me');
  }

  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; data: { user: User } }> {
    return apiClient.put<{ user: User }>('/auth/profile', userData);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.put('/auth/change-password', passwordData);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/logout');
    this.setToken(null);
    return response;
  }
}

export const authService = new AuthService();
export default authService;
