const request = require('supertest');
const app = require('../server');
const { 
  createTestUser, 
  createTestPatient, 
  createTestAppointment,
  createTestRecording,
  generateAuthToken, 
  getAuthHeaders, 
  cleanupTestData 
} = require('./helpers/testHelpers');

describe('Recording Management API', () => {
  let adminToken, doctorToken, patient, doctor, appointment, recording;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const admin = await createTestUser({ role: 'admin' });
    doctor = await createTestUser({ role: 'doctor' });
    
    adminToken = generateAuthToken(admin._id, admin.role);
    doctorToken = generateAuthToken(doctor._id, doctor.role);
    
    // Create test patient
    patient = await createTestPatient();
    
    // Create test appointment
    appointment = await createTestAppointment(patient._id, doctor._id);
    
    // Create test recording
    recording = await createTestRecording(patient._id, doctor._id, appointment._id);
  });

  describe('GET /api/recordings', () => {
    it('should get all recordings for admin', async () => {
      const response = await request(app)
        .get('/api/recordings')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
      expect(response.body.data.recordings[0].duration).toBe(1800);
    });

    it('should get recordings for doctor', async () => {
      const response = await request(app)
        .get('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
    });

    it('should support pagination', async () => {
      // Create multiple recordings
      for (let i = 0; i < 5; i++) {
        await createTestRecording(patient._id, doctor._id, appointment._id, {
          duration: 1800 + (i * 100)
        });
      }

      const response = await request(app)
        .get('/api/recordings?page=1&limit=3')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/recordings?status=completed')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/recordings')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/recordings/patient/:patientId', () => {
    it('should get recordings by patient', async () => {
      const response = await request(app)
        .get(`/api/recordings/patient/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
      expect(response.body.data.recordings[0].patient._id).toBe(patient._id.toString());
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/recordings/patient/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });
  });

  describe('GET /api/recordings/doctor/:doctorId', () => {
    it('should get recordings by doctor', async () => {
      const response = await request(app)
        .get(`/api/recordings/doctor/${doctor._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
      expect(response.body.data.recordings[0].doctor._id).toBe(doctor._id.toString());
    });

    it('should return 404 for non-existent doctor', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/recordings/doctor/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Doctor not found');
    });
  });

  describe('GET /api/recordings/:id', () => {
    it('should get single recording by ID', async () => {
      const response = await request(app)
        .get(`/api/recordings/${recording._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recording._id).toBe(recording._id.toString());
      expect(response.body.data.recording.duration).toBe(1800);
    });

    it('should return 404 for non-existent recording', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/recordings/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Recording not found');
    });
  });

  describe('POST /api/recordings', () => {
    it('should create new recording with valid data', async () => {
      const recordingData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        duration: 2400, // 40 minutes
        filePath: '/uploads/test-recording.mp3',
        fileName: 'test-recording.mp3',
        fileSize: 2048000,
        mimeType: 'audio/mpeg',
        transcription: 'Test transcription content',
        status: 'completed'
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Recording created successfully');
      expect(response.body.data.recording.duration).toBe(recordingData.duration);
      expect(response.body.data.recording.transcription).toBe(recordingData.transcription);
    });

    it('should validate required fields', async () => {
      const recordingData = {
        duration: 1800,
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate patient exists', async () => {
      const fakePatientId = '507f1f77bcf86cd799439011';
      const recordingData = {
        patientId: fakePatientId,
        doctorId: doctor._id,
        duration: 1800
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should validate doctor exists', async () => {
      const fakeDoctorId = '507f1f77bcf86cd799439011';
      const recordingData = {
        patientId: patient._id,
        doctorId: fakeDoctorId,
        duration: 1800
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Doctor not found');
    });

    it('should validate duration is positive', async () => {
      const recordingData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        filePath: '/uploads/test-recording.mp3',
        fileName: 'test-recording.mp3',
        fileSize: 1024000,
        mimeType: 'audio/mpeg',
        duration: -100 // Negative duration
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate status values', async () => {
      const recordingData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        filePath: '/uploads/test-recording.mp3',
        fileName: 'test-recording.mp3',
        fileSize: 1024000,
        mimeType: 'audio/mpeg',
        duration: 1800,
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/api/recordings')
        .set(getAuthHeaders(doctorToken))
        .send(recordingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/recordings/:id', () => {
    it('should update recording with valid data', async () => {
      const updateData = {
        transcription: 'Updated transcription',
        notes: 'Updated notes',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/recordings/${recording._id}`)
        .set(getAuthHeaders(doctorToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Recording updated successfully');
      expect(response.body.data.recording.transcription).toBe(updateData.transcription);
      expect(response.body.data.recording.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent recording', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        transcription: 'Updated'
      };

      const response = await request(app)
        .put(`/api/recordings/${fakeId}`)
        .set(getAuthHeaders(doctorToken))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Recording not found');
    });
  });

  describe('POST /api/recordings/:id/process', () => {
    it('should process recording successfully', async () => {
      const response = await request(app)
        .post(`/api/recordings/${recording._id}/process`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Recording processing started');
      expect(response.body.data.recording.status).toBe('processing');
    });

    it('should return 404 for non-existent recording', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/recordings/${fakeId}/process`)
        .set(getAuthHeaders(doctorToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Recording not found');
    });

    it('should handle processing errors gracefully', async () => {
      // Create a recording with invalid data that might cause processing to fail
      const invalidRecording = await createTestRecording(patient._id, doctor._id, appointment._id, {
        status: 'failed'
      });

      const response = await request(app)
        .post(`/api/recordings/${invalidRecording._id}/process`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/recordings/:id', () => {
    it('should delete recording successfully', async () => {
      const response = await request(app)
        .delete(`/api/recordings/${recording._id}`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Recording deleted successfully');
    });

    it('should return 404 for non-existent recording', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/recordings/${fakeId}`)
        .set(getAuthHeaders(doctorToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Recording not found');
    });
  });
});
