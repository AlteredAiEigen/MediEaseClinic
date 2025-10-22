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

describe('Admin API', () => {
  let adminToken, doctorToken, patient, doctor, appointment, clinicalNote, recording;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const admin = await createTestUser({ role: 'admin' });
    doctor = await createTestUser({ role: 'doctor' });
    
    adminToken = generateAuthToken(admin._id, admin.role);
    doctorToken = generateAuthToken(doctor._id, doctor.role);
    
    // Create test data
    patient = await createTestPatient();
    appointment = await createTestAppointment(patient._id, doctor._id);
    clinicalNote = await createTestClinicalNote(patient._id, doctor._id, appointment._id);
    recording = await createTestRecording(patient._id, doctor._id, appointment._id);
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get admin dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPatients');
      expect(response.body.data).toHaveProperty('totalAppointments');
      expect(response.body.data).toHaveProperty('totalDoctors');
      expect(response.body.data).toHaveProperty('totalClinicalNotes');
      expect(response.body.data).toHaveProperty('totalRecordings');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('appointmentsToday');
      expect(response.body.data).toHaveProperty('patientsThisMonth');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin role required.');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get comprehensive system statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('patients');
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('clinicalNotes');
      expect(response.body.data).toHaveProperty('recordings');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('systemHealth');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2); // admin + doctor
      expect(response.body.data.users[0]).toHaveProperty('_id');
      expect(response.body.data.users[0]).toHaveProperty('email');
      expect(response.body.data.users[0]).toHaveProperty('role');
    });

    it('should support pagination', async () => {
      // Create additional users
      for (let i = 0; i < 5; i++) {
        await createTestUser({
          email: `user${i}@example.com`,
          role: 'receptionist'
        });
      }

      const response = await request(app)
        .get('/api/admin/users?page=1&limit=3')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=doctor')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].role).toBe('doctor');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new user as admin', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'Password@123',
        role: 'receptionist',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
    });

    it('should validate required fields', async () => {
      const userData = {
        firstName: 'New',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should not create user with existing email', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'test@example.com', // Existing email
        password: 'Password@123',
        role: 'receptionist',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should require admin role', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'Password@123',
        role: 'receptionist',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set(getAuthHeaders(doctorToken))
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user as admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210'
      };

      const response = await request(app)
        .put(`/api/admin/users/${doctor._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/admin/users/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should require admin role', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/admin/users/${doctor._id}`)
        .set(getAuthHeaders(doctorToken))
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${doctor._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should not allow admin to delete themselves', async () => {
      // Get admin user ID from token
      const adminUser = await createTestUser({ role: 'admin' });
      const adminTokenForSelf = generateAuthToken(adminUser._id, adminUser.role);

      const response = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set(getAuthHeaders(adminTokenForSelf))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete your own account');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${doctor._id}`)
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/patients', () => {
    it('should get all patients for admin', async () => {
      const response = await request(app)
        .get('/api/admin/patients')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/patients')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/appointments', () => {
    it('should get all appointments for admin', async () => {
      const response = await request(app)
        .get('/api/admin/appointments')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/appointments')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/clinical-notes', () => {
    it('should get all clinical notes for admin', async () => {
      const response = await request(app)
        .get('/api/admin/clinical-notes')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/clinical-notes')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/recordings', () => {
    it('should get all recordings for admin', async () => {
      const response = await request(app)
        .get('/api/admin/recordings')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordings).toHaveLength(1);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/recordings')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
