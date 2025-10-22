import StorageService from './StorageService';
import { 
  ClinicalNote, 
  ClinicalNoteFormData, 
  Prescription,
  ConsultationSummary,
  validateClinicalNoteData,
  generateClinicalNoteId,
  generatePrescriptionId,
  createEmptyClinicalNote,
  generateMockClinicalNotes
} from '../models/ClinicalNote';

export class NotesService {
  private storageService: StorageService;

  constructor() {
    this.storageService = StorageService;
  }

  // CRUD Operations for Clinical Notes
  async getAllClinicalNotes(): Promise<ClinicalNote[]> {
    return await this.storageService.getClinicalNotes();
  }

  async getClinicalNoteById(id: string): Promise<ClinicalNote | null> {
    const notes = await this.getAllClinicalNotes();
    return notes.find(note => note.id === id) || null;
  }

  async createClinicalNote(noteData: ClinicalNoteFormData & { 
    patientId: string; 
    appointmentId: string; 
    doctorId: string; 
  }): Promise<ClinicalNote> {
    const errors = validateClinicalNoteData(noteData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const notes = await this.getAllClinicalNotes();
    const newNote: ClinicalNote = {
      ...createEmptyClinicalNote(),
      ...noteData,
      id: generateClinicalNoteId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.push(newNote);
    await this.storageService.saveClinicalNotes(notes);
    
    return newNote;
  }

  async updateClinicalNote(id: string, noteData: Partial<ClinicalNoteFormData>): Promise<ClinicalNote> {
    const notes = await this.getAllClinicalNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      throw new Error('Clinical note not found');
    }

    const errors = validateClinicalNoteData({ ...notes[noteIndex], ...noteData });
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      ...noteData,
      updatedAt: new Date().toISOString(),
    };

    await this.storageService.saveClinicalNotes(notes);
    
    return notes[noteIndex];
  }

  async deleteClinicalNote(id: string): Promise<void> {
    const notes = await this.getAllClinicalNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    
    if (filteredNotes.length === notes.length) {
      throw new Error('Clinical note not found');
    }

    await this.storageService.saveClinicalNotes(filteredNotes);
  }

  // Query methods
  async getNotesByPatient(patientId: string): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    return notes.filter(note => note.patientId === patientId);
  }

  async getNotesByAppointment(appointmentId: string): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    return notes.filter(note => note.appointmentId === appointmentId);
  }

  async getNotesByDoctor(doctorId: string): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    return notes.filter(note => note.doctorId === doctorId);
  }

  async getNotesByType(type: ClinicalNote['type']): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    return notes.filter(note => note.type === type);
  }

  async getActionableNotes(patientId?: string): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    let filtered = notes.filter(note => note.actionable && !note.completed);
    
    if (patientId) {
      filtered = filtered.filter(note => note.patientId === patientId);
    }
    
    return filtered;
  }

  // Status management
  async markNoteComplete(id: string): Promise<ClinicalNote> {
    const note = await this.getClinicalNoteById(id);
    if (!note) {
      throw new Error('Clinical note not found');
    }

    return await this.updateClinicalNote(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }

  async markNoteIncomplete(id: string): Promise<ClinicalNote> {
    return await this.updateClinicalNote(id, {
      completed: false,
      completedAt: undefined,
    });
  }

  // Generate notes from consultation (mock AI transcription)
  async generateNotesFromConsultation(
    patientId: string, 
    appointmentId: string, 
    doctorId: string,
    consultationDuration: number
  ): Promise<ClinicalNote[]> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock clinical notes based on consultation
    const mockNotes = generateMockClinicalNotes(patientId, appointmentId, doctorId);
    
    // Save the generated notes
    const existingNotes = await this.getAllClinicalNotes();
    const allNotes = [...existingNotes, ...mockNotes];
    await this.storageService.saveClinicalNotes(allNotes);
    
    return mockNotes;
  }

  // Statistics
  async getNotesStatistics(): Promise<{
    totalNotes: number;
    actionableNotes: number;
    completedNotes: number;
    notesByType: { [key: string]: number };
    notesByPriority: { [key: string]: number };
  }> {
    const notes = await this.getAllClinicalNotes();
    
    const actionableNotes = notes.filter(note => note.actionable).length;
    const completedNotes = notes.filter(note => note.completed).length;

    const notesByType = notes.reduce((acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const notesByPriority = notes.reduce((acc, note) => {
      acc[note.priority] = (acc[note.priority] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalNotes: notes.length,
      actionableNotes,
      completedNotes,
      notesByType,
      notesByPriority,
    };
  }

  // Search functionality
  async searchNotes(query: string): Promise<ClinicalNote[]> {
    if (!query.trim()) {
      return [];
    }

    const notes = await this.getAllClinicalNotes();
    const searchTerm = query.toLowerCase().trim();
    
    return notes.filter(note => {
      const searchableFields = [
        note.title,
        note.content,
        note.tags.join(' '),
      ];

      return searchableFields.some(field => 
        field && field.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Recent notes
  async getRecentNotes(limit: number = 10): Promise<ClinicalNote[]> {
    const notes = await this.getAllClinicalNotes();
    return notes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // Prescription management
  async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prescription> {
    const prescription: Prescription = {
      ...prescriptionData,
      id: generatePrescriptionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // For now, we'll store prescriptions in clinical notes
    // In a real app, you'd have a separate prescriptions table
    const prescriptionNote: ClinicalNote = {
      ...createEmptyClinicalNote(),
      id: generateClinicalNoteId(),
      patientId: prescription.patientId,
      appointmentId: prescription.appointmentId,
      doctorId: prescription.doctorId,
      type: 'prescription',
      title: `Prescription: ${prescription.medicationName}`,
      content: `${prescription.medicationName} ${prescription.dosage} - ${prescription.frequency} for ${prescription.duration}. Instructions: ${prescription.instructions}`,
      priority: 'high',
      status: 'approved',
      timestamp: new Date().toTimeString().slice(0, 5),
      actionable: true,
      tags: ['prescription', prescription.medicationName.toLowerCase()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notes = await this.getAllClinicalNotes();
    notes.push(prescriptionNote);
    await this.storageService.saveClinicalNotes(notes);
    
    return prescription;
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    const notes = await this.getNotesByPatient(patientId);
    const prescriptionNotes = notes.filter(note => note.type === 'prescription');
    
    // Convert clinical notes back to prescription format
    // This is a simplified approach - in a real app, you'd have a separate prescriptions table
    return prescriptionNotes.map(note => ({
      id: note.id,
      patientId: note.patientId,
      appointmentId: note.appointmentId,
      doctorId: note.doctorId,
      medicationName: 'Medication', // Would be parsed from note content
      dosage: 'As prescribed',
      frequency: 'As needed',
      duration: '30 days',
      instructions: note.content,
      quantity: 1,
      refills: 0,
      isActive: true,
      prescribedAt: note.createdAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  }

  // Consultation summary
  async createConsultationSummary(
    patientId: string,
    appointmentId: string,
    doctorId: string,
    duration: number,
    notes: ClinicalNote[]
  ): Promise<ConsultationSummary> {
    const summary: ConsultationSummary = {
      id: generateClinicalNoteId(),
      patientId,
      appointmentId,
      doctorId,
      duration,
      chiefComplaint: notes.find(n => n.type === 'symptom')?.content || 'Not specified',
      symptoms: notes.filter(n => n.type === 'symptom').map(n => n.title),
      diagnosis: notes.filter(n => n.type === 'diagnosis').map(n => n.title),
      treatmentPlan: notes.find(n => n.type === 'treatment')?.content || 'No treatment plan specified',
      prescriptions: [], // Would be populated from prescription service
      followUpRequired: notes.some(n => n.type === 'followup'),
      followUpDate: notes.find(n => n.type === 'followup')?.content.includes('7 days') ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      followUpNotes: notes.find(n => n.type === 'followup')?.content,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return summary;
  }

  // Export/Import
  async exportNotes(): Promise<string> {
    const notes = await this.getAllClinicalNotes();
    return JSON.stringify(notes, null, 2);
  }

  async importNotes(jsonData: string): Promise<ClinicalNote[]> {
    try {
      const importedNotes = JSON.parse(jsonData);
      if (!Array.isArray(importedNotes)) {
        throw new Error('Invalid data format');
      }

      const notes = await this.getAllClinicalNotes();
      const newNotes = importedNotes.map(note => ({
        ...note,
        id: note.id || generateClinicalNoteId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      notes.push(...newNotes);
      await this.storageService.saveClinicalNotes(notes);
      
      return newNotes;
    } catch (error) {
      throw new Error('Failed to import notes: ' + error);
    }
  }
}

export default new NotesService();
