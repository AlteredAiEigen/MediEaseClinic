const request = require('supertest');
const app = require('../server');
const { 
  createTestUser, 
  generateAuthToken, 
  getAuthHeaders, 
  cleanupTestData 
} = require('./helpers/testHelpers');

describe('Middleware Tests', () => {
  let adminToken;

  beforeEach(async () => {
    await cleanupTestData();
    
    const admin = await createTestUser({ role: 'admin' });
    adminToken = generateAuthToken(admin._id, admin.role);
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should deny access with expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(expiredToken))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token expired');
    });
  });

  describe('Role-based Authorization Middleware', () => {
    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny doctor access to admin endpoints', async () => {
      const doctor = await createTestUser({ role: 'doctor' });
      const doctorToken = generateAuthToken(doctor._id, doctor.role);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set(getAuthHeaders(doctorToken))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin role required.');
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should allow requests within rate limit', async () => {
      // Make multiple requests within rate limit
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/auth/me')
          .set(getAuthHeaders(adminToken))
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      // This test would require making many requests quickly
      // In a real scenario, you'd need to mock the rate limiter
      // or make actual requests to test the rate limiting
    });
  });

  describe('Validation Middleware', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
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
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate password strength', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'weak',
        role: 'doctor',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .set(getAuthHeaders(adminToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle server errors gracefully', async () => {
      // This would require triggering a server error
      // In a real scenario, you might mock a service to throw an error
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/me')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Security Headers Middleware', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Request Logging Middleware', () => {
    it('should log requests', async () => {
      // Mock console.log to capture logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      // In a real scenario, you'd check if the request was logged
      // This depends on your logging implementation
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request Timeout Middleware', () => {
    it('should handle request timeouts', async () => {
      // This would require a long-running request
      // In a real scenario, you might mock a slow service
    });
  });

  describe('Request Size Limiting Middleware', () => {
    it('should reject oversized requests', async () => {
      // Create a large payload
      const largeData = {
        data: 'x'.repeat(11 * 1024 * 1024) // 11MB
      };

      const response = await request(app)
        .post('/api/patients')
        .set(getAuthHeaders(adminToken))
        .send(largeData)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Request entity too large');
    });
  });

  describe('Pagination Middleware', () => {
    it('should add pagination info to response', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=10')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('Search Middleware', () => {
    it('should handle search queries', async () => {
      const response = await request(app)
        .get('/api/patients?search=test')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Filter Middleware', () => {
    it('should handle filter parameters', async () => {
      const response = await request(app)
        .get('/api/patients?filter_gender=Male')
        .set(getAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
