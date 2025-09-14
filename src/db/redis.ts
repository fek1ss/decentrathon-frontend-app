import { createClient } from 'redis';
import { DriverLocation } from '../types';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Disconnected from Redis');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async setDriverLocation(driverId: string, location: DriverLocation): Promise<void> {
    await this.connect();
    const key = `driver:${driverId}`;
    await this.client.setEx(key, 300, JSON.stringify(location));
    
    const geoKey = 'drivers:geo';
    await this.client.geoAdd(geoKey, {
      longitude: location.lng,
      latitude: location.lat,
      member: driverId
    });
  }

  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    await this.connect();
    const key = `driver:${driverId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getNearbyDrivers(lat: number, lng: number, radius: number = 1000): Promise<string[]> {
    await this.connect();
    const geoKey = 'drivers:geo';
    const results = await this.client.geoSearch(geoKey, {
      longitude: lng,
      latitude: lat
    }, {
      radius,
      unit: 'm'
    });
    return results;
  }

  async getAllDrivers(): Promise<DriverLocation[]> {
    await this.connect();
    const keys = await this.client.keys('driver:*');
    const drivers: DriverLocation[] = [];
    
    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        drivers.push(JSON.parse(data));
      }
    }
    
    return drivers;
  }

  async removeDriver(driverId: string): Promise<void> {
    await this.connect();
    const key = `driver:${driverId}`;
    await this.client.del(key);
    
    const geoKey = 'drivers:geo';
    await this.client.zRem(geoKey, driverId);
  }

  async setDemandPoint(lat: number, lng: number, intensity: number, radius: number): Promise<void> {
    await this.connect();
    const key = `demand:${lat}:${lng}`;
    const data = {
      lat,
      lng,
      intensity,
      radius,
      timestamp: Date.now()
    };
    await this.client.setEx(key, 3600, JSON.stringify(data));
  }

  async getDemandPoints(): Promise<Array<{ lat: number; lng: number; intensity: number; radius: number }>> {
    await this.connect();
    const keys = await this.client.keys('demand:*');
    const points: Array<{ lat: number; lng: number; intensity: number; radius: number }> = [];
    
    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        const point = JSON.parse(data);
        points.push({
          lat: point.lat,
          lng: point.lng,
          intensity: point.intensity,
          radius: point.radius
        });
      }
    }
    
    return points;
  }
}

export const redisClient = new RedisClient();
