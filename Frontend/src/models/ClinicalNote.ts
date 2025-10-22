export type ClinicalNoteType = 'vitals' | 'symptom' | 'diagnosis' | 'treatment' | 'followup' | 'prescription' | 'general';
export type NotePriority = 'low' | 'medium' | 'high';
export type NoteStatus = 'draft' | 'reviewed' | 'approved' | 'archived';

export interface ClinicalNote {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  type: ClinicalNoteType;
  title: string;
  content: string;
  priority: NotePriority;
  status: NoteStatus;
  timestamp: string;
  actionable: boolean;
  completed?: boolean;
  completedAt?: string;
  tags: string[];
  attachments?: string[]; // File paths or URLs
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
  isActive: boolean;
  prescribedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationSummary {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  duration: number; // in minutes
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string[];
  treatmentPlan: string;
  prescriptions: Prescription[];
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  notes: ClinicalNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNoteFormData {
  type: ClinicalNoteType;
  title: string;
  content: string;
  priority: NotePriority;
  actionable: boolean;
  tags: string[];
}

export const createEmptyClinicalNote = (): ClinicalNote => ({
  id: '',
  patientId: '',
  appointmentId: '',
  doctorId: '',
  type: 'general',
  title: '',
  content: '',
  priority: 'medium',
  status: 'draft',
  timestamp: new Date().toTimeString().slice(0, 5),
  actionable: false,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateClinicalNoteId = (): string => {
  const prefix = 'NOTE';
  const timestamp = Date.now().toString().slice(-8);
  return `${prefix}${timestamp}`;
};

export const generatePrescriptionId = (): string => {
  const prefix = 'RX';
  const timestamp = Date.now().toString().slice(-8);
  return `${prefix}${timestamp}`;
};

export const validateClinicalNoteData = (note: Partial<ClinicalNote>): string[] => {
  const errors: string[] = [];
  
  if (!note.title?.trim()) errors.push('Title is required');
  if (!note.content?.trim()) errors.push('Content is required');
  if (!note.patientId?.trim()) errors.push('Patient is required');
  if (!note.doctorId?.trim()) errors.push('Doctor is required');
  
  return errors;
};

export const getNoteTypeConfig = (type: ClinicalNoteType) => {
  switch (type) {
    case 'vitals':
      return {
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: 'pulse',
        label: 'Vitals',
      };
    case 'symptom':
      return {
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: 'warning',
        label: 'Symptoms',
      };
    case 'diagnosis':
      return {
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: 'stethoscope',
        label: 'Diagnosis',
      };
    case 'treatment':
      return {
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: 'check',
        label: 'Treatment',
      };
    case 'followup':
      return {
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: 'calendar',
        label: 'Follow-up',
      };
    case 'prescription':
      return {
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: 'package',
        label: 'Prescription',
      };
    case 'general':
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: 'file-text',
        label: 'General',
      };
    default:
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: 'file-text',
        label: 'Note',
      };
  }
};

export const getPriorityConfig = (priority: NotePriority) => {
  switch (priority) {
    case 'high':
      return {
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'High Priority',
      };
    case 'medium':
      return {
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Medium Priority',
      };
    case 'low':
      return {
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        label: 'Standard',
      };
    default:
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        label: 'Standard',
      };
  }
};

export const getStatusConfig = (status: NoteStatus) => {
  switch (status) {
    case 'draft':
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        label: 'Draft',
      };
    case 'reviewed':
      return {
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        label: 'Reviewed',
      };
    case 'approved':
      return {
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        label: 'Approved',
      };
    case 'archived':
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        label: 'Archived',
      };
    default:
      return {
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        label: 'Unknown',
      };
  }
};

export const formatNoteTimestamp = (timestamp: string): string => {
  return timestamp; // Already in HH:MM format
};

export const generateMockClinicalNotes = (patientId: string, appointmentId: string, doctorId: string): ClinicalNote[] => {
  const now = new Date();
  const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);
  
  return [
    {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      type: 'vitals',
      title: 'Vital Signs Recorded',
      content: 'Blood pressure: 128/82 mmHg, Heart rate: 72 bpm, Temperature: 98.6°F, Oxygen saturation: 98%',
      priority: 'high',
      status: 'approved',
      timestamp: '14:32',
      actionable: false,
      tags: ['vitals', 'baseline'],
      createdAt: new Date(baseTime.getTime() + 2 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 2 * 60000).toISOString(),
    },
    {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      type: 'symptom',
      title: 'Patient Symptoms',
      content: 'Patient reports intermittent chest pain, shortness of breath after exertion, and occasional dizziness. Pain described as sharp, lasting 5-10 minutes.',
      priority: 'high',
      status: 'approved',
      timestamp: '14:35',
      actionable: true,
      tags: ['symptoms', 'chest-pain', 'shortness-of-breath'],
      createdAt: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
    },
    {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      type: 'diagnosis',
      title: 'Preliminary Diagnosis',
      content: 'Suspected angina pectoris based on symptoms and risk factors. Patient has history of hypertension and family history of heart disease.',
      priority: 'high',
      status: 'approved',
      timestamp: '14:38',
      actionable: true,
      tags: ['diagnosis', 'angina', 'cardiology'],
      createdAt: new Date(baseTime.getTime() + 8 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 8 * 60000).toISOString(),
    },
    {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      type: 'treatment',
      title: 'Immediate Treatment Plan',
      content: 'Prescribed nitroglycerin 0.4mg sublingual PRN for chest pain. Advised lifestyle modifications including low-sodium diet and regular exercise.',
      priority: 'high',
      status: 'approved',
      timestamp: '14:42',
      actionable: true,
      tags: ['treatment', 'medication', 'lifestyle'],
      createdAt: new Date(baseTime.getTime() + 12 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 12 * 60000).toISOString(),
    },
    {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      type: 'followup',
      title: 'Follow-up Recommendations',
      content: 'Schedule cardiology consultation within 7 days. Order ECG, echocardiogram, and stress test. Monitor blood pressure daily at home.',
      priority: 'medium',
      status: 'approved',
      timestamp: '14:45',
      actionable: true,
      tags: ['followup', 'cardiology', 'testing'],
      createdAt: new Date(baseTime.getTime() + 15 * 60000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + 15 * 60000).toISOString(),
    }
  ];
};
