import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import StorageService from '../services/StorageService';

export type DoctorRange = '1-10' | '10-20' | '20+';

export type AppointmentStatus = 'booked' | 'cancelled' | 'rescheduled';

export interface ClinicProfile {
  clinicName: string;
  doctorRange: DoctorRange;
  adminEmail: string;
  adminPassword: string;
}

export interface Doctor {
  id: string;
  name: string;
  speciality: string;
  email: string;
  temporaryPassword: string;
  autoEmailSent: boolean;
  createdAt: Date;
}

export interface Receptionist {
  id: string;
  name: string;
  email: string;
  temporaryPassword: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  scheduledById: string;
  scheduledByName: string;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  age: string;
  gender: string;
  reason?: string;
  presentInClinic: boolean;
  insurance?: boolean;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
}

export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AppContextValue {
  clinicProfile?: ClinicProfile;
  doctors: Doctor[];
  receptionists: Receptionist[];
  appointments: Appointment[];
  currentUser?: CurrentUser;
  setClinicProfile: (profile: ClinicProfile) => void;
  addDoctor: (input: {
    name: string;
    speciality: string;
    email: string;
    autoEmail: boolean;
  }) => Doctor;
  removeDoctor: (doctorId: string) => void;
  addReceptionist: (input: { name: string; email: string }) => Receptionist;
  removeReceptionist: (receptionistId: string) => void;
  addAppointment: (input: Omit<Appointment, 'id' | 'doctorName' | 'scheduledByName' | 'status'> & {
    status?: AppointmentStatus;
  }) => Appointment | undefined;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  rescheduleAppointment: (appointmentId: string, date: string, time: string) => void;
  authenticateDoctor: (identifier: string, password: string) => Doctor | undefined;
  authenticateReceptionist: (identifier: string, password: string) => Receptionist | undefined;
  setCurrentUser: (user?: CurrentUser) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const randomId = () => Math.random().toString(36).slice(2, 10);
const generateTempPassword = () => `MED-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Demo accounts
const DEMO_CLINIC_PROFILE: ClinicProfile = {
  clinicName: 'MediEase Demo Clinic',
  doctorRange: '10-20',
  adminEmail: 'admin@gmail.com',
  adminPassword: 'Admin@123'
};

const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'doctor-demo-1',
    name: 'Dr. Jane Smith',
    speciality: 'Cardiologist',
    email: 'doctor@gmail.com',
    temporaryPassword: 'Doctor@123',
    autoEmailSent: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'doctor-demo-2',
    name: 'Dr. Michael Chen',
    speciality: 'Orthopedic Surgeon',
    email: 'michael.chen@clinic.com',
    temporaryPassword: 'MED-XY12',
    autoEmailSent: true,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'doctor-demo-3',
    name: 'Dr. Sarah Williams',
    speciality: 'Pediatrician',
    email: 'sarah.williams@clinic.com',
    temporaryPassword: 'MED-AB34',
    autoEmailSent: false,
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'doctor-demo-4',
    name: 'Dr. Robert Johnson',
    speciality: 'General Physician',
    email: 'robert.johnson@clinic.com',
    temporaryPassword: 'MED-CD56',
    autoEmailSent: true,
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'doctor-demo-5',
    name: 'Dr. Emily Davis',
    speciality: 'Dermatologist',
    email: 'emily.davis@clinic.com',
    temporaryPassword: 'MED-EF78',
    autoEmailSent: true,
    createdAt: new Date('2024-03-10')
  }
];

const DEMO_RECEPTIONISTS: Receptionist[] = [
  {
    id: 'receptionist-demo-1',
    name: 'Sarah Johnson',
    email: 'reception@gmail.com',
    temporaryPassword: 'Reception@123',
    createdAt: new Date('2024-01-10')
  },
  {
    id: 'receptionist-demo-2',
    name: 'Alex Martinez',
    email: 'alex.martinez@clinic.com',
    temporaryPassword: 'MED-REC1',
    createdAt: new Date('2024-02-05')
  },
  {
    id: 'receptionist-demo-3',
    name: 'Jessica Brown',
    email: 'jessica.brown@clinic.com',
    temporaryPassword: 'MED-REC2',
    createdAt: new Date('2024-03-01')
  }
];

// Generate demo appointments
const generateDemoAppointments = (): Appointment[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return [
    {
      id: 'apt-1',
      doctorId: 'doctor-demo-1',
      doctorName: 'Dr. Jane Smith',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'John',
      patientLastName: 'Doe',
      patientPhone: '+1 (555) 123-4567',
      age: '45',
      gender: 'Male',
      reason: 'Annual cardiovascular checkup',
      presentInClinic: true,
      insurance: true,
      date: formatDate(today),
      time: '09:30 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Patient has history of hypertension'
    },
    {
      id: 'apt-2',
      doctorId: 'doctor-demo-1',
      doctorName: 'Dr. Jane Smith',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Emma',
      patientLastName: 'Wilson',
      patientPhone: '+1 (555) 234-5678',
      age: '52',
      gender: 'Female',
      reason: 'Heart palpitations consultation',
      presentInClinic: false,
      insurance: true,
      date: formatDate(today),
      time: '11:00 AM',
      status: 'booked' as AppointmentStatus,
      notes: ''
    },
    {
      id: 'apt-3',
      doctorId: 'doctor-demo-2',
      doctorName: 'Dr. Michael Chen',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'David',
      patientLastName: 'Martinez',
      patientPhone: '+1 (555) 345-6789',
      age: '38',
      gender: 'Male',
      reason: 'Knee pain evaluation',
      presentInClinic: true,
      insurance: false,
      date: formatDate(today),
      time: '10:15 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Sports injury - soccer'
    },
    {
      id: 'apt-4',
      doctorId: 'doctor-demo-3',
      doctorName: 'Dr. Sarah Williams',
      scheduledById: 'receptionist-demo-2',
      scheduledByName: 'Alex Martinez',
      patientFirstName: 'Sophie',
      patientLastName: 'Anderson',
      patientPhone: '+1 (555) 456-7890',
      age: '7',
      gender: 'Female',
      reason: 'Vaccination and wellness check',
      presentInClinic: false,
      insurance: true,
      date: formatDate(today),
      time: '02:30 PM',
      status: 'booked' as AppointmentStatus,
      notes: 'Bring vaccination records'
    },
    {
      id: 'apt-5',
      doctorId: 'doctor-demo-4',
      doctorName: 'Dr. Robert Johnson',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Michael',
      patientLastName: 'Brown',
      patientPhone: '+1 (555) 567-8901',
      age: '29',
      gender: 'Male',
      reason: 'Flu symptoms',
      presentInClinic: true,
      insurance: true,
      date: formatDate(today),
      time: '03:45 PM',
      status: 'booked' as AppointmentStatus,
      notes: 'High fever since yesterday'
    },
    {
      id: 'apt-6',
      doctorId: 'doctor-demo-1',
      doctorName: 'Dr. Jane Smith',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Lisa',
      patientLastName: 'Taylor',
      patientPhone: '+1 (555) 678-9012',
      age: '61',
      gender: 'Female',
      reason: 'Follow-up on medication',
      presentInClinic: false,
      insurance: true,
      date: formatDate(tomorrow),
      time: '09:00 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Review blood pressure medication'
    },
    {
      id: 'apt-7',
      doctorId: 'doctor-demo-5',
      doctorName: 'Dr. Emily Davis',
      scheduledById: 'receptionist-demo-2',
      scheduledByName: 'Alex Martinez',
      patientFirstName: 'James',
      patientLastName: 'Garcia',
      patientPhone: '+1 (555) 789-0123',
      age: '34',
      gender: 'Male',
      reason: 'Skin rash consultation',
      presentInClinic: false,
      insurance: false,
      date: formatDate(tomorrow),
      time: '11:30 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Rash appeared 3 days ago'
    },
    {
      id: 'apt-8',
      doctorId: 'doctor-demo-2',
      doctorName: 'Dr. Michael Chen',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Patricia',
      patientLastName: 'Miller',
      patientPhone: '+1 (555) 890-1234',
      age: '56',
      gender: 'Female',
      reason: 'Hip replacement follow-up',
      presentInClinic: false,
      insurance: true,
      date: formatDate(tomorrow),
      time: '02:00 PM',
      status: 'booked' as AppointmentStatus,
      notes: 'Post-op week 6'
    },
    {
      id: 'apt-9',
      doctorId: 'doctor-demo-3',
      doctorName: 'Dr. Sarah Williams',
      scheduledById: 'receptionist-demo-3',
      scheduledByName: 'Jessica Brown',
      patientFirstName: 'Lucas',
      patientLastName: 'Rodriguez',
      patientPhone: '+1 (555) 901-2345',
      age: '5',
      gender: 'Male',
      reason: 'Ear infection check',
      presentInClinic: false,
      insurance: true,
      date: formatDate(dayAfter),
      time: '10:30 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Parent reports ear pain for 2 days'
    },
    {
      id: 'apt-10',
      doctorId: 'doctor-demo-4',
      doctorName: 'Dr. Robert Johnson',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Nancy',
      patientLastName: 'White',
      patientPhone: '+1 (555) 012-3456',
      age: '42',
      gender: 'Female',
      reason: 'Annual physical exam',
      presentInClinic: false,
      insurance: true,
      date: formatDate(dayAfter),
      time: '01:15 PM',
      status: 'booked' as AppointmentStatus,
      notes: 'Routine checkup'
    },
    {
      id: 'apt-11',
      doctorId: 'doctor-demo-1',
      doctorName: 'Dr. Jane Smith',
      scheduledById: 'receptionist-demo-1',
      scheduledByName: 'Sarah Johnson',
      patientFirstName: 'Robert',
      patientLastName: 'Lee',
      patientPhone: '+1 (555) 111-2222',
      age: '68',
      gender: 'Male',
      reason: 'Chest pain evaluation',
      presentInClinic: false,
      insurance: true,
      date: formatDate(yesterday),
      time: '10:00 AM',
      status: 'booked' as AppointmentStatus,
      notes: 'Completed - Referred for ECG'
    },
    {
      id: 'apt-12',
      doctorId: 'doctor-demo-5',
      doctorName: 'Dr. Emily Davis',
      scheduledById: 'receptionist-demo-2',
      scheduledByName: 'Alex Martinez',
      patientFirstName: 'Jennifer',
      patientLastName: 'Clark',
      patientPhone: '+1 (555) 222-3333',
      age: '31',
      gender: 'Female',
      reason: 'Acne treatment',
      presentInClinic: false,
      insurance: false,
      date: formatDate(yesterday),
      time: '03:00 PM',
      status: 'booked' as AppointmentStatus,
      notes: 'Completed - Prescribed topical treatment'
    }
  ];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with demo data
  const [clinicProfile, setClinicProfileState] = useState<ClinicProfile | undefined>(DEMO_CLINIC_PROFILE);
  const [doctors, setDoctors] = useState<Doctor[]>(DEMO_DOCTORS);
  const [receptionists, setReceptionists] = useState<Receptionist[]>(DEMO_RECEPTIONISTS);
  const [appointments, setAppointments] = useState<Appointment[]>(generateDemoAppointments());
  const [currentUser, setCurrentUser] = useState<CurrentUser | undefined>();

  // Initialize storage and migrate data on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await StorageService.migrateData();
        
        // Load saved data from storage
        const savedClinicProfile = await StorageService.getClinicProfile();
        const savedDoctors = await StorageService.getDoctors();
        const savedReceptionists = await StorageService.getReceptionists();
        
        if (savedClinicProfile) {
          setClinicProfileState(savedClinicProfile);
        }
        if (savedDoctors.length > 0) {
          setDoctors(savedDoctors);
        }
        if (savedReceptionists.length > 0) {
          setReceptionists(savedReceptionists);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const setClinicProfile = (profile: ClinicProfile) => {
    setClinicProfileState(profile);
  };

  const addDoctor: AppContextValue['addDoctor'] = async ({ name, speciality, email, autoEmail }) => {
    const newDoctor: Doctor = {
      id: randomId(),
      name,
      speciality,
      email,
      temporaryPassword: generateTempPassword(),
      autoEmailSent: autoEmail,
      createdAt: new Date(),
    };

    setDoctors((prev) => [...prev, newDoctor]);

    // Save to storage
    try {
      const updatedDoctors = [...doctors, newDoctor];
      await StorageService.saveDoctors(updatedDoctors);
    } catch (error) {
      console.error('Error saving doctor:', error);
    }

    if (autoEmail) {
      Alert.alert('Email queued', `An access email will be sent to ${name}.`);
    }

    return newDoctor;
  };

  const removeDoctor: AppContextValue['removeDoctor'] = (doctorId) => {
    setDoctors((prev) => prev.filter((doctor) => doctor.id !== doctorId));
    setAppointments((prev) => prev.filter((appointment) => appointment.doctorId !== doctorId));
  };

  const addReceptionist: AppContextValue['addReceptionist'] = async ({ name, email }) => {
    const newReceptionist: Receptionist = {
      id: randomId(),
      name,
      email,
      temporaryPassword: generateTempPassword(),
      createdAt: new Date(),
    };

    setReceptionists((prev) => [...prev, newReceptionist]);

    // Save to storage
    try {
      const updatedReceptionists = [...receptionists, newReceptionist];
      await StorageService.saveReceptionists(updatedReceptionists);
    } catch (error) {
      console.error('Error saving receptionist:', error);
    }

    return newReceptionist;
  };

  const removeReceptionist: AppContextValue['removeReceptionist'] = (receptionistId) => {
    setReceptionists((prev) => prev.filter((receptionist) => receptionist.id !== receptionistId));
  };

  const addAppointment: AppContextValue['addAppointment'] = (input) => {
    const doctor = doctors.find((item) => item.id === input.doctorId);
    const receptionist = receptionists.find((item) => item.id === input.scheduledById);

    if (!doctor || !receptionist) {
      Alert.alert('Missing data', 'Please ensure doctor and receptionist exist.');
      return undefined;
    }

    const newAppointment: Appointment = {
      id: randomId(),
      doctorId: input.doctorId,
      doctorName: doctor.name,
      scheduledById: input.scheduledById,
      scheduledByName: receptionist.name,
      patientFirstName: input.patientFirstName,
      patientLastName: input.patientLastName,
      patientPhone: input.patientPhone,
      age: input.age,
      gender: input.gender,
      reason: input.reason,
      presentInClinic: input.presentInClinic,
      insurance: input.insurance,
      date: input.date,
      time: input.time,
      status: input.status ?? 'booked',
      notes: input.notes,
    };

    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointmentStatus: AppContextValue['updateAppointmentStatus'] = (appointmentId, status) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment,
      ),
    );
  };

  const rescheduleAppointment: AppContextValue['rescheduleAppointment'] = (appointmentId, date, time) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, date, time, status: 'rescheduled' } : appointment,
      ),
    );
  };

  const authenticateDoctor: AppContextValue['authenticateDoctor'] = (identifier, password) => {
    const match = doctors.find((doctor) => {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      return (
        doctor.email.trim().toLowerCase() === normalizedIdentifier ||
        doctor.name.trim().toLowerCase() === normalizedIdentifier
      );
    });

    if (!match) {
      Alert.alert('Doctor not found', 'No doctor matches those credentials.');
      return undefined;
    }

    if (match.temporaryPassword !== password) {
      Alert.alert('Incorrect password', 'Please verify your temporary password.');
      return undefined;
    }

    return match;
  };

  const authenticateReceptionist: AppContextValue['authenticateReceptionist'] = (identifier, password) => {
    const match = receptionists.find((receptionist) => {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      return (
        receptionist.email.trim().toLowerCase() === normalizedIdentifier ||
        receptionist.name.trim().toLowerCase() === normalizedIdentifier
      );
    });

    if (!match) {
      Alert.alert('Receptionist not found', 'No receptionist matches those credentials.');
      return undefined;
    }

    if (match.temporaryPassword !== password) {
      Alert.alert('Incorrect password', 'Please verify the temporary password.');
      return undefined;
    }

    return match;
  };

  const logout = () => {
    setCurrentUser(undefined);
  };

  const value = useMemo<AppContextValue>(
    () => ({
      clinicProfile,
      doctors,
      receptionists,
      appointments,
      currentUser,
      setClinicProfile,
      addDoctor,
      removeDoctor,
      addReceptionist,
      removeReceptionist,
      addAppointment,
      updateAppointmentStatus,
      rescheduleAppointment,
      authenticateDoctor,
      authenticateReceptionist,
      setCurrentUser,
      logout,
    }),
    [clinicProfile, doctors, receptionists, appointments, currentUser],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

