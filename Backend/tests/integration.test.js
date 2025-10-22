const request = require('supertest');
const app = require('../server');
const { 
  createTestUser, 
  createTestPatient, 
  createTestAppointment,
  createTestClinicalNote,
  createTestRecording,
  generateAuthToken, 
  getAuthHeaders, 
  cleanupTestData 
} = require('./helpers/testHelpers');

describe('Integration Tests', () => {
  let adminToken, doctorToken, receptionistToken, patient, doctor, receptionist;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const admin = await createTestUser({ role: 'admin' });
    doctor = await createTestUser({ role: 'doctor' });
    receptionist = await createTestUser({ role: 'receptionist' });
    
    adminToken = generateAuthToken(admin._id, admin.role);
    doctorToken = generateAuthToken(doctor._id, doctor.role);
    receptionistToken = generateAuthToken(receptionist._id, receptionist.role);
    
    // Create test patient
    patient = await createTestPatient();
  });

  describe('Complete Patient Workflow', () => {
    it('should handle complete patient lifecycle', async () => {
      // 1. Create patient
      const patientData = {
        firstName: 'Integration',
        lastName: 'Test',
        gender: 'Female',
        age: '28',
        bloodGroup: 'O+',
        dateOfBirth: '1995-06-15',
        email: 'integration.test@example.com',
        phone: '+1555123456',
        address: '123 Integration St, Test City, TC 12345',
        medicalHistory: 'No known allergies',
        allergies: 'None',
        familyHistory: 'None',
        currentMedication: 'None'
      };

      const createResponse = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdPatient = createResponse.body.data.patient;

      // 2. Search for patient
      const searchResponse = await request(app)
        .get('/api/patients/search?q=Integration')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.patients).toHaveLength(1);

      // 3. Update patient
      const updateResponse = await request(app)
        .put(`/api/patients/${createdPatient._id}`)
        .set(getAuthHeaders(adminToken))
        .send({ phone: '+1555987654' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.patient.phone).toBe('+1555987654');

      // 4. Get patient details
      const getResponse = await request(app)
        .get(`/api/patients/${createdPatient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.patient._id).toBe(createdPatient._id.toString());
    });
  });

  describe('Complete Appointment Workflow', () => {
    it('should handle complete appointment lifecycle', async () => {
      // 1. Create appointment
      const appointmentData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: '2024-12-25',
        appointmentTime: '10:00',
        duration: 30,
        type: 'consultation',
        reason: 'Integration test appointment',
        notes: 'Test appointment for integration testing'
      };

      const createResponse = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(receptionistToken))
        .send(appointmentData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdAppointment = createResponse.body.data.appointment;

      // 2. Update appointment status to checked-in
      const checkInResponse = await request(app)
        .put(`/api/appointments/${createdAppointment._id}/status`)
        .set(getAuthHeaders(receptionistToken))
        .send({ status: 'checked-in' })
        .expect(200);

      expect(checkInResponse.body.success).toBe(true);
      expect(checkInResponse.body.data.appointment.status).toBe('checked-in');

      // 3. Update appointment status to in-progress
      const inProgressResponse = await request(app)
        .put(`/api/appointments/${createdAppointment._id}/status`)
        .set(getAuthHeaders(doctorToken))
        .send({ status: 'in-progress' })
        .expect(200);

      expect(inProgressResponse.body.success).toBe(true);
      expect(inProgressResponse.body.data.appointment.status).toBe('in-progress');

      // 4. Update appointment status to completed
      const completedResponse = await request(app)
        .put(`/api/appointments/${createdAppointment._id}/status`)
        .set(getAuthHeaders(doctorToken))
        .send({ status: 'completed' })
        .expect(200);

      expect(completedResponse.body.success).toBe(true);
      expect(completedResponse.body.data.appointment.status).toBe('completed');
    });
  });

  describe('Complete Clinical Notes Workflow', () => {
    it('should handle complete clinical notes lifecycle', async () => {
      // 1. Create clinical note
      const noteData = {
        patientId: patient._id,
        doctorId: doctor._id,
        title: 'Integration Test Consultation',
        content: 'Patient presented with test symptoms for integration testing',
        category: 'consultation',
        priority: 'medium',
        isActionable: true,
        actionItems: ['Follow up in 1 week', 'Order lab tests']
      };

      const createResponse = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdNote = createResponse.body.data.note;

      // 2. Update clinical note
      const updateResponse = await request(app)
        .put(`/api/clinical-notes/${createdNote._id}`)
        .set(getAuthHeaders(doctorToken))
        .send({ 
          content: 'Updated content for integration testing',
          priority: 'high'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.note.priority).toBe('high');

      // 3. Mark note as complete
      const completeResponse = await request(app)
        .put(`/api/clinical-notes/${createdNote._id}/complete`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.note.isCompleted).toBe(true);

      // 4. Get actionable notes
      const actionableResponse = await request(app)
        .get('/api/clinical-notes/actionable')
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(actionableResponse.body.success).toBe(true);
      expect(actionableResponse.body.data.notes).toHaveLength(1);
    });
  });

  describe('Complete Recording Workflow', () => {
    it('should handle complete recording lifecycle', async () => {
      // 1. Create recording
      const recordingData = {
        patientId: patient._id,
        doctorId: doctor._id,
        duration: 1800, // 30 minutes
        transcription: 'Integration test transcription',
        notes: 'Test recording for integration testing',
        status: 'completed'
      };

      const createResponse = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdRecording = createResponse.body.data.recording;

      // 2. Process recording
      const processResponse = await request(app)
        .post(`/api/recordings/${createdRecording._id}/process`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.data.recording.status).toBe('processed');

      // 3. Update recording
      const updateResponse = await request(app)
        .put(`/api/recordings/${createdRecording._id}`)
        .set(getAuthHeaders(doctorToken))
        .send({ 
          transcription: 'Updated transcription for integration testing',
          notes: 'Updated notes'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.recording.transcription).toBe('Updated transcription for integration testing');

      // 4. Get recordings by patient
      const patientRecordingsResponse = await request(app)
        .get(`/api/recordings/patient/${patient._id}`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(patientRecordingsResponse.body.success).toBe(true);
      expect(patientRecordingsResponse.body.data.recordings).toHaveLength(1);
    });
  });

  describe('Admin Dashboard Integration', () => {
    it('should provide comprehensive admin dashboard data', async () => {
      // Create test data
      await createTestAppointment(patient._id, doctor._id);
      await createTestClinicalNote(patient._id, doctor._id);
      await createTestRecording(patient._id, doctor._id);

      // Get dashboard data
      const dashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.data.totalPatients).toBe(1);
      expect(dashboardResponse.body.data.totalAppointments).toBe(1);
      expect(dashboardResponse.body.data.totalClinicalNotes).toBe(1);
      expect(dashboardResponse.body.data.totalRecordings).toBe(1);
    });

    it('should provide system statistics', async () => {
      // Create test data
      await createTestAppointment(patient._id, doctor._id);
      await createTestClinicalNote(patient._id, doctor._id);
      await createTestRecording(patient._id, doctor._id);

      // Get statistics
      const statsResponse = await request(app)
        .get('/api/admin/stats')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.patients).toBeDefined();
      expect(statsResponse.body.data.appointments).toBeDefined();
      expect(statsResponse.body.data.clinicalNotes).toBeDefined();
      expect(statsResponse.body.data.recordings).toBeDefined();
      expect(statsResponse.body.data.users).toBeDefined();
    });
  });

  describe('Cross-Role Access Control', () => {
    it('should enforce role-based access control', async () => {
      // Doctor should not access admin endpoints
      const doctorAdminResponse = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(doctorAdminResponse.body.success).toBe(false);

      // Receptionist should not access doctor-specific endpoints
      const receptionistDoctorResponse = await request(app)
        .get('/api/doctors/stats')
        .set(getAuthHeaders(receptionistToken))
        .expect(403);

      expect(receptionistDoctorResponse.body.success).toBe(false);

      // Admin should access all endpoints
      const adminPatientsResponse = await request(app)
        .get('/api/patients')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(adminPatientsResponse.body.success).toBe(true);

      const adminAppointmentsResponse = await request(app)
        .get('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(adminAppointmentsResponse.body.success).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create appointment
      const appointmentData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: '2024-12-25',
        appointmentTime: '10:00',
        duration: 30,
        type: 'consultation',
        reason: 'Data consistency test'
      };

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(receptionistToken))
        .send(appointmentData)
        .expect(201);

      const appointment = appointmentResponse.body.data.appointment;

      // Create clinical note for the appointment
      const noteData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        title: 'Data Consistency Test Note',
        content: 'Note for data consistency testing',
        category: 'consultation',
        priority: 'medium'
      };

      const noteResponse = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(201);

      // Create recording for the appointment
      const recordingData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        duration: 1800,
        transcription: 'Data consistency test transcription',
        status: 'completed'
      };

      const recordingResponse = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(201);

      // Verify all data is linked correctly
      expect(noteResponse.body.data.note.patient).toBe(patient._id.toString());
      expect(noteResponse.body.data.note.doctor).toBe(doctor._id.toString());
      expect(recordingResponse.body.data.recording.patient).toBe(patient._id.toString());
      expect(recordingResponse.body.data.recording.doctor).toBe(doctor._id.toString());
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle errors gracefully and maintain system stability', async () => {
      // Test with invalid data
      const invalidPatientData = {
        firstName: 'Test',
        // Missing required fields
      };

      const invalidResponse = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(invalidPatientData)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.message).toBe('Validation failed');

      // System should still be functional after error
      const validResponse = await request(app)
        .get('/api/patients')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(validResponse.body.success).toBe(true);
    });
  });
});
