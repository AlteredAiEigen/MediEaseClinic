// Simple in-memory storage for development
// In production, replace with @react-native-async-storage/async-storage
const AsyncStorage = {
  _storage: new Map<string, string>(),
  
  setItem: async (key: string, value: string) => {
    AsyncStorage._storage.set(key, value);
    return Promise.resolve();
  },
  
  getItem: async (key: string) => {
    return Promise.resolve(AsyncStorage._storage.get(key) || null);
  },
  
  removeItem: async (key: string) => {
    AsyncStorage._storage.delete(key);
    return Promise.resolve();
  },
  
  clear: async () => {
    AsyncStorage._storage.clear();
    return Promise.resolve();
  },
  
  getAllKeys: async () => {
    return Promise.resolve(Array.from(AsyncStorage._storage.keys()));
  }
};

export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic storage methods
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  // Specific data methods
  async getPatients(): Promise<any[]> {
    const patients = await this.getItem<any[]>('patients');
    return patients || [];
  }

  async savePatients(patients: any[]): Promise<void> {
    await this.setItem('patients', patients);
  }

  async getAppointments(): Promise<any[]> {
    const appointments = await this.getItem<any[]>('appointments');
    return appointments || [];
  }

  async saveAppointments(appointments: any[]): Promise<void> {
    await this.setItem('appointments', appointments);
  }

  async getClinicalNotes(): Promise<any[]> {
    const notes = await this.getItem<any[]>('clinicalNotes');
    return notes || [];
  }

  async saveClinicalNotes(notes: any[]): Promise<void> {
    await this.setItem('clinicalNotes', notes);
  }

  async getRecordings(): Promise<any[]> {
    const recordings = await this.getItem<any[]>('recordings');
    return recordings || [];
  }

  async saveRecordings(recordings: any[]): Promise<void> {
    await this.setItem('recordings', recordings);
  }

  async getDoctors(): Promise<any[]> {
    const doctors = await this.getItem<any[]>('doctors');
    return doctors || [];
  }

  async saveDoctors(doctors: any[]): Promise<void> {
    await this.setItem('doctors', doctors);
  }

  async getReceptionists(): Promise<any[]> {
    const receptionists = await this.getItem<any[]>('receptionists');
    return receptionists || [];
  }

  async saveReceptionists(receptionists: any[]): Promise<void> {
    await this.setItem('receptionists', receptionists);
  }

  async getClinicProfile(): Promise<any | null> {
    return await this.getItem<any>('clinicProfile');
  }

  async saveClinicProfile(profile: any): Promise<void> {
    await this.setItem('clinicProfile', profile);
  }

  // Statistics and analytics
  async getStatistics(): Promise<any> {
    const stats = await this.getItem<any>('statistics');
    return stats || {
      totalPatients: 0,
      totalAppointments: 0,
      totalConsultations: 0,
      doctorsCount: 0,
      receptionistsCount: 0,
    };
  }

  async saveStatistics(stats: any): Promise<void> {
    await this.setItem('statistics', stats);
  }

  // Search index for better performance
  async getSearchIndex(): Promise<any> {
    const index = await this.getItem<any>('searchIndex');
    return index || {
      patients: {},
      appointments: {},
    };
  }

  async saveSearchIndex(index: any): Promise<void> {
    await this.setItem('searchIndex', index);
  }

  // Data migration
  async migrateData(): Promise<void> {
    try {
      const version = await this.getItem<string>('dataVersion');
      const currentVersion = '1.0.0';
      
      if (version !== currentVersion) {
        console.log('Migrating data to version:', currentVersion);
        
        // Initialize default data if none exists
        const patients = await this.getPatients();
        if (patients.length === 0) {
          await this.initializeDefaultData();
        }
        
        await this.setItem('dataVersion', currentVersion);
      }
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  private async initializeDefaultData(): Promise<void> {
    // Initialize with some default data for demo
    const defaultPatients = [
      {
        id: '1',
        patientId: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        age: '45',
        bloodGroup: 'A+',
        dateOfBirth: '15/03/1979',
        email: 'john.doe@email.com',
        phone: '555-0123',
        address: '123 Main St, City, State',
        vitals: {
          bloodPressure: '120/80',
          heartRate: '72',
          temperature: '98.6°F',
          oxygenSaturation: '98%',
          weight: '75kg',
          height: '175cm',
          bmi: '24.5'
        },
        medicalHistory: 'Hypertension, Type 2 Diabetes',
        allergies: 'Penicillin',
        familyHistory: 'Father had heart disease',
        previousSurgeries: 'Appendectomy (1995)',
        currentMedication: 'Metformin 500mg, Lisinopril 10mg',
        lifestyle: {
          smoking: 'Former (quit 5 years ago)',
          alcohol: 'Occasional',
          exercise: 'Light',
          diet: 'Regular',
          sleep: '7-8 hours',
          stress: 'Moderate'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        patientId: 'P002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'Female',
        age: '32',
        bloodGroup: 'B-',
        dateOfBirth: '22/07/1992',
        email: 'sarah.j@email.com',
        phone: '555-0456',
        address: '456 Oak Ave, City, State',
        vitals: {
          bloodPressure: '110/70',
          heartRate: '68',
          temperature: '98.4°F',
          oxygenSaturation: '99%',
          weight: '62kg',
          height: '165cm',
          bmi: '22.8'
        },
        medicalHistory: 'None',
        allergies: 'None known',
        familyHistory: 'Mother had breast cancer',
        previousSurgeries: 'None',
        currentMedication: 'None',
        lifestyle: {
          smoking: 'Never',
          alcohol: 'Occasional',
          exercise: 'Moderate',
          diet: 'Vegetarian',
          sleep: '8 hours',
          stress: 'Low'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const defaultAppointments = [
      {
        id: 'apt1',
        patientId: '1',
        doctorId: 'doc1',
        date: '2024-12-15',
        time: '09:00',
        duration: 30,
        status: 'scheduled',
        reason: 'Routine checkup',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt2',
        patientId: '2',
        doctorId: 'doc1',
        date: '2024-12-15',
        time: '10:00',
        duration: 30,
        status: 'scheduled',
        reason: 'Follow-up consultation',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const defaultDoctors = [
      {
        id: 'doc1',
        name: 'Dr. Jane Smith',
        speciality: 'General Medicine',
        email: 'jane.smith@clinic.com',
        temporaryPassword: 'temp123',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];

    const defaultReceptionists = [
      {
        id: 'rec1',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@clinic.com',
        temporaryPassword: 'temp456',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];

    const defaultClinicProfile = {
      clinicName: 'MediEase Clinic',
      adminEmail: 'admin@clinic.com',
      doctorRange: '1-10',
      address: '123 Medical Center, Health City',
      phone: '555-CLINIC',
      hours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: '9:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      createdAt: new Date().toISOString(),
    };

    await this.savePatients(defaultPatients);
    await this.saveAppointments(defaultAppointments);
    await this.saveDoctors(defaultDoctors);
    await this.saveReceptionists(defaultReceptionists);
    await this.saveClinicProfile(defaultClinicProfile);
  }
}

export default StorageService.getInstance();
