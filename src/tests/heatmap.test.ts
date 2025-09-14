import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HeatmapService } from '../services/heatmap.service';
import { HeatmapRequest, HeatmapConfig, GeoLocation } from '../types';

const mockDb = {
  select: mock(() => ({
    from: mock(() => ({
      where: mock(() => Promise.resolve([
        { id: 1, randomizedId: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
        { id: 2, randomizedId: 'track1', lat: 51.09550, lng: 71.42760, alt: 351, spd: 0.3, azm: 14.0 },
        { id: 3, randomizedId: 'track1', lat: 51.09555, lng: 71.42765, alt: 352, spd: 0.4, azm: 14.5 },
        { id: 4, randomizedId: 'track2', lat: 51.09820, lng: 71.41295, alt: 348, spd: 0.1, azm: 265.7 },
        { id: 5, randomizedId: 'track2', lat: 51.09825, lng: 71.41300, alt: 349, spd: 0.2, azm: 266.0 },
      ])),
    })),
  })),
};

const mockDbWithoutWhere = {
  select: mock(() => ({
    from: mock(() => Promise.resolve([
      { id: 1, randomizedId: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
      { id: 2, randomizedId: 'track1', lat: 51.09550, lng: 71.42760, alt: 351, spd: 0.3, azm: 14.0 },
      { id: 3, randomizedId: 'track1', lat: 51.09555, lng: 71.42765, alt: 352, spd: 0.4, azm: 14.5 },
      { id: 4, randomizedId: 'track2', lat: 51.09820, lng: 71.41295, alt: 348, spd: 0.1, azm: 265.7 },
      { id: 5, randomizedId: 'track2', lat: 51.09825, lng: 71.41300, alt: 349, spd: 0.2, azm: 266.0 },
    ])),
  })),
};

describe('HeatmapService', () => {
  let service: HeatmapService;

  beforeEach(() => {
    service = new HeatmapService(mockDb as any);
  });

  describe('generateHeatmap', () => {
    it('should generate heatmap points', async () => {
      const serviceWithMockDb = new HeatmapService(mockDbWithoutWhere as any);
      const request: HeatmapRequest = {
        config: {
          gridSize: 0.001,
          radius: 100,
          intensityThreshold: 0.1,
          maxPoints: 100,
        },
      };

      const heatmapPoints = await serviceWithMockDb.generateHeatmap(request);

      expect(heatmapPoints).toBeDefined();
      expect(Array.isArray(heatmapPoints)).toBe(true);
      expect(heatmapPoints.length).toBeGreaterThan(0);
      
      if (heatmapPoints.length > 0) {
        const point = heatmapPoints[0];
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(point).toHaveProperty('radius');
        expect(point).toHaveProperty('intensity');
        expect(point).toHaveProperty('count');
      }
    });

    it('should filter by track IDs', async () => {
      const request: HeatmapRequest = {
        trackIds: ['track1'],
        config: {
          gridSize: 0.001,
          radius: 100,
          intensityThreshold: 0.1,
          maxPoints: 100,
        },
      };

      const heatmapPoints = await service.generateHeatmap(request);

      expect(heatmapPoints).toBeDefined();
      expect(Array.isArray(heatmapPoints)).toBe(true);
    });

    it('should filter by bounds', async () => {
      const request: HeatmapRequest = {
        bounds: {
          north: 51.1,
          south: 51.09,
          east: 71.43,
          west: 71.42,
        },
        config: {
          gridSize: 0.001,
          radius: 100,
          intensityThreshold: 0.1,
          maxPoints: 100,
        },
      };

      const heatmapPoints = await service.generateHeatmap(request);

      expect(heatmapPoints).toBeDefined();
      expect(Array.isArray(heatmapPoints)).toBe(true);
    });
  });

  describe('generateHeatmapForTrack', () => {
    it('should generate heatmap for specific track', async () => {
      const config: Partial<HeatmapConfig> = {
        gridSize: 0.001,
        radius: 100,
        intensityThreshold: 0.1,
        maxPoints: 100,
      };

      const heatmapPoints = await service.generateHeatmapForTrack('track1', config);

      expect(heatmapPoints).toBeDefined();
      expect(Array.isArray(heatmapPoints)).toBe(true);
    });
  });

  describe('generateHeatmapForBounds', () => {
    it('should generate heatmap for bounds', async () => {
      const bounds = {
        north: 51.1,
        south: 51.09,
        east: 71.43,
        west: 71.42,
      };

      const config: Partial<HeatmapConfig> = {
        gridSize: 0.001,
        radius: 100,
        intensityThreshold: 0.1,
        maxPoints: 100,
      };

      const heatmapPoints = await service.generateHeatmapForBounds(bounds, config);

      expect(heatmapPoints).toBeDefined();
      expect(Array.isArray(heatmapPoints)).toBe(true);
    });
  });

  describe('getHeatmapStats', () => {
    it('should return heatmap statistics', async () => {
      const serviceWithMockDb = new HeatmapService(mockDbWithoutWhere as any);
      const request: HeatmapRequest = {
        config: {
          gridSize: 0.001,
          radius: 100,
          intensityThreshold: 0.1,
          maxPoints: 100,
        },
      };

      const stats = await serviceWithMockDb.getHeatmapStats(request);

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalPoints');
      expect(stats).toHaveProperty('totalIntensity');
      expect(stats).toHaveProperty('averageIntensity');
      expect(stats).toHaveProperty('maxIntensity');
      expect(stats).toHaveProperty('minIntensity');
      expect(stats).toHaveProperty('config');
    });
  });

  describe('getClusteredPoints', () => {
    it('should return clustered points', async () => {
      const serviceWithMockDb = new HeatmapService(mockDbWithoutWhere as any);
      const request: HeatmapRequest = {
        config: {
          gridSize: 0.001,
          radius: 100,
          intensityThreshold: 0.1,
          maxPoints: 100,
        },
      };

      const clusters = await serviceWithMockDb.getClusteredPoints(request, 50);

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      
      if (clusters.length > 0) {
        const cluster = clusters[0];
        expect(cluster).toHaveProperty('center');
        expect(cluster).toHaveProperty('points');
        expect(cluster).toHaveProperty('radius');
        expect(cluster).toHaveProperty('intensity');
        expect(cluster).toHaveProperty('count');
      }
    });
  });
});
