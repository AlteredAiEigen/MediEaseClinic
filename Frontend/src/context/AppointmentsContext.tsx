import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, DoctorAvailability, TimeSlot } from '../models/Appointment';
import AppointmentService from '../services/AppointmentService';

interface AppointmentsContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  searchResults: Appointment[];
  statistics: {
    totalAppointments: number;
    todayAppointments: number;
    completedToday: number;
    cancelledToday: number;
    appointmentsByStatus: { [key: string]: number };
    appointmentsByDoctor: { [key: string]: number };
  };
  
  // Actions
  loadAppointments: () => Promise<void>;
  createAppointment: (appointmentData: any) => Promise<Appointment>;
  updateAppointment: (id: string, appointmentData: any) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<Appointment>;
  searchAppointments: (query: string) => Promise<void>;
  clearSearch: () => void;
  getAppointmentById: (id: string) => Appointment | null;
  getAppointmentsByDate: (date: string) => Promise<Appointment[]>;
  getAppointmentsByDoctor: (doctorId: string, date?: string) => Promise<Appointment[]>;
  getAppointmentsByPatient: (patientId: string) => Promise<Appointment[]>;
  getPatientQueue: (doctorId: string) => Promise<Appointment[]>;
  getDoctorAvailability: (doctorId: string, date: string) => Promise<DoctorAvailability>;
  getAvailableTimeSlots: (doctorId: string, date: string) => Promise<TimeSlot[]>;
  refreshStatistics: () => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};

interface AppointmentsProviderProps {
  children: ReactNode;
}

export const AppointmentsProvider: React.FC<AppointmentsProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const [statistics, setStatistics] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    completedToday: 0,
    cancelledToday: 0,
    appointmentsByStatus: {} as { [key: string]: number },
    appointmentsByDoctor: {} as { [key: string]: number },
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const appointmentsData = await AppointmentService.getAllAppointments();
      setAppointments(appointmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: any): Promise<Appointment> => {
    try {
      setLoading(true);
      setError(null);
      const newAppointment = await AppointmentService.createAppointment(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
      await refreshStatistics();
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id: string, appointmentData: any): Promise<Appointment> => {
    try {
      setLoading(true);
      setError(null);
      const updatedAppointment = await AppointmentService.updateAppointment(id, appointmentData);
      setAppointments(prev => prev.map(appointment => 
        appointment.id === id ? updatedAppointment : appointment
      ));
      await refreshStatistics();
      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await AppointmentService.deleteAppointment(id);
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      await refreshStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']): Promise<Appointment> => {
    try {
      setLoading(true);
      setError(null);
      const updatedAppointment = await AppointmentService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(appointment => 
        appointment.id === id ? updatedAppointment : appointment
      ));
      await refreshStatistics();
      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchAppointments = async (query: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const results = await AppointmentService.searchAppointments(query);
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

  const getAppointmentById = (id: string): Appointment | null => {
    return appointments.find(appointment => appointment.id === id) || null;
  };

  const getAppointmentsByDate = async (date: string): Promise<Appointment[]> => {
    return await AppointmentService.getAppointmentsByDate(date);
  };

  const getAppointmentsByDoctor = async (doctorId: string, date?: string): Promise<Appointment[]> => {
    return await AppointmentService.getAppointmentsByDoctor(doctorId, date);
  };

  const getAppointmentsByPatient = async (patientId: string): Promise<Appointment[]> => {
    return await AppointmentService.getAppointmentsByPatient(patientId);
  };

  const getPatientQueue = async (doctorId: string): Promise<Appointment[]> => {
    return await AppointmentService.getPatientQueue(doctorId);
  };

  const getDoctorAvailability = async (doctorId: string, date: string): Promise<DoctorAvailability> => {
    return await AppointmentService.getDoctorAvailability(doctorId, date);
  };

  const getAvailableTimeSlots = async (doctorId: string, date: string): Promise<TimeSlot[]> => {
    return await AppointmentService.getAvailableTimeSlots(doctorId, date);
  };

  const refreshStatistics = async () => {
    try {
      const stats = await AppointmentService.getAppointmentStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to refresh statistics:', err);
    }
  };

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const value: AppointmentsContextType = {
    appointments,
    loading,
    error,
    searchResults,
    statistics,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    searchAppointments,
    clearSearch,
    getAppointmentById,
    getAppointmentsByDate,
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getPatientQueue,
    getDoctorAvailability,
    getAvailableTimeSlots,
    refreshStatistics,
  };

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};
