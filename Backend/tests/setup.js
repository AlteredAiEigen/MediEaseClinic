const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Load environment variables for testing
require('dotenv').config({ path: './config.env' });

let mongoServer;

// Global setup
beforeAll(async () => {
  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

// Global cleanup
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database before each test
beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (error) {
        // Ignore errors if collection doesn't exist
        console.warn(`Warning: Could not clear collection ${key}:`, error.message);
      }
    }
  }
});

// Global test timeout
jest.setTimeout(30000);
