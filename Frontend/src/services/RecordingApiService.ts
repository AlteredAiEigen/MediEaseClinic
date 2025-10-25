import apiClient from './ApiClient';

export interface Recording {
  _id: string;
  recordingId: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  transcription?: string;
  summary?: string;
  status: 'processing' | 'completed' | 'failed';
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingCreateRequest {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
}

export interface RecordingUpdateRequest {
  transcription?: string;
  summary?: string;
  status?: 'processing' | 'completed' | 'failed';
  tags?: string[];
  notes?: string;
}

class RecordingApiService {
  async getRecordings(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    appointmentId?: string;
    doctorId?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { recordings: Recording[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/recordings${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ recordings: Recording[]; pagination?: any }>(endpoint);
  }

  async getRecording(id: string): Promise<{ success: boolean; data: { recording: Recording } }> {
    return apiClient.get<{ recording: Recording }>(`/recordings/${id}`);
  }

  async createRecording(recordingData: RecordingCreateRequest): Promise<{ success: boolean; data: { recording: Recording } }> {
    return apiClient.post<{ recording: Recording }>('/recordings', recordingData);
  }

  async updateRecording(id: string, recordingData: RecordingUpdateRequest): Promise<{ success: boolean; data: { recording: Recording } }> {
    return apiClient.put<{ recording: Recording }>(`/recordings/${id}`, recordingData);
  }

  async deleteRecording(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/recordings/${id}`);
  }

  async uploadRecording(formData: FormData): Promise<{ success: boolean; data: { recording: Recording } }> {
    // Note: This would require a different approach since we're sending FormData
    // The apiClient would need to be updated to handle multipart/form-data
    throw new Error('File upload not implemented yet');
  }

  async getRecordingFile(id: string): Promise<Blob> {
    // This would need special handling for binary data
    throw new Error('File download not implemented yet');
  }
}

export const recordingApiService = new RecordingApiService();
export default recordingApiService;
