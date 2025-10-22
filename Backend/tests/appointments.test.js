const request = require('supertest');
const app = require('../server');
const { 
  createTestUser, 
  createTestPatient, 
  createTestAppointment,
  generateAuthToken, 
  getAuthHeaders, 
  cleanupTestData 
} = require('./helpers/testHelpers');

describe('Appointment Management API', () => {
  let adminToken, doctorToken, receptionistToken, patient, doctor, appointment;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const admin = await createTestUser({ role: 'admin' });
    doctor = await createTestUser({ role: 'doctor' });
    const receptionist = await createTestUser({ role: 'receptionist' });
    
    adminToken = generateAuthToken(admin._id, admin.role);
    doctorToken = generateAuthToken(doctor._id, doctor.role);
    receptionistToken = generateAuthToken(receptionist._id, receptionist.role);
    
    // Create test patient
    patient = await createTestPatient();
    
    // Create test appointment
    appointment = await createTestAppointment(patient._id, doctor._id);
  });

  describe('GET /api/appointments', () => {
    it('should get all appointments for admin', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].reason).toBe('Regular checkup');
    });

    it('should get appointments for doctor', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should support pagination', async () => {
      // Create multiple appointments
      for (let i = 0; i < 5; i++) {
        await createTestAppointment(patient._id, doctor._id, {
          reason: `Appointment ${i}`
        });
      }

      const response = await request(app)
        .get('/api/appointments?page=1&limit=3')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/appointments?startDate=2024-01-01&endDate=2024-12-31')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments/stats', () => {
    it('should get appointment statistics', async () => {
      const response = await request(app)
        .get('/api/appointments/stats')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAppointments');
      expect(response.body.data).toHaveProperty('appointmentsToday');
      expect(response.body.data).toHaveProperty('appointmentsByStatus');
    });
  });

  describe('GET /api/appointments/availability/:doctorId', () => {
    it('should get doctor availability', async () => {
      const response = await request(app)
        .get(`/api/appointments/availability/${doctor._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('availableSlots');
      expect(response.body.data).toHaveProperty('unavailableSlots');
    });

    it('should return 404 for non-existent doctor', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/appointments/availability/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Doctor not found');
    });
  });

  describe('GET /api/appointments/date-range', () => {
    it('should get appointments by date range', async () => {
      const response = await request(app)
        .get('/api/appointments/date-range?startDate=2024-01-01&endDate=2024-12-31')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should require start and end dates', async () => {
      const response = await request(app)
        .get('/api/appointments/date-range')
        .set(getAuthHeaders(adminToken))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Start date and end date are required');
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should get single appointment by ID', async () => {
      const response = await request(app)
        .get(`/api/appointments/${appointment._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment._id).toBe(appointment._id.toString());
      expect(response.body.data.appointment.reason).toBe('Regular checkup');
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/appointments/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Appointment not found');
    });
  });

  describe('POST /api/appointments', () => {
    it('should create new appointment with valid data', async () => {
      const appointmentData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: '2024-12-25',
        appointmentTime: '14:00',
        duration: 45,
        type: 'consultation',
        reason: 'Follow-up appointment',
        notes: 'Patient requested follow-up'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment created successfully');
      expect(response.body.data.appointment.reason).toBe(appointmentData.reason);
    });

    it('should validate required fields', async () => {
      const appointmentData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate patient exists', async () => {
      const fakePatientId = '507f1f77bcf86cd799439011';
      const appointmentData = {
        patientId: fakePatientId,
        doctorId: doctor._id,
        appointmentDate: '2024-12-25',
        appointmentTime: '14:00',
        duration: 45,
        type: 'consultation',
        reason: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should validate doctor exists', async () => {
      const fakeDoctorId = '507f1f77bcf86cd799439011';
      const appointmentData = {
        patientId: patient._id,
        doctorId: fakeDoctorId,
        appointmentDate: '2024-12-25',
        appointmentTime: '14:00',
        duration: 45,
        type: 'consultation',
        reason: 'Test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Doctor not found');
    });

    it('should check for scheduling conflicts', async () => {
      // Create an existing appointment at the same time
      await createTestAppointment(patient._id, doctor._id, {
        appointmentDate: '2024-12-25',
        appointmentTime: '14:00'
      });

      const appointmentData = {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: '2024-12-25',
        appointmentTime: '14:00',
        duration: 45,
        type: 'consultation',
        reason: 'Conflicting appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set(getAuthHeaders(adminToken))
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflict');
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment with valid data', async () => {
      const updateData = {
        appointmentTime: '15:00',
        duration: 60,
        reason: 'Updated appointment reason'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment updated successfully');
      expect(response.body.data.appointment.appointmentTime).toBe(updateData.appointmentTime);
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        reason: 'Updated'
      };

      const response = await request(app)
        .put(`/api/appointments/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Appointment not found');
    });
  });

  describe('PUT /api/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      const statusData = {
        status: 'checked-in'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment._id}/status`)
        .set(getAuthHeaders(adminToken))
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment status updated successfully');
      expect(response.body.data.appointment.status).toBe(statusData.status);
    });

    it('should validate status values', async () => {
      const statusData = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment._id}/status`)
        .set(getAuthHeaders(adminToken))
        .send(statusData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('should delete appointment successfully', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointment._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment deleted successfully');
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/appointments/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Appointment not found');
    });
  });
});
