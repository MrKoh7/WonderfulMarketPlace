import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('App', () => {
  it('should return 200 on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});