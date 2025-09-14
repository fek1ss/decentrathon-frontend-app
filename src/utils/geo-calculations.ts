import { GeoPoint, GeoLocation } from '../types';
import { EARTH_RADIUS_KM } from '../constants';

export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
};

export const calculateTotalDistance = (points: GeoPoint[]): number => {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }
  
  return totalDistance;
};

export const calculateDuration = (locations: GeoLocation[]): number => {
  if (locations.length < 2) return 0;
  
  const firstLocation = locations[0];
  const lastLocation = locations[locations.length - 1];
  
  return Math.abs(lastLocation.azm - firstLocation.azm);
};

export const groupLocationsByTrack = (locations: GeoLocation[]): Map<string, GeoLocation[]> => {
  const trackMap = new Map<string, GeoLocation[]>();
  
  locations.forEach(location => {
    const existingTrack = trackMap.get(location.id) || [];
    existingTrack.push(location);
    trackMap.set(location.id, existingTrack);
  });
  
  return trackMap;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
