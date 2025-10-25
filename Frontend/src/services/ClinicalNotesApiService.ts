import apiClient from './ApiClient';

export interface ClinicalNote {
  _id: string;
  noteId: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  type: 'symptom' | 'diagnosis' | 'treatment' | 'prescription' | 'followup' | 'progress' | 'other';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'approved' | 'reviewed';
  actionable: boolean;
  completed: boolean;
  completedAt?: string;
  tags: string[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteCreateRequest {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  type: ClinicalNote['type'];
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  actionable?: boolean;
  tags?: string[];
}

export interface ClinicalNoteUpdateRequest {
  type?: ClinicalNote['type'];
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'draft' | 'approved' | 'reviewed';
  actionable?: boolean;
  tags?: string[];
}

export interface ClinicalNoteGenerateRequest {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  consultationDuration: number;
}

export interface ClinicalNoteStats {
  totalNotes: number;
  actionableNotes: number;
  completedNotes: number;
  notesByType: { [key: string]: number };
  notesByPriority: { [key: string]: number };
}

class ClinicalNotesApiService {
  async getClinicalNotes(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    appointmentId?: string;
    doctorId?: string;
    type?: string;
    status?: string;
    actionable?: boolean;
    completed?: boolean;
  }): Promise<{ success: boolean; data: { notes: ClinicalNote[]; pagination?: any } }> {
    const queryParams = params ? new URLSearchParams(params as any) : '';
    const endpoint = `/clinical-notes${queryParams ? `?${queryParams}` : ''}`;
    return apiClient.get<{ notes: ClinicalNote[]; pagination?: any }>(endpoint);
  }

  async getClinicalNote(id: string): Promise<{ success: boolean; data: { note: ClinicalNote } }> {
    return apiClient.get<{ note: ClinicalNote }>(`/clinical-notes/${id}`);
  }

  async getNotesByPatient(patientId: string): Promise<{ success: boolean; data: { notes: ClinicalNote[] } }> {
    return apiClient.get<{ notes: ClinicalNote[] }>(`/clinical-notes?patientId=${patientId}`);
  }

  async getNotesByAppointment(appointmentId: string): Promise<{ success: boolean; data: { notes: ClinicalNote[] } }> {
    return apiClient.get<{ notes: ClinicalNote[] }>(`/clinical-notes?appointmentId=${appointmentId}`);
  }

  async getNotesByDoctor(doctorId: string): Promise<{ success: boolean; data: { notes: ClinicalNote[] } }> {
    return apiClient.get<{ notes: ClinicalNote[] }>(`/clinical-notes?doctorId=${doctorId}`);
  }

  async getActionableNotes(patientId?: string): Promise<{ success: boolean; data: { notes: ClinicalNote[] } }> {
    const query = patientId ? `?patientId=${patientId}` : '';
    return apiClient.get<{ notes: ClinicalNote[] }>(`/clinical-notes/actionable${query}`);
  }

  async createClinicalNote(noteData: ClinicalNoteCreateRequest): Promise<{ success: boolean; data: { note: ClinicalNote } }> {
    return apiClient.post<{ note: ClinicalNote }>('/clinical-notes', noteData);
  }

  async updateClinicalNote(id: string, noteData: ClinicalNoteUpdateRequest): Promise<{ success: boolean; data: { note: ClinicalNote } }> {
    return apiClient.put<{ note: ClinicalNote }>(`/clinical-notes/${id}`, noteData);
  }

  async markNoteComplete(id: string): Promise<{ success: boolean; data: { note: ClinicalNote } }> {
    return apiClient.put<{ note: ClinicalNote }>(`/clinical-notes/${id}/complete`, {});
  }

  async deleteClinicalNote(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/clinical-notes/${id}`);
  }

  async generateNotesFromConsultation(request: ClinicalNoteGenerateRequest): Promise<{ success: boolean; data: { notes: ClinicalNote[] } }> {
    return apiClient.post<{ notes: ClinicalNote[] }>('/clinical-notes/generate', request);
  }

  async getNotesStatistics(): Promise<{ success: boolean; data: ClinicalNoteStats }> {
    // This endpoint might not exist in the backend yet, so we'll calculate it client-side
    const response = await this.getClinicalNotes();
    if (!response.success) {
      throw new Error('Failed to get notes statistics');
    }

    const notes = response.data.notes;
    const stats: ClinicalNoteStats = {
      totalNotes: notes.length,
      actionableNotes: notes.filter(note => note.actionable).length,
      completedNotes: notes.filter(note => note.completed).length,
      notesByType: notes.reduce((acc, note) => {
        acc[note.type] = (acc[note.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      notesByPriority: notes.reduce((acc, note) => {
        acc[note.priority] = (acc[note.priority] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
    };

    return { success: true, data: stats };
  }
}

export const clinicalNotesApiService = new ClinicalNotesApiService();
export default clinicalNotesApiService;
