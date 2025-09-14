import { redisClient } from '../db/redis';
import { HeatmapService } from './heatmap.service';
import { RouteService } from './route.service';
import { DriverLocation, DemandPoint, DriverRecommendation, GeoPoint } from '../types';
import { calculateDistance } from '../utils/geo-calculations';

export class DriverService {
  constructor(
    private heatmapService: HeatmapService,
    private routeService: RouteService
  ) {}

  async updateDriverLocation(driverId: string, lat: number, lng: number, status: 'available' | 'busy' | 'offline' = 'available'): Promise<void> {
    const location: DriverLocation = {
      id: driverId,
      lat,
      lng,
      timestamp: Date.now(),
      status
    };

    await redisClient.setDriverLocation(driverId, location);
  }

  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    return await redisClient.getDriverLocation(driverId);
  }

  async getNearbyDrivers(lat: number, lng: number, radius: number = 1000): Promise<DriverLocation[]> {
    const driverIds = await redisClient.getNearbyDrivers(lat, lng, radius);
    const drivers: DriverLocation[] = [];
    
    for (const driverId of driverIds) {
      const location = await redisClient.getDriverLocation(driverId);
      if (location) {
        drivers.push(location);
      }
    }
    
    return drivers;
  }

  async getAllDrivers(): Promise<DriverLocation[]> {
    return await redisClient.getAllDrivers();
  }

  async removeDriver(driverId: string): Promise<void> {
    await redisClient.removeDriver(driverId);
  }

  async getDemandRecommendations(driverLocation: GeoPoint, maxDistance: number = 5000): Promise<DriverRecommendation[]> {
    const heatmapPoints = await this.heatmapService.generateHeatmap({
      config: {
        gridSize: 0.001,
        radius: 200,
        intensityThreshold: 0.3,
        maxPoints: 50
      }
    });

    const nearbyDrivers = await this.getNearbyDrivers(driverLocation.lat, driverLocation.lng, maxDistance);
    const recommendations: DriverRecommendation[] = [];

    for (const point of heatmapPoints) {
      const distance = calculateDistance(driverLocation, { lat: point.lat, lng: point.lng });
      
      if (distance <= maxDistance) {
        const nearbyDriversAtPoint = nearbyDrivers.filter(driver => {
          const driverDistance = calculateDistance(
            { lat: driver.lat, lng: driver.lng },
            { lat: point.lat, lng: point.lng }
          );
          return driverDistance <= point.radius && driver.status === 'available';
        });

        const competition = nearbyDriversAtPoint.length;
        const demand = point.intensity;
        
        const competitionPenalty = Math.min(competition * 0.2, 0.8);
        const finalScore = demand * (1 - competitionPenalty);

        const estimatedTime = await this.calculateEstimatedTime(driverLocation, { lat: point.lat, lng: point.lng });

        recommendations.push({
          point: {
            lat: point.lat,
            lng: point.lng,
            intensity: point.intensity,
            radius: point.radius,
            driverCount: competition,
            score: finalScore
          },
          distance,
          estimatedTime,
          competition,
          demand,
          finalScore
        });
      }
    }

    return recommendations
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10);
  }

  private async calculateEstimatedTime(start: GeoPoint, end: GeoPoint): Promise<number> {
    try {
      const route = await this.routeService.getRoute({
        startPoint: start,
        endPoint: end,
        profile: 'driving'
      });
      return route.duration;
    } catch (error) {
      const distance = calculateDistance(start, end);
      return Math.round((distance / 50) * 60);
    }
  }

  async getBestDemandPoint(driverLocation: GeoPoint, maxDistance: number = 5000): Promise<DriverRecommendation | null> {
    const recommendations = await this.getDemandRecommendations(driverLocation, maxDistance);
    return recommendations.length > 0 ? recommendations[0] : null;
  }

  async updateDemandFromHeatmap(): Promise<void> {
    const heatmapPoints = await this.heatmapService.generateHeatmap({
      config: {
        gridSize: 0.001,
        radius: 200,
        intensityThreshold: 0.5,
        maxPoints: 100
      }
    });

    for (const point of heatmapPoints) {
      await redisClient.setDemandPoint(point.lat, point.lng, point.intensity, point.radius);
    }
  }
}
