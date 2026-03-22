const request = require('supertest');

const API_URL = 'http://localhost'; 

describe('IIT Patna Hackathon Infrastructure Integration Tests', () => {
  
  test('GET /api/health should return status ok', async () => {
    const response = await request(API_URL).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('POST /api/metadata should store info in Local DB', async () => {
    const testData = {
      title: "Jest Integration Test",
      description: "Verifying Local DB Connection",
      filePath: "/uploads/jest-test.pdf"
    };

    const response = await request(API_URL)
      .post('/api/metadata')
      .send(testData);

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(testData.title);
    expect(response.body).toHaveProperty('_id'); 
  });

  test('GET /api/metadata should retrieve records from Local DB', async () => {
    const response = await request(API_URL).get('/api/metadata');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});