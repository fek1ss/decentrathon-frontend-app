import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { createRouteApi } from '../api/route.api';
import { RouteService } from '../services/route.service';

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
  getMultipleRoutes: mock(() => Promise.resolve([
    {
      route: [{ lat: 51.09546, lng: 71.42753 }],
      distance: 1500,
      duration: 300,
      profile: 'driving',
      instructions: ['Head north'],
    },
  ])),
};

describe('Route API', () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(createRouteApi(mockRouteService as any));
  });

  describe('POST /route', () => {
    it('should return route for valid request', async () => {
      const requestBody = {
        startPoint: { lat: 51.09546, lng: 71.42753 },
        endPoint: { lat: 51.0982, lng: 71.41295 },
        profile: 'driving',
      };

      const response = await app.handle(
        new Request('http://localhost/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.route).toHaveLength(2);
      expect(data.data.distance).toBe(1500);
      expect(data.data.profile).toBe('driving');
    });

    it('should handle service errors', async () => {
      mockRouteService.getRoute = mock(() => Promise.reject(new Error('Route not found')));

      const requestBody = {
        startPoint: { lat: 51.09546, lng: 71.42753 },
        endPoint: { lat: 51.0982, lng: 71.41295 },
      };

      const response = await app.handle(
        new Request('http://localhost/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Route not found');
    });
  });

  describe('POST /routes', () => {
    it('should return multiple routes', async () => {
      const requestBody = [
        {
          startPoint: { lat: 51.09546, lng: 71.42753 },
          endPoint: { lat: 51.0982, lng: 71.41295 },
        },
      ];

      const response = await app.handle(
        new Request('http://localhost/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });
  });
});
