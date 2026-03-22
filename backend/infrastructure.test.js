import request from 'supertest';
import mongoose from 'mongoose';
import app from './server.js';

describe('IIT Patna Infrastructure Integration Test', () => {
  let dbConnected = false;
  
  beforeAll(async () => {
    // Prefer local MongoDB for host runs; docker hostname can be tried as fallback.
    const mongoCandidates = [
      'mongodb://localhost:27017/test_db',
      process.env.MONGO_URL,
    ].filter((value, index, self) => Boolean(value) && self.indexOf(value) === index);

    for (const mongoUrl of mongoCandidates) {
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }

        await mongoose.connect(mongoUrl, {
          serverSelectionTimeoutMS: 4000,
          connectTimeoutMS: 4000,
        });

        dbConnected = true;
        console.log(`Connected to MongoDB for tests: ${mongoUrl}`);
        break;
      } catch (error) {
        console.warn(`MongoDB connection attempt failed for ${mongoUrl}: ${error.message}`);
      }
    }

    if (!dbConnected) {
      console.warn('MongoDB unavailable. DB-dependent integration checks will be skipped.');
    }
  }, 10000);

  afterAll(async () => {
    
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error.message);
    }
  });

  
  test('should return health status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  
  test('should create metadata in MongoDB', async () => {
    if (!dbConnected) {
      console.warn('Skipping DB metadata create test because MongoDB is not reachable.');
      return;
    }

    const testData = {
      title: "Test Title",
      description: "Test Description",
      filePath: "/uploads/test.pdf"
    };

    const res = await request(app)
      .post('/metadata')
      .send(testData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', testData.title);
    expect(res.body).toHaveProperty('_id');
  });

 
  test('should retrieve all metadata records', async () => {
    if (!dbConnected) {
      console.warn('Skipping DB metadata read test because MongoDB is not reachable.');
      return;
    }

    const res = await request(app).get('/metadata');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

 
  test('should have /upload-file endpoint available', async () => {
    const res = await request(app).post('/upload-file');
   expect(res.status).not.toBe(404);
  });

});