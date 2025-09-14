import { describe, it, expect } from 'bun:test';
import { calculateDistance, calculateTotalDistance, calculateDuration, groupLocationsByTrack } from '../utils/geo-calculations';
import { GeoLocation } from '../types';

describe('Geo Calculations', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { lat: 51.09546, lng: 71.42753 };
      const point2 = { lat: 51.0982, lng: 71.41295 };
      
      const distance = calculateDistance(point1, point2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10);
    });

    it('should return 0 for same points', () => {
      const point = { lat: 51.09546, lng: 71.42753 };
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });
  });

  describe('calculateTotalDistance', () => {
    it('should calculate total distance for multiple points', () => {
      const points = [
        { lat: 51.09546, lng: 71.42753 },
        { lat: 51.0982, lng: 71.41295 },
        { lat: 51.09846, lng: 71.41212 },
      ];
      
      const totalDistance = calculateTotalDistance(points);
      
      expect(totalDistance).toBeGreaterThan(0);
    });

    it('should return 0 for single point', () => {
      const points = [{ lat: 51.09546, lng: 71.42753 }];
      
      const totalDistance = calculateTotalDistance(points);
      
      expect(totalDistance).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const totalDistance = calculateTotalDistance([]);
      
      expect(totalDistance).toBe(0);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration between locations', () => {
      const locations: GeoLocation[] = [
        { id: '1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
        { id: '1', lat: 51.0982, lng: 71.41295, alt: 348, spd: 0, azm: 265.7 },
      ];
      
      const duration = calculateDuration(locations);
      
      expect(duration).toBeGreaterThan(0);
    });

    it('should return 0 for single location', () => {
      const locations: GeoLocation[] = [
        { id: '1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
      ];
      
      const duration = calculateDuration(locations);
      
      expect(duration).toBe(0);
    });
  });

  describe('groupLocationsByTrack', () => {
    it('should group locations by track ID', () => {
      const locations: GeoLocation[] = [
        { id: 'track1', lat: 51.09546, lng: 71.42753, alt: 350, spd: 0.2, azm: 13.6 },
        { id: 'track1', lat: 51.0982, lng: 71.41295, alt: 348, spd: 0, azm: 265.7 },
        { id: 'track2', lat: 51.08977, lng: 71.42846, alt: 314, spd: 14.3, azm: 192.1 },
      ];
      
      const trackMap = groupLocationsByTrack(locations);
      
      expect(trackMap.size).toBe(2);
      expect(trackMap.get('track1')?.length).toBe(2);
      expect(trackMap.get('track2')?.length).toBe(1);
    });

    it('should return empty map for empty array', () => {
      const trackMap = groupLocationsByTrack([]);
      
      expect(trackMap.size).toBe(0);
    });
  });
});
