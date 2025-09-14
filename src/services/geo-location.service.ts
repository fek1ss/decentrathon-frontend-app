import { drizzle } from 'drizzle-orm/postgres-js';
import { geoLocations } from '../db/schema';
import { GeoLocation } from '../types';

export class GeoLocationService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async insertBatch(locations: GeoLocation[]): Promise<void> {
    const batchSize = 1000;
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      await this.db.insert(geoLocations).values(
        batch.map(loc => ({
          randomizedId: loc.id,
          lat: loc.lat,
          lng: loc.lng,
          alt: loc.alt,
          spd: loc.spd,
          azm: loc.azm,
        }))
      );
    }
  }

  async getAll(): Promise<GeoLocation[]> {
    const result = await this.db.select().from(geoLocations);
    return result.map(row => ({
      id: row.randomizedId,
      lat: row.lat,
      lng: row.lng,
      alt: row.alt,
      spd: row.spd,
      azm: row.azm,
    }));
  }

  async getCount(): Promise<number> {
    const result = await this.db.select({ count: geoLocations.id }).from(geoLocations);
    return result.length;
  }
}
