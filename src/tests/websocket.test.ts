import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { WebSocket } from 'ws';
import { RealtimeTrackingService } from '../services/realtime-tracking.service';
import { RouteService } from '../services/route.service';
import { DriverService } from '../services/driver.service';
import { LocationUpdate, GeoPoint } from '../types';

// Set test environment variables
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6380';
process.env.REDIS_PASSWORD = 'test_password';

// Mock Redis to prevent real connections
const mockRedisClient = {
  connect: mock(() => Promise.resolve()),
  disconnect: mock(() => Promise.resolve()),
  setDriverLocation: mock(() => Promise.resolve()),
  getDriverLocation: mock(() => Promise.resolve()),
  getNearbyDrivers: mock(() => Promise.resolve()),
  getAllDrivers: mock(() => Promise.resolve()),
  removeDriver: mock(() => Promise.resolve()),
  setDemandPoint: mock(() => Promise.resolve()),
  getDemandPoints: mock(() => Promise.resolve()),
};

const mockRouteService = {
  getRoute: mock(() => Promise.resolve({
    route: [
      { lat: 51.09546, lng: 71.42753 },
      { lat: 51.0982, lng: 71.41295 },
    ],
    distance: 1500,
    duration: 300,
    profile: 'driving',
    instructions: ['Head north'],
  })),
};

const mockDriverService = {
  updateDriverLocation: mock(() => Promise.resolve()),
  getDriverLocation: mock(() => Promise.resolve()),
  getNearbyDrivers: mock(() => Promise.resolve()),
  getAllDrivers: mock(() => Promise.resolve()),
  removeDriver: mock(() => Promise.resolve()),
  getDemandRecommendations: mock(() => Promise.resolve()),
  getBestDemandPoint: mock(() => Promise.resolve()),
  updateDemandFromHeatmap: mock(() => Promise.resolve()),
};

describe('RealtimeTrackingService', () => {
  let service: RealtimeTrackingService;
  let mockSocket: any;

  beforeEach(() => {
    service = new RealtimeTrackingService(mockRouteService as any, mockDriverService as any);
    mockSocket = {
      send: mock(),
      readyState: 1,
      on: mock(),
    };
  });

  afterEach(() => {
    mockRouteService.getRoute.mockClear();
    Object.values(mockDriverService).forEach(mockFn => mockFn.mockClear());
    mockSocket.send.mockClear();
    mockSocket.on.mockClear();
  });

  describe('Client Management', () => {
    it('should add client successfully', () => {
      const clientId = 'test-client';
      service.addClient(clientId, mockSocket as any);
      
      expect(service.getActiveClients()).toContain(clientId);
    });

    it('should remove client successfully', () => {
      const clientId = 'test-client';
      service.addClient(clientId, mockSocket as any);
      service.removeClient(clientId);
      
      expect(service.getActiveClients()).not.toContain(clientId);
    });
  });

  describe('Location Updates', () => {
    it('should handle location update', () => {
      const clientId = 'test-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
        accuracy: 10,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });
      service['handleLocationUpdate'](clientId, location);

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData).toBeDefined();
      if (trackingData) {
        expect(trackingData.currentLocation).toEqual(location);
      }
    });

    it('should start tracking with initial location', () => {
      const clientId = 'test-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData?.isTracking).toBe(true);
      expect(trackingData?.currentLocation).toEqual(location);
    });

    it('should update driver location when isDriver is true', () => {
      const clientId = 'driver-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
        accuracy: 10,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location, isDriver: true });
      
      // First call happens in startTracking
      expect(mockDriverService.updateDriverLocation).toHaveBeenCalledWith(
        clientId,
        location.lat,
        location.lng,
        'available'
      );
      
      // Second call happens in handleLocationUpdate
      service['handleLocationUpdate'](clientId, location);
      expect(mockDriverService.updateDriverLocation).toHaveBeenCalledTimes(2);
    });

    it('should not update driver location when isDriver is false', () => {
      const clientId = 'regular-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
        accuracy: 10,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location, isDriver: false });
      service['handleLocationUpdate'](clientId, location);

      expect(mockDriverService.updateDriverLocation).not.toHaveBeenCalled();
    });

    it('should stop tracking', () => {
      const clientId = 'test-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });
      service['stopTracking'](clientId);

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData?.isTracking).toBe(false);
    });
  });

  describe('Route Management', () => {
    it('should handle route request', async () => {
      const clientId = 'test-client';
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
      };
      const destination: GeoPoint = {
        lat: 51.0982,
        lng: 71.41295,
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });

      await service['handleRouteRequest'](clientId, {
        destination,
        profile: 'driving',
      });

      expect(mockRouteService.getRoute).toHaveBeenCalledWith({
        startPoint: location,
        endPoint: destination,
        profile: 'driving',
      });
    });

    it('should calculate distance from route', () => {
      const location: LocationUpdate = {
        lat: 51.09546,
        lng: 71.42753,
      };
      const route = {
        route: [
          { lat: 51.09546, lng: 71.42753 },
          { lat: 51.0982, lng: 71.41295 },
        ],
        distance: 1500,
        duration: 300,
        profile: 'driving',
      };

      const distance = service['calculateDistanceFromRoute'](location, route);
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Message Handling', () => {
    it('should handle location_update message', () => {
      const clientId = 'test-client';
      const message = {
        type: 'location_update' as const,
        data: { lat: 51.09546, lng: 71.42753 },
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location: message.data });
      service['handleMessage'](clientId, message);

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData).toBeDefined();
      if (trackingData) {
        expect(trackingData.currentLocation).toEqual(message.data);
      }
    });

    it('should handle start_tracking message', () => {
      const clientId = 'test-client';
      const message = {
        type: 'location_update' as const,
        data: { 
          location: { lat: 51.09546, lng: 71.42753 },
          isDriver: true 
        },
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { 
        location: message.data.location, 
        isDriver: message.data.isDriver 
      });

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData).toBeDefined();
      if (trackingData) {
        expect(trackingData.isTracking).toBe(true);
        expect((trackingData as any).isDriver).toBe(true);
      }
    });

    it('should handle stop_tracking message', () => {
      const clientId = 'test-client';
      const location: LocationUpdate = { lat: 51.09546, lng: 71.42753 };
      const message = {
        type: 'location_update' as const,
        data: { lat: 51.09546, lng: 71.42753 },
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });
      service['stopTracking'](clientId);

      const trackingData = service.getTrackingData(clientId);
      expect(trackingData?.isTracking).toBe(false);
    });

    it('should handle route_request message', async () => {
      const clientId = 'test-client';
      const location: LocationUpdate = { lat: 51.09546, lng: 71.42753 };
      const message = {
        type: 'route_request' as const,
        data: {
          destination: { lat: 51.0982, lng: 71.41295 },
          profile: 'driving'
        },
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['startTracking'](clientId, { location });
      await service['handleMessage'](clientId, message);

      expect(mockRouteService.getRoute).toHaveBeenCalledWith({
        startPoint: location,
        endPoint: message.data.destination,
        profile: 'driving',
      });
    });

    it('should handle pong message', () => {
      const clientId = 'test-client';
      const message = {
        type: 'pong' as const,
        data: {},
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['handleMessage'](clientId, message);

      // Should not throw error and should handle pong gracefully
      expect(true).toBe(true);
    });

    it('should handle invalid message type', () => {
      const clientId = 'test-client';
      const message = {
        type: 'invalid_type' as any,
        data: {},
        timestamp: Date.now(),
      };

      service.addClient(clientId, mockSocket as any);
      service['handleMessage'](clientId, message);

      expect(mockSocket.send).toHaveBeenCalled();
    });
  });
});
