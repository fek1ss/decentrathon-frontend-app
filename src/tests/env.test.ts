import { describe, it, expect } from 'bun:test';

describe('Environment Configuration', () => {
  it('should load environment variables correctly', () => {
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_PORT).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_PASSWORD).toBeDefined();
    expect(process.env.REDIS_HOST).toBeDefined();
    expect(process.env.REDIS_PORT).toBeDefined();
    expect(process.env.REDIS_PASSWORD).toBeDefined();
    expect(process.env.APP_PORT).toBeDefined();
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.OSRM_BASE_URL).toBeDefined();
  });

  it('should have correct default values for development', () => {
    expect(process.env.NODE_ENV).toBe('test'); // Bun sets NODE_ENV to 'test' during testing
    expect(process.env.APP_PORT).toBe('3000');
    expect(process.env.OSRM_BASE_URL).toBe('https://router.project-osrm.org/route/v1');
  });

  it('should have Redis configuration', () => {
    expect(process.env.REDIS_HOST).toBeDefined();
    expect(process.env.REDIS_PORT).toBeDefined();
    expect(process.env.REDIS_PASSWORD).toBeDefined();
  });

  it('should have database configuration', () => {
    expect(process.env.DB_NAME).toBe('indrive_hackaton');
    expect(process.env.DB_USER).toBe('postgres');
    expect(process.env.DB_PASSWORD).toBe('password');
  });
});
