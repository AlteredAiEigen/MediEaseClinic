import StorageService from './StorageService';
import { 
  Appointment, 
  AppointmentFormData, 
  DoctorAvailability, 
  TimeSlot,
  validateAppointmentData,
  generateAppointmentId,
  createEmptyAppointment,
  checkTimeSlotConflict,
  generateTimeSlots
} from '../models/Appointment';

export class AppointmentService {
  private storageService: StorageService;

  constructor() {
    this.storageService = StorageService;
  }

  // CRUD Operations
  async getAllAppointments(): Promise<Appointment[]> {
    return await this.storageService.getAppointments();
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const appointments = await this.getAllAppointments();
    return appointments.find(appointment => appointment.id === id) || null;
  }

  async createAppointment(appointmentData: AppointmentFormData): Promise<Appointment> {
    const errors = validateAppointmentData(appointmentData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check for time slot conflicts
    const appointments = await this.getAllAppointments();
    const hasConflict = checkTimeSlotConflict(
      appointments,
      appointmentData.doctorId,
      appointmentData.date,
      appointmentData.time,
      appointmentData.duration
    );

    if (hasConflict) {
      throw new Error('Time slot is already booked for this doctor');
    }

    const newAppointment: Appointment = {
      ...createEmptyAppointment(),
      ...appointmentData,
      id: generateAppointmentId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    await this.storageService.saveAppointments(appointments);
    
    return newAppointment;
  }

  async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<Appointment> {
    const appointments = await this.getAllAppointments();
    const appointmentIndex = appointments.findIndex(appointment => appointment.id === id);
    
    if (appointmentIndex === -1) {
      throw new Error('Appointment not found');
    }

    const currentAppointment = appointments[appointmentIndex];
    const updatedData = { ...currentAppointment, ...appointmentData };
    
    const errors = validateAppointmentData(updatedData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check for time slot conflicts (excluding current appointment)
    if (appointmentData.date || appointmentData.time || appointmentData.duration || appointmentData.doctorId) {
      const hasConflict = checkTimeSlotConflict(
        appointments,
        appointmentData.doctorId || currentAppointment.doctorId,
        appointmentData.date || currentAppointment.date,
        appointmentData.time || currentAppointment.time,
        appointmentData.duration || currentAppointment.duration,
        id
      );

      if (hasConflict) {
        throw new Error('Time slot is already booked for this doctor');
      }
    }

    appointments[appointmentIndex] = {
      ...currentAppointment,
      ...appointmentData,
      updatedAt: new Date().toISOString(),
    };

    await this.storageService.saveAppointments(appointments);
    
    return appointments[appointmentIndex];
  }

  async deleteAppointment(id: string): Promise<void> {
    const appointments = await this.getAllAppointments();
    const filteredAppointments = appointments.filter(appointment => appointment.id !== id);
    
    if (filteredAppointments.length === appointments.length) {
      throw new Error('Appointment not found');
    }

    await this.storageService.saveAppointments(filteredAppointments);
  }

  // Status management
  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updateData: Partial<Appointment> = { status };

    // Add timestamps for status changes
    switch (status) {
      case 'checked-in':
        updateData.checkedInAt = new Date().toISOString();
        break;
      case 'in-progress':
        updateData.startedAt = new Date().toISOString();
        break;
      case 'completed':
        updateData.completedAt = new Date().toISOString();
        break;
    }

    return await this.updateAppointment(id, updateData);
  }

  // Query methods
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    return appointments.filter(appointment => appointment.date === date);
  }

  async getAppointmentsByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    let filtered = appointments.filter(appointment => appointment.doctorId === doctorId);
    
    if (date) {
      filtered = filtered.filter(appointment => appointment.date === date);
    }
    
    return filtered;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    return appointments.filter(appointment => appointment.patientId === patientId);
  }

  async getAppointmentsByStatus(status: Appointment['status']): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    return appointments.filter(appointment => appointment.status === status);
  }

  // Doctor availability
  async getDoctorAvailability(doctorId: string, date: string): Promise<DoctorAvailability> {
    const appointments = await this.getAppointmentsByDoctor(doctorId, date);
    const timeSlots = generateTimeSlots('09:00', '17:00', 30);
    
    // Mark time slots as unavailable if they have appointments
    const updatedTimeSlots = timeSlots.map(slot => {
      const hasAppointment = appointments.some(apt => {
        if (apt.status === 'cancelled') return false;
        
        const appointmentTime = new Date(`${apt.date}T${apt.time}`);
        const slotTime = new Date(`${date}T${slot.time}`);
        const slotEnd = new Date(slotTime.getTime() + 30 * 60000);
        
        return (
          slotTime >= appointmentTime && 
          slotTime < new Date(appointmentTime.getTime() + apt.duration * 60000)
        );
      });
      
      return {
        ...slot,
        available: !hasAppointment,
      };
    });

    return {
      doctorId,
      date,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: updatedTimeSlots.some(slot => slot.available),
      timeSlots: updatedTimeSlots,
    };
  }

  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const availability = await this.getDoctorAvailability(doctorId, date);
    return availability.timeSlots.filter(slot => slot.available);
  }

  // Statistics
  async getAppointmentStatistics(): Promise<{
    totalAppointments: number;
    todayAppointments: number;
    completedToday: number;
    cancelledToday: number;
    appointmentsByStatus: { [key: string]: number };
    appointmentsByDoctor: { [key: string]: number };
  }> {
    const appointments = await this.getAllAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    const todayAppointments = appointments.filter(apt => apt.date === today);
    const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
    const cancelledToday = todayAppointments.filter(apt => apt.status === 'cancelled').length;

    const appointmentsByStatus = appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const appointmentsByDoctor = appointments.reduce((acc, appointment) => {
      const doctorName = appointment.doctorName || `Doctor ${appointment.doctorId}`;
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      completedToday,
      cancelledToday,
      appointmentsByStatus,
      appointmentsByDoctor,
    };
  }

  // Queue management
  async getPatientQueue(doctorId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await this.getAppointmentsByDoctor(doctorId, today);
    
    // Return appointments that are checked-in or in-progress, sorted by time
    return appointments
      .filter(apt => apt.status === 'checked-in' || apt.status === 'in-progress')
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async getNextPatient(doctorId: string): Promise<Appointment | null> {
    const queue = await this.getPatientQueue(doctorId);
    return queue.length > 0 ? queue[0] : null;
  }

  // Search functionality
  async searchAppointments(query: string): Promise<Appointment[]> {
    if (!query.trim()) {
      return [];
    }

    const appointments = await this.getAllAppointments();
    const searchTerm = query.toLowerCase().trim();
    
    return appointments.filter(appointment => {
      const searchableFields = [
        appointment.patientFirstName,
        appointment.patientLastName,
        appointment.doctorName,
        appointment.reason,
        appointment.notes,
        appointment.id,
      ];

      return searchableFields.some(field => 
        field && field.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Recent appointments
  async getRecentAppointments(limit: number = 10): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    return appointments
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // Bulk operations
  async bulkUpdateStatus(appointmentIds: string[], status: Appointment['status']): Promise<Appointment[]> {
    const updatedAppointments: Appointment[] = [];
    
    for (const id of appointmentIds) {
      try {
        const updated = await this.updateAppointmentStatus(id, status);
        updatedAppointments.push(updated);
      } catch (error) {
        console.error(`Failed to update appointment ${id}:`, error);
      }
    }
    
    return updatedAppointments;
  }

  // Export/Import
  async exportAppointments(): Promise<string> {
    const appointments = await this.getAllAppointments();
    return JSON.stringify(appointments, null, 2);
  }

  async importAppointments(jsonData: string): Promise<Appointment[]> {
    try {
      const importedAppointments = JSON.parse(jsonData);
      if (!Array.isArray(importedAppointments)) {
        throw new Error('Invalid data format');
      }

      const appointments = await this.getAllAppointments();
      const newAppointments = importedAppointments.map(appointment => ({
        ...appointment,
        id: appointment.id || generateAppointmentId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      appointments.push(...newAppointments);
      await this.storageService.saveAppointments(appointments);
      
      return newAppointments;
    } catch (error) {
      throw new Error('Failed to import appointments: ' + error);
    }
  }
}

export default new AppointmentService();
