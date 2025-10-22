import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, PatientSearchResult } from '../models/Patient';
import PatientService from '../services/PatientService';

interface PatientsContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  searchResults: PatientSearchResult[];
  statistics: {
    totalPatients: number;
    newPatientsThisMonth: number;
    patientsByGender: { [key: string]: number };
    patientsByAgeGroup: { [key: string]: number };
  };
  
  // Actions
  loadPatients: () => Promise<void>;
  createPatient: (patientData: any) => Promise<Patient>;
  updatePatient: (id: string, patientData: any) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  clearSearch: () => void;
  getPatientById: (id: string) => Patient | null;
  getRecentPatients: (limit?: number) => Patient[];
  refreshStatistics: () => Promise<void>;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
};

interface PatientsProviderProps {
  children: ReactNode;
}

export const PatientsProvider: React.FC<PatientsProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    patientsByGender: {} as { [key: string]: number },
    patientsByAgeGroup: {} as { [key: string]: number },
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const patientsData = await PatientService.getAllPatients();
      setPatients(patientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (patientData: any): Promise<Patient> => {
    try {
      setLoading(true);
      setError(null);
      const newPatient = await PatientService.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      await refreshStatistics();
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (id: string, patientData: any): Promise<Patient> => {
    try {
      setLoading(true);
      setError(null);
      const updatedPatient = await PatientService.updatePatient(id, patientData);
      setPatients(prev => prev.map(patient => 
        patient.id === id ? updatedPatient : patient
      ));
      await refreshStatistics();
      return updatedPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await PatientService.deletePatient(id);
      setPatients(prev => prev.filter(patient => patient.id !== id));
      await refreshStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const results = await PatientService.searchPatients(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
  };

  const getPatientById = (id: string): Patient | null => {
    return patients.find(patient => patient.id === id) || null;
  };

  const getRecentPatients = (limit: number = 10): Patient[] => {
    return patients
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  };

  const refreshStatistics = async () => {
    try {
      const stats = await PatientService.getPatientStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to refresh statistics:', err);
    }
  };

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  const value: PatientsContextType = {
    patients,
    loading,
    error,
    searchResults,
    statistics,
    loadPatients,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    clearSearch,
    getPatientById,
    getRecentPatients,
    refreshStatistics,
  };

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
};
