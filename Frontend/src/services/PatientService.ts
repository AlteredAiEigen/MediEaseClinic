import StorageService from './StorageService';
import { Patient, PatientSearchResult, PatientFormData, validatePatientData, generatePatientId, createEmptyPatient } from '../models/Patient';

export class PatientService {
  private storageService: StorageService;

  constructor() {
    this.storageService = StorageService;
  }

  // CRUD Operations
  async getAllPatients(): Promise<Patient[]> {
    return await this.storageService.getPatients();
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const patients = await this.getAllPatients();
    return patients.find(patient => patient.id === id) || null;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | null> {
    const patients = await this.getAllPatients();
    return patients.find(patient => patient.patientId === patientId) || null;
  }

  async createPatient(patientData: PatientFormData): Promise<Patient> {
    const errors = validatePatientData(patientData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check for duplicate phone or email
    const existingPatient = await this.findDuplicatePatient(patientData.phone, patientData.email);
    if (existingPatient) {
      throw new Error('Patient with this phone number or email already exists');
    }

    const patients = await this.getAllPatients();
    const newPatient: Patient = {
      ...createEmptyPatient(),
      ...patientData,
      id: Date.now().toString(),
      patientId: generatePatientId(),
      vitals: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        bmi: ''
      },
      lifestyle: patientData.lifestyle || {
        smoking: '',
        alcohol: '',
        exercise: '',
        diet: '',
        sleep: '',
        stress: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    patients.push(newPatient);
    await this.storageService.savePatients(patients);
    
    // Update search index
    await this.updateSearchIndex();
    
    return newPatient;
  }

  async updatePatient(id: string, patientData: Partial<PatientFormData>): Promise<Patient> {
    const patients = await this.getAllPatients();
    const patientIndex = patients.findIndex(patient => patient.id === id);
    
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }

    const errors = validatePatientData({ ...patients[patientIndex], ...patientData });
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check for duplicate phone or email (excluding current patient)
    if (patientData.phone || patientData.email) {
      const existingPatient = await this.findDuplicatePatient(
        patientData.phone || patients[patientIndex].phone,
        patientData.email || patients[patientIndex].email,
        id
      );
      if (existingPatient) {
        throw new Error('Another patient with this phone number or email already exists');
      }
    }

    patients[patientIndex] = {
      ...patients[patientIndex],
      ...patientData,
      updatedAt: new Date().toISOString(),
    };

    await this.storageService.savePatients(patients);
    
    // Update search index
    await this.updateSearchIndex();
    
    return patients[patientIndex];
  }

  async deletePatient(id: string): Promise<void> {
    const patients = await this.getAllPatients();
    const filteredPatients = patients.filter(patient => patient.id !== id);
    
    if (filteredPatients.length === patients.length) {
      throw new Error('Patient not found');
    }

    await this.storageService.savePatients(filteredPatients);
    
    // Update search index
    await this.updateSearchIndex();
  }

  // Search functionality
  async searchPatients(query: string): Promise<PatientSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const patients = await this.getAllPatients();
    const searchTerm = query.toLowerCase().trim();
    const results: PatientSearchResult[] = [];

    patients.forEach(patient => {
      const searchableFields = [
        patient.firstName,
        patient.lastName,
        patient.patientId,
        patient.phone,
        patient.email,
        `${patient.firstName} ${patient.lastName}`,
      ];

      const matchedFields: string[] = [];
      let score = 0;

      searchableFields.forEach(field => {
        if (field.toLowerCase().includes(searchTerm)) {
          matchedFields.push(field);
          score += field.toLowerCase() === searchTerm ? 10 : 5; // Exact match gets higher score
        }
      });

      if (matchedFields.length > 0) {
        results.push({
          patient,
          score,
          matchedFields,
        });
      }
    });

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  async findDuplicatePatient(phone: string, email: string, excludeId?: string): Promise<Patient | null> {
    const patients = await this.getAllPatients();
    return patients.find(patient => 
      patient.id !== excludeId && 
      (patient.phone === phone || patient.email === email)
    ) || null;
  }

  // Statistics
  async getPatientStatistics(): Promise<{
    totalPatients: number;
    newPatientsThisMonth: number;
    patientsByGender: { [key: string]: number };
    patientsByAgeGroup: { [key: string]: number };
  }> {
    const patients = await this.getAllPatients();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newPatientsThisMonth = patients.filter(patient => 
      new Date(patient.createdAt) >= thisMonth
    ).length;

    const patientsByGender = patients.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const patientsByAgeGroup = patients.reduce((acc, patient) => {
      const age = parseInt(patient.age) || 0;
      let group = '';
      if (age < 18) group = 'Under 18';
      else if (age < 30) group = '18-29';
      else if (age < 45) group = '30-44';
      else if (age < 60) group = '45-59';
      else group = '60+';
      
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalPatients: patients.length,
      newPatientsThisMonth,
      patientsByGender,
      patientsByAgeGroup,
    };
  }

  // Recent patients
  async getRecentPatients(limit: number = 10): Promise<Patient[]> {
    const patients = await this.getAllPatients();
    return patients
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // Patient queue (for doctor dashboard)
  async getPatientQueue(doctorId: string): Promise<Patient[]> {
    // This would typically integrate with appointment service
    // For now, return recent patients as a mock queue
    const patients = await this.getRecentPatients(5);
    return patients.map(patient => ({
      ...patient,
      // Add queue-specific properties
      waitTime: '15 min',
      status: 'waiting' as any,
    }));
  }

  // Update search index for better performance
  private async updateSearchIndex(): Promise<void> {
    const patients = await this.getAllPatients();
    const searchIndex = await this.storageService.getSearchIndex();
    
    const patientIndex: { [key: string]: string[] } = {};
    
    patients.forEach(patient => {
      const searchTerms = [
        patient.firstName.toLowerCase(),
        patient.lastName.toLowerCase(),
        patient.patientId.toLowerCase(),
        patient.phone,
        patient.email.toLowerCase(),
        `${patient.firstName} ${patient.lastName}`.toLowerCase(),
      ];

      searchTerms.forEach(term => {
        if (!patientIndex[term]) {
          patientIndex[term] = [];
        }
        patientIndex[term].push(patient.id);
      });
    });

    searchIndex.patients = patientIndex;
    await this.storageService.saveSearchIndex(searchIndex);
  }

  // Export/Import functionality
  async exportPatients(): Promise<string> {
    const patients = await this.getAllPatients();
    return JSON.stringify(patients, null, 2);
  }

  async importPatients(jsonData: string): Promise<Patient[]> {
    try {
      const importedPatients = JSON.parse(jsonData);
      if (!Array.isArray(importedPatients)) {
        throw new Error('Invalid data format');
      }

      const patients = await this.getAllPatients();
      const newPatients = importedPatients.map(patient => ({
        ...patient,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        patientId: patient.patientId || generatePatientId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      patients.push(...newPatients);
      await this.storageService.savePatients(patients);
      await this.updateSearchIndex();
      
      return newPatients;
    } catch (error) {
      throw new Error('Failed to import patients: ' + error);
    }
  }
}

export default new PatientService();
