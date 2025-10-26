const request = require('supertest');
const app = require('../server');
const ClinicalNote = require('../models/ClinicalNote');
const {
  createTestUser,
  createTestPatient,
  createTestAppointment,
  createTestClinicalNote,
  generateAuthToken,
  getAuthHeaders,
  cleanupTestData
} = require('./helpers/testHelpers');

describe('Clinical Notes API', () => {
  let adminToken, doctorToken, patient, doctor, appointment, clinicalNote;

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
    
    // Create test clinical note
    clinicalNote = await createTestClinicalNote(patient._id, doctor._id, appointment._id);
  });

  describe('GET /api/clinical-notes', () => {
    it('should get all clinical notes for admin', async () => {
      const response = await request(app)
        .get('/api/clinical-notes')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
      expect(response.body.data.notes[0].title).toBe('Test Consultation');
    });

    it('should get clinical notes for doctor', async () => {
      const response = await request(app)
        .get('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
    });

    it('should support pagination', async () => {
      // Create multiple notes
      for (let i = 0; i < 5; i++) {
        await createTestClinicalNote(patient._id, doctor._id, appointment._id, {
          title: `Note ${i}`
        });
      }

      const response = await request(app)
        .get('/api/clinical-notes?page=1&limit=3')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by patient', async () => {
      const response = await request(app)
        .get(`/api/clinical-notes?patientId=${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/clinical-notes?category=consultation')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/clinical-notes?priority=medium')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/clinical-notes')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/clinical-notes/actionable', () => {
    it('should get only actionable notes', async () => {
      // Clean up existing notes first
      await ClinicalNote.deleteMany({});

      // Create an actionable note
      const actionableNote = await createTestClinicalNote(patient._id, doctor._id, appointment._id, {
        title: 'Actionable Note',
        actionable: true
      });

      // Create a non-actionable note
      await createTestClinicalNote(patient._id, doctor._id, appointment._id, {
        title: 'Non-actionable Note',
        actionable: false
      });

      const response = await request(app)
        .get('/api/clinical-notes/actionable')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
      expect(response.body.data.notes[0].actionable).toBe(true);
      expect(response.body.data.notes[0].title).toBe('Actionable Note');
    });
  });

  describe('POST /api/clinical-notes/generate', () => {
    it('should generate notes from consultation data', async () => {
      const consultationData = {
        patientId: patient._id,
        doctorId: doctor._id,
        consultationDuration: 1800,
        symptoms: 'Fever, headache',
        diagnosis: 'Common cold',
        treatment: 'Rest and fluids',
        followUp: 'Return if symptoms worsen'
      };

      const response = await request(app)
        .post('/api/clinical-notes/generate')
        .set(getAuthHeaders(doctorToken))
        .send(consultationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical notes generated successfully');
      expect(response.body.data.notes).toBeInstanceOf(Array);
      expect(response.body.data.notes.length).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const consultationData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/clinical-notes/generate')
        .set(getAuthHeaders(doctorToken))
        .send(consultationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/clinical-notes/:id', () => {
    it('should get single clinical note by ID', async () => {
      const response = await request(app)
        .get(`/api/clinical-notes/${clinicalNote._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note._id).toBe(clinicalNote._id.toString());
      expect(response.body.data.note.title).toBe('Test Consultation');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/clinical-notes/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clinical note not found');
    });
  });

  describe('POST /api/clinical-notes', () => {
    it('should create new clinical note with valid data', async () => {
      const noteData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        title: 'New Consultation',
        content: 'Patient presented with new symptoms',
        category: 'diagnosis',
        priority: 'high',
        isActionable: true,
        actionItems: ['Schedule follow-up', 'Order lab tests']
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical note created successfully');
      expect(response.body.data.note.title).toBe(noteData.title);
      expect(response.body.data.note.category).toBe(noteData.category);
    });

    it('should validate required fields', async () => {
      const noteData = {
        title: 'New Note',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate patient exists', async () => {
      const fakePatientId = '507f1f77bcf86cd799439011';
      const noteData = {
        patientId: fakePatientId,
        doctorId: doctor._id,
        title: 'New Note',
        content: 'Test content',
        category: 'consultation',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should validate doctor exists', async () => {
      const fakeDoctorId = '507f1f77bcf86cd799439011';
      const noteData = {
        patientId: patient._id,
        doctorId: fakeDoctorId,
        title: 'New Note',
        content: 'Test content',
        category: 'consultation',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Doctor not found');
    });

    it('should validate category values', async () => {
      const noteData = {
        patientId: patient._id,
        doctorId: doctor._id,
        title: 'New Note',
        content: 'Test content',
        category: 'invalid-category',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate priority values', async () => {
      const noteData = {
        patientId: patient._id,
        doctorId: doctor._id,
        title: 'New Note',
        content: 'Test content',
        category: 'consultation',
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/clinical-notes/:id', () => {
    it('should update clinical note with valid data', async () => {
      const updateData = {
        title: 'Updated Consultation',
        content: 'Updated content',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/clinical-notes/${clinicalNote._id}`)
        .set(getAuthHeaders(doctorToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical note updated successfully');
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated'
      };

      const response = await request(app)
        .put(`/api/clinical-notes/${fakeId}`)
        .set(getAuthHeaders(doctorToken))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clinical note not found');
    });
  });

  describe('PUT /api/clinical-notes/:id/complete', () => {
    it('should mark note as complete', async () => {
      const response = await request(app)
        .put(`/api/clinical-notes/${clinicalNote._id}/complete`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical note marked as complete');
      expect(response.body.data.note.completed).toBe(true);
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/clinical-notes/${fakeId}/complete`)
        .set(getAuthHeaders(doctorToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clinical note not found');
    });
  });

  describe('DELETE /api/clinical-notes/:id', () => {
    it('should delete clinical note successfully', async () => {
      const response = await request(app)
        .delete(`/api/clinical-notes/${clinicalNote._id}`)
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Clinical note deleted successfully');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/clinical-notes/${fakeId}`)
        .set(getAuthHeaders(doctorToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Clinical note not found');
    });
  });
});
