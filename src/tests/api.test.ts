import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { createGeoTrackApi } from '../api/geo-track.api';
import { GeoTrackService } from '../services/geo-track.service';

const mockGeoTrackService = {
  getUniqueTrackCount: mock(() => Promise.resolve(5)),
  getTrackStats: mock(() => Promise.resolve({
    totalTracks: 5,
    totalPoints: 100,
    averagePointsPerTrack: 20,
  })),
  getAllTracks: mock(() => Promise.resolve([
    { id: 'track1', pointCount: 20 },
    { id: 'track2', pointCount: 15 },
  ])),
  getTrackById: mock(() => Promise.resolve({
    id: 'track1',
    pointCount: 20,
    route: {
      points: [{ lat: 51.09546, lng: 71.42753 }],
      distance: 1.5,
      duration: 30,
    },
  })),
};

describe('GeoTrack API', () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(createGeoTrackApi(mockGeoTrackService as any));
  });

  describe('GET /geo-tracks/count', () => {
    it('should return track count', async () => {
      const response = await app.handle(new Request('http://localhost/geo-tracks/count'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(5);
    });
  });

  describe('GET /geo-tracks/stats', () => {
    it('should return track statistics', async () => {
      const response = await app.handle(new Request('http://localhost/geo-tracks/stats'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalTracks).toBe(5);
      expect(data.data.totalPoints).toBe(100);
      expect(data.data.averagePointsPerTrack).toBe(20);
    });
  });

  describe('GET /geo-tracks', () => {
    it('should return all tracks', async () => {
      const response = await app.handle(new Request('http://localhost/geo-tracks'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should return tracks with route when requested', async () => {
      const response = await app.handle(new Request('http://localhost/geo-tracks?includeRoute=true'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /geo-tracks/:id', () => {
    it('should return specific track', async () => {
      const response = await app.handle(new Request('http://localhost/geo-tracks/track1'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('track1');
    });

    it('should return 404 for non-existent track', async () => {
      mockGeoTrackService.getTrackById = mock(() => Promise.resolve(null));
      
      const response = await app.handle(new Request('http://localhost/geo-tracks/nonexistent'));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.data).toBeNull();
    });
  });
});
