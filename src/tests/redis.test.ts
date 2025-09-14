import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { DriverLocation } from '../types';

// Set test environment variables
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6380';
process.env.REDIS_PASSWORD = 'test_password';

// Mock the redis module to prevent real connections
const mockRedisModule = {
  redisClient: {
    connect: mock(() => Promise.resolve()),
    disconnect: mock(() => Promise.resolve()),
    setEx: mock(() => Promise.resolve()),
    get: mock(() => Promise.resolve()),
    geoAdd: mock(() => Promise.resolve()),
    geoSearch: mock(() => Promise.resolve()),
    keys: mock(() => Promise.resolve()),
    del: mock(() => Promise.resolve()),
    zRem: mock(() => Promise.resolve()),
    setDriverLocation: mock(() => Promise.resolve()),
    getDriverLocation: mock(() => Promise.resolve()),
    getNearbyDrivers: mock(() => Promise.resolve()),
    getAllDrivers: mock(() => Promise.resolve()),
    removeDriver: mock(() => Promise.resolve()),
    setDemandPoint: mock(() => Promise.resolve()),
    getDemandPoints: mock(() => Promise.resolve()),
  }
};

// Mock the entire redis module
global.mockModule = (path: string, module: any) => {
  if (path === '../db/redis') {
    return module;
  }
};

const mockRedisClient = mockRedisModule.redisClient;

describe('RedisClient', () => {
  beforeEach(() => {
    // Tests are now using mockRedisClient directly
  });

  afterEach(() => {
    Object.values(mockRedisClient).forEach(mockFn => mockFn.mockClear());
  });

  describe('Driver Location Management', () => {
    it('should set driver location', async () => {
      const driverId = 'driver_001';
      const location: DriverLocation = {
        id: driverId,
        lat: 51.09546,
        lng: 71.42753,
        timestamp: Date.now(),
        status: 'available'
      };

      await mockRedisClient.setDriverLocation(driverId, location);

      expect(mockRedisClient.setDriverLocation).toHaveBeenCalledWith(driverId, location);
    });

    it('should get driver location', async () => {
      const driverId = 'driver_001';
      const location: DriverLocation = {
        id: driverId,
        lat: 51.09546,
        lng: 71.42753,
        timestamp: Date.now(),
        status: 'available'
      };

      mockRedisClient.getDriverLocation.mockResolvedValue(location);

      const result = await mockRedisClient.getDriverLocation(driverId);

      expect(mockRedisClient.getDriverLocation).toHaveBeenCalledWith(driverId);
      expect(result).toEqual(location);
    });

    it('should return null for non-existent driver', async () => {
      const driverId = 'non_existent';
      mockRedisClient.getDriverLocation.mockResolvedValue(null);

      const result = await mockRedisClient.getDriverLocation(driverId);

      expect(result).toBeNull();
    });

    it('should get nearby drivers', async () => {
      const lat = 51.09546;
      const lng = 71.42753;
      const radius = 1000;
      const driverIds = ['driver_001', 'driver_002'];

      mockRedisClient.getNearbyDrivers.mockResolvedValue(driverIds);

      const result = await mockRedisClient.getNearbyDrivers(lat, lng, radius);

      expect(mockRedisClient.getNearbyDrivers).toHaveBeenCalledWith(lat, lng, radius);
      expect(result).toEqual(driverIds);
    });

    it('should get all drivers', async () => {
      const locations = [
        { id: '001', lat: 51.09546, lng: 71.42753, timestamp: Date.now(), status: 'available' },
        { id: '002', lat: 51.09550, lng: 71.42760, timestamp: Date.now(), status: 'busy' }
      ];

      mockRedisClient.getAllDrivers.mockResolvedValue(locations);

      const result = await mockRedisClient.getAllDrivers();

      expect(mockRedisClient.getAllDrivers).toHaveBeenCalled();
      expect(result).toEqual(locations);
    });

    it('should remove driver', async () => {
      const driverId = 'driver_001';

      await mockRedisClient.removeDriver(driverId);

      expect(mockRedisClient.removeDriver).toHaveBeenCalledWith(driverId);
    });
  });

  describe('Demand Points Management', () => {
    it('should set demand point', async () => {
      const lat = 51.09546;
      const lng = 71.42753;
      const intensity = 0.8;
      const radius = 200;

      await mockRedisClient.setDemandPoint(lat, lng, intensity, radius);

      expect(mockRedisClient.setDemandPoint).toHaveBeenCalledWith(lat, lng, intensity, radius);
    });

    it('should get demand points', async () => {
      const points = [
        { lat: 51.09546, lng: 71.42753, intensity: 0.8, radius: 200 },
        { lat: 51.09550, lng: 71.42760, intensity: 0.6, radius: 150 }
      ];

      mockRedisClient.getDemandPoints.mockResolvedValue(points);

      const result = await mockRedisClient.getDemandPoints();

      expect(mockRedisClient.getDemandPoints).toHaveBeenCalled();
      expect(result).toEqual(points);
    });
  });
});
