import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { GeoTrackService } from '../services/geo-track.service';
import { GeoTrackOptions } from '../types';

const mockDb = {
  select: mock(() => ({
    from: mock(() => ({
      groupBy: mock(() => Promise.resolve([{ count: 'track1' }, { count: 'track2' }])),
      where: mock(() => ({
        orderBy: mock(() => Promise.resolve([
          { id: 1, randomizedId: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
          { id: 2, randomizedId: 'track1', lat: 51.0982, lng: 71.41295, alt: 348, spd: 0, azm: 265.7 },
        ])),
      })),
      orderBy: mock(() => Promise.resolve([
        { id: 1, randomizedId: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
        { id: 2, randomizedId: 'track1', lat: 51.0982, lng: 71.41295, alt: 348, spd: 0, azm: 265.7 },
        { id: 3, randomizedId: 'track2', lat: 51.08977, lng: 71.42846, alt: 314, spd: 14.3, azm: 192.1 },
      ])),
    })),
  })),
};

describe('GeoTrackService', () => {
  let service: GeoTrackService;

  beforeEach(() => {
    service = new GeoTrackService(mockDb as any);
  });

  describe('getUniqueTrackCount', () => {
    it('should return count of unique tracks', async () => {
      const count = await service.getUniqueTrackCount();
      
      expect(count).toBe(2);
    });
  });

  describe('getTrackById', () => {
    it('should return track with basic info', async () => {
      const options: GeoTrackOptions = {
        includeRoute: false,
        includeDistance: false,
      };
      
      const track = await service.getTrackById('track1', options);
      
      expect(track).not.toBeNull();
      expect(track?.id).toBe('track1');
      expect(track?.pointCount).toBe(2);
      expect(track?.route).toBeUndefined();
      expect(track?.totalDistance).toBeUndefined();
    });

    it('should return track with route', async () => {
      const options: GeoTrackOptions = {
        includeRoute: true,
        includeDistance: false,
      };
      
      const track = await service.getTrackById('track1', options);
      
      expect(track).not.toBeNull();
      expect(track?.route).toBeDefined();
      expect(track?.route?.points).toHaveLength(2);
      expect(track?.route?.distance).toBe(0);
    });

    it('should return track with distance', async () => {
      const options: GeoTrackOptions = {
        includeRoute: true,
        includeDistance: true,
      };
      
      const track = await service.getTrackById('track1', options);
      
      expect(track).not.toBeNull();
      expect(track?.route?.distance).toBeGreaterThan(0);
    });

    it('should return null for non-existent track', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => Promise.resolve([])),
          })),
        })),
      }));

      const track = await service.getTrackById('nonexistent', { includeRoute: false, includeDistance: false });
      
      expect(track).toBeNull();
    });
  });

  describe('getTrackStats', () => {
    it('should return track statistics', async () => {
      mockDb.select = mock(() => ({
        from: mock(() => Promise.resolve([
          { id: 1, randomizedId: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
          { id: 2, randomizedId: 'track1', lat: 51.0982, lng: 71.41295, alt: 348, spd: 0, azm: 265.7 },
          { id: 3, randomizedId: 'track2', lat: 51.08977, lng: 71.42846, alt: 314, spd: 14.3, azm: 192.1 },
        ])),
      }));

      const stats = await service.getTrackStats();
      
      expect(stats.totalTracks).toBe(2);
      expect(stats.totalPoints).toBe(3);
      expect(stats.averagePointsPerTrack).toBe(1.5);
    });
  });
});
