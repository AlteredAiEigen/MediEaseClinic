const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const ClinicalNote = require('../../models/ClinicalNote');
const Recording = require('../../models/Recording');

// Test data factories
const createTestUser = async (overrides = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  const defaultData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${timestamp}-${randomId}@example.com`,
    password: 'Test@123',
    role: 'admin',
    phone: '+1234567890'
  };

  // Add role-specific required fields
  if (overrides.role === 'doctor' || defaultData.role === 'doctor') {
    defaultData.licenseNumber = `DOC${timestamp}`;
    defaultData.speciality = 'General Medicine';
  }

  const userData = { ...defaultData, ...overrides };
  
  const user = new User(userData);
  await user.save();
  return user;
};

const createTestPatient = async (overrides = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  const patientData = {
    patientId: `PAT${timestamp}${randomId}`,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    age: '30',
    bloodGroup: 'A+',
    dateOfBirth: '1993-01-01',
    email: `john.doe.${timestamp}@example.com`,
    phone: '+1234567890',
    address: '123 Test St, Test City, TC 12345',
    medicalHistory: 'No known allergies',
    allergies: 'None',
    familyHistory: 'None',
    currentMedication: 'None',
    ...overrides
  };
  
  const patient = new Patient(patientData);
  await patient.save();
  return patient;
};

const createTestAppointment = async (patientId, doctorId, overrides = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  const appointmentData = {
    appointmentId: `APT${timestamp}${randomId}`,
    patient: patientId,
    doctor: doctorId,
    scheduledBy: doctorId,
    date: '2024-12-31',
    time: '10:00',
    appointmentDate: '2024-12-31',
    appointmentTime: '10:00',
    duration: 30,
    status: 'scheduled',
    priority: 'medium',
    reason: 'Regular checkup',
    notes: 'Test appointment',
    ...overrides
  };
  
  const appointment = new Appointment(appointmentData);
  await appointment.save();
  return appointment;
};

const createTestClinicalNote = async (patientId, doctorId, appointmentId, overrides = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  const noteData = {
    noteId: `NOTE${timestamp}${randomId}`,
    patient: patientId,
    doctor: doctorId,
    appointment: appointmentId,
    type: 'general',
    title: 'Test Consultation',
    content: 'Patient presented with test symptoms',
    priority: 'medium',
    timestamp: '10:30',
    ...overrides
  };
  
  const note = new ClinicalNote(noteData);
  await note.save();
  return note;
};

const createTestRecording = async (patientId, doctorId, appointmentId, overrides = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  const recordingData = {
    recordingId: `REC${timestamp}${randomId}`,
    patient: patientId,
    doctor: doctorId,
    appointment: appointmentId,
    duration: 1800, // 30 minutes
    filePath: '/uploads/test-recording.mp3',
    fileName: 'test-recording.mp3',
    fileSize: 1024000,
    mimeType: 'audio/mpeg',
    transcription: 'Test transcription',
    status: 'completed',
    ...overrides
  };
  
  const recording = new Recording(recordingData);
  await recording.save();
  return recording;
};

// Generate JWT token for testing
const generateAuthToken = (userId, role = 'admin') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Create authenticated request headers
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Wait for async operations
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clean up test data
const cleanupTestData = async () => {
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Appointment.deleteMany({});
  await ClinicalNote.deleteMany({});
  await Recording.deleteMany({});
};

// Mock external services
const mockExternalServices = () => {
  // Mock console methods to avoid noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
};

// Restore mocks
const restoreMocks = () => {
  jest.restoreAllMocks();
};

module.exports = {
  createTestUser,
  createTestPatient,
  createTestAppointment,
  createTestClinicalNote,
  createTestRecording,
  generateAuthToken,
  getAuthHeaders,
  waitFor,
  cleanupTestData,
  mockExternalServices,
  restoreMocks
};
