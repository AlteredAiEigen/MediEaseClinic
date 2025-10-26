const request = require('supertest');
const app = require('../server');
const { createTestUser, generateAuthToken, getAuthHeaders, cleanupTestData } = require('./helpers/testHelpers');

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    let adminToken;

    beforeEach(async () => {
      // Create an admin user for authentication
      const adminUser = await createTestUser({ role: 'admin' });
      adminToken = generateAuthToken(adminUser._id, 'admin');
    });

    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password@123',
        role: 'doctor',
        phone: '+1234567890',
        speciality: 'General Medicine',
        licenseNumber: 'DOC123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password@123',
        role: 'doctor',
        phone: '+1234567890'
      };

      // Create first user
      await createTestUser({ email: userData.email, role: 'doctor' });

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const userData = {
        firstName: 'John',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate password strength', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'weak',
        role: 'doctor',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password@123',
        role: 'doctor',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(adminToken))
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'Password@123'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password@123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password@123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id, user.role);

      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(user._id.toString());
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile with valid data', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id, user.role);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeaders(token))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
      expect(response.body.data.user.phone).toBe(updateData.phone);
    });

    it('should not update profile without token', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const user = await createTestUser({ password: 'OldPassword@123' });
      const token = generateAuthToken(user._id, user.role);

      const passwordData = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should not change password with invalid current password', async () => {
      const user = await createTestUser({ password: 'OldPassword@123' });
      const token = generateAuthToken(user._id, user.role);

      const passwordData = {
        currentPassword: 'WrongPassword@123',
        newPassword: 'NewPassword@123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const user = await createTestUser({ password: 'OldPassword@123' });
      const token = generateAuthToken(user._id, user.role);

      const passwordData = {
        currentPassword: 'OldPassword@123',
        newPassword: 'weak'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id, user.role);

      const response = await request(app)
        .post('/api/auth/logout')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});
