import { drizzle } from 'drizzle-orm/postgres-js';
import { geoLocations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { GeoTrack, GeoTrackOptions, GeoTrackStats, GeoLocation, GeoPoint } from '../types';
import { calculateTotalDistance, calculateDuration, groupLocationsByTrack } from '../utils/geo-calculations';

export class GeoTrackService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async getUniqueTrackCount(): Promise<number> {
    const result = await this.db
      .select({ count: geoLocations.randomizedId })
      .from(geoLocations)
      .groupBy(geoLocations.randomizedId);
    
    return result.length;
  }

  async getTrackById(trackId: string, options: GeoTrackOptions): Promise<GeoTrack | null> {
    const locations = await this.db
      .select()
      .from(geoLocations)
      .where(eq(geoLocations.randomizedId, trackId))
      .orderBy(geoLocations.id);

    if (locations.length === 0) return null;

    const track: GeoTrack = {
      id: trackId,
      pointCount: locations.length,
    };

    if (options.includeRoute) {
      const points: GeoPoint[] = locations.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
      }));

      track.route = {
        points,
        distance: options.includeDistance ? calculateTotalDistance(points) : 0,
        duration: calculateDuration(locations.map(loc => ({
          id: loc.randomizedId,
          lat: loc.lat,
          lng: loc.lng,
          alt: loc.alt,
          spd: loc.spd,
          azm: loc.azm,
        }))),
      };
    }

    if (options.includeDistance && !options.includeRoute) {
      const points: GeoPoint[] = locations.map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
      }));
      track.totalDistance = calculateTotalDistance(points);
    }

    return track;
  }

  async getAllTracks(options: GeoTrackOptions): Promise<GeoTrack[]> {
    const allLocations = await this.db
      .select()
      .from(geoLocations)
      .orderBy(geoLocations.randomizedId, geoLocations.id);

    const trackMap = groupLocationsByTrack(allLocations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    })));

    const tracks: GeoTrack[] = [];

    for (const [trackId, locations] of trackMap) {
      const track: GeoTrack = {
        id: trackId,
        pointCount: locations.length,
      };

      if (options.includeRoute) {
        const points: GeoPoint[] = locations.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
        }));

        track.route = {
          points,
          distance: options.includeDistance ? calculateTotalDistance(points) : 0,
          duration: calculateDuration(locations),
        };
      }

      if (options.includeDistance && !options.includeRoute) {
        const points: GeoPoint[] = locations.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
        }));
        track.totalDistance = calculateTotalDistance(points);
      }

      tracks.push(track);
    }

    return tracks;
  }

  async getTrackStats(): Promise<GeoTrackStats> {
    const allLocations = await this.db.select().from(geoLocations);
    const trackMap = groupLocationsByTrack(allLocations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    })));

    const totalTracks = trackMap.size;
    const totalPoints = allLocations.length;
    const averagePointsPerTrack = totalTracks > 0 ? totalPoints / totalTracks : 0;

    return {
      totalTracks,
      totalPoints,
      averagePointsPerTrack: Math.round(averagePointsPerTrack * 100) / 100,
    };
  }
}
