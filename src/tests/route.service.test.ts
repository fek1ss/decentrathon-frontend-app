import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { RouteService } from '../services/route.service';
import { RouteRequest, GeoPoint } from '../types';

const mockAxios = {
  get: mock(),
  isAxiosError: mock(() => false),
};

const mockOSRMResponse = {
  routes: [{
    geometry: {
      coordinates: [
        [71.42753, 51.09546],
        [71.41295, 51.0982],
      ],
    },
    distance: 1500,
    duration: 300,
    legs: [{
      steps: [{
        maneuver: {
          instruction: 'Head north',
        },
      }],
    }],
  }],
};

describe('RouteService', () => {
  let service: RouteService;

  beforeEach(() => {
    service = new RouteService();
    mockAxios.get.mockClear();
  });

  describe('getRoute', () => {
    it('should return route for valid coordinates', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOSRMResponse });

      const request: RouteRequest = {
        startPoint: { lat: 51.09546, lng: 71.42753 },
        endPoint: { lat: 51.0982, lng: 71.41295 },
        profile: 'driving',
      };

      const result = await service.getRoute(request);

      expect(result.route.length).toBeGreaterThan(0);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.profile).toBe('driving');
      expect(result.instructions).toBeDefined();
    });

    it('should use default profile when not specified', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOSRMResponse });

      const request: RouteRequest = {
        startPoint: { lat: 51.09546, lng: 71.42753 },
        endPoint: { lat: 51.0982, lng: 71.41295 },
      };

      const result = await service.getRoute(request);

      expect(result.profile).toBe('driving');
    });

    it('should throw error for invalid coordinates', async () => {
      const request: RouteRequest = {
        startPoint: { lat: 91, lng: 71.42753 },
        endPoint: { lat: 51.0982, lng: 71.41295 },
      };

      await expect(service.getRoute(request)).rejects.toThrow('Invalid coordinates provided');
    });

    it('should throw error when no routes found', async () => {
      const request: RouteRequest = {
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
      };

      await expect(service.getRoute(request)).rejects.toThrow();
    });
  });

  describe('getMultipleRoutes', () => {
    it('should return multiple routes', async () => {
      mockAxios.get.mockResolvedValue({ data: mockOSRMResponse });

      const requests: RouteRequest[] = [
        {
          startPoint: { lat: 51.09546, lng: 71.42753 },
          endPoint: { lat: 51.0982, lng: 71.41295 },
        },
        {
          startPoint: { lat: 51.08977, lng: 71.42846 },
          endPoint: { lat: 51.08878, lng: 71.41746 },
        },
      ];

      const results = await service.getMultipleRoutes(requests);

      expect(results).toHaveLength(2);
      expect(results[0].profile).toBe('driving');
      expect(results[1].profile).toBe('driving');
    });
  });
});
