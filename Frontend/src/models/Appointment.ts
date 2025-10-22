export type AppointmentStatus = 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentPriority = 'low' | 'medium' | 'high';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // in minutes
  status: AppointmentStatus;
  priority: AppointmentPriority;
  reason: string;
  notes: string;
  patientFirstName?: string;
  patientLastName?: string;
  doctorName?: string;
  patientPhone?: string;
  presentInClinic?: boolean;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

export interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  priority: AppointmentPriority;
  notes: string;
}

export const createEmptyAppointment = (): Appointment => ({
  id: '',
  patientId: '',
  doctorId: '',
  date: '',
  time: '',
  duration: 30,
  status: 'scheduled',
  priority: 'medium',
  reason: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateAppointmentId = (): string => {
  const prefix = 'APT';
  const timestamp = Date.now().toString().slice(-8);
  return `${prefix}${timestamp}`;
};

export const validateAppointmentData = (appointment: Partial<Appointment>): string[] => {
  const errors: string[] = [];
  
  if (!appointment.patientId?.trim()) errors.push('Patient is required');
  if (!appointment.doctorId?.trim()) errors.push('Doctor is required');
  if (!appointment.date?.trim()) errors.push('Date is required');
  if (!appointment.time?.trim()) errors.push('Time is required');
  if (!appointment.reason?.trim()) errors.push('Reason is required');
  
  // Date validation
  if (appointment.date) {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      errors.push('Appointment date cannot be in the past');
    }
  }
  
  // Time validation
  if (appointment.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(appointment.time)) {
    errors.push('Invalid time format (use HH:MM)');
  }
  
  return errors;
};

export const formatAppointmentTime = (appointment: Appointment): string => {
  const time = appointment.time;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatAppointmentDate = (date: string): string => {
  const appointmentDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (appointmentDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

export const getAppointmentStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case 'scheduled':
      return '#3B82F6'; // Blue
    case 'checked-in':
      return '#F59E0B'; // Amber
    case 'in-progress':
      return '#8B5CF6'; // Purple
    case 'completed':
      return '#10B981'; // Green
    case 'cancelled':
      return '#EF4444'; // Red
    case 'no-show':
      return '#6B7280'; // Gray
    default:
      return '#6B7280';
  }
};

export const getAppointmentStatusLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'checked-in':
      return 'Checked In';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no-show':
      return 'No Show';
    default:
      return 'Unknown';
  }
};

export const getPriorityColor = (priority: AppointmentPriority): string => {
  switch (priority) {
    case 'high':
      return '#EF4444'; // Red
    case 'medium':
      return '#F59E0B'; // Amber
    case 'low':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

export const getPriorityLabel = (priority: AppointmentPriority): string => {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Standard';
    default:
      return 'Unknown';
  }
};

export const generateTimeSlots = (startTime: string, endTime: string, duration: number = 30): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5);
    slots.push({
      time: timeString,
      available: true,
    });
    
    current.setMinutes(current.getMinutes() + duration);
  }
  
  return slots;
};

export const checkTimeSlotConflict = (
  appointments: Appointment[],
  doctorId: string,
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: string
): boolean => {
  const appointmentTime = new Date(`${date}T${time}`);
  const appointmentEnd = new Date(appointmentTime.getTime() + duration * 60000);
  
  return appointments.some(apt => {
    if (apt.id === excludeAppointmentId) return false;
    if (apt.doctorId !== doctorId) return false;
    if (apt.date !== date) return false;
    if (apt.status === 'cancelled') return false;
    
    const existingTime = new Date(`${apt.date}T${apt.time}`);
    const existingEnd = new Date(existingTime.getTime() + apt.duration * 60000);
    
    return (
      (appointmentTime >= existingTime && appointmentTime < existingEnd) ||
      (appointmentEnd > existingTime && appointmentEnd <= existingEnd) ||
      (appointmentTime <= existingTime && appointmentEnd >= existingEnd)
    );
  });
};
