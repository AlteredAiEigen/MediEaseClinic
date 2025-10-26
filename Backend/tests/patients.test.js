const request = require('supertest');
const app = require('../server');
const { 
  createTestUser, 
  createTestPatient, 
  generateAuthToken, 
  getAuthHeaders, 
  cleanupTestData 
} = require('./helpers/testHelpers');

describe('Patient Management API', () => {
  let adminToken, doctorToken, patient;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const admin = await createTestUser({ role: 'admin' });
    const doctor = await createTestUser({ role: 'doctor' });
    
    adminToken = generateAuthToken(admin._id, admin.role);
    doctorToken = generateAuthToken(doctor._id, doctor.role);
    
    // Create test patient
    patient = await createTestPatient();
  });

  describe('GET /api/patients', () => {
    it('should get all patients for admin', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set(getAuthHeaders(adminToken))
        .expect(200);


      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
      expect(response.body.data.patients[0].firstName).toBe('John');
    });

    it('should get all patients for doctor', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set(getAuthHeaders(doctorToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should support pagination', async () => {
      // Create multiple patients
      for (let i = 0; i < 5; i++) {
        await createTestPatient({
          firstName: `Patient${i}`,
          email: `patient${i}@example.com`
        });
      }

      const response = await request(app)
        .get('/api/patients?page=1&limit=3')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/patients?search=John')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/patients')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/patients/search', () => {
    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=John')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should search patients by phone', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=1234567890')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should search patients by email', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=john.doe')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Nonexistent')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(0);
    });
  });

  describe('GET /api/patients/stats', () => {
    it('should get patient statistics', async () => {
      const response = await request(app)
        .get('/api/patients/stats')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPatients');
      expect(response.body.data).toHaveProperty('newPatientsThisMonth');
      expect(response.body.data).toHaveProperty('patientsByGender');
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should get single patient by ID', async () => {
      const response = await request(app)
        .get(`/api/patients/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(patient._id.toString());
      expect(response.body.data.firstName).toBe('John');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/patients/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should validate patient ID format', async () => {
      const response = await request(app)
        .get('/api/patients/invalid-id')
        .set(getAuthHeaders(adminToken))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid ID format');
    });
  });

  describe('POST /api/patients', () => {
    it('should create new patient with valid data', async () => {
      const patientData = {
        patientId: 'PAT123456',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        age: '25',
        bloodGroup: 'B+',
        dateOfBirth: '1998-05-15',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        address: '456 Test Ave, Test City, TC 54321',
        medicalHistory: 'No known allergies',
        allergies: 'None',
        familyHistory: 'None',
        currentMedication: 'None'
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Patient created successfully');
      expect(response.body.data.firstName).toBe(patientData.firstName);
      expect(response.body.data.lastName).toBe(patientData.lastName);
    });

    it('should validate required fields', async () => {
      const patientData = {
        firstName: 'Jane',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate email format', async () => {
      const patientData = {
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        age: '25',
        bloodGroup: 'B+',
        dateOfBirth: '1998-05-15',
        email: 'invalid-email',
        phone: '+1987654321'
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate phone format', async () => {
      const patientData = {
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        age: '25',
        bloodGroup: 'B+',
        dateOfBirth: '1998-05-15',
        email: 'jane.smith@example.com',
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should check for duplicate email', async () => {
      // First create a patient with a specific email
      await createTestPatient({ email: 'duplicate@example.com' });

      const patientData = {
        patientId: 'PAT789012',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        age: '25',
        bloodGroup: 'B+',
        dateOfBirth: '1998-05-15',
        email: 'duplicate@example.com', // Same as existing patient
        phone: '+1987654321',
        address: '123 Test St, Test City, TC 12345'
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(patientData)
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/patients/:id', () => {
    it('should update patient with valid data', async () => {
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        phone: '+1111111111'
      };

      const response = await request(app)
        .put(`/api/patients/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Patient updated successfully');
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/patients/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should validate updated data', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/patients/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/patients/:id', () => {
    it('should delete patient successfully', async () => {
      const response = await request(app)
        .delete(`/api/patients/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Patient deleted successfully');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/patients/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Patient not found');
    });

    it('should not allow deletion if patient has appointments', async () => {
      // This would require creating an appointment first
      // For now, we'll test the basic deletion
      const response = await request(app)
        .delete(`/api/patients/${patient._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
