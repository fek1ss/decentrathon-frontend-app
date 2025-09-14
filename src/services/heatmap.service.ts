import { drizzle } from 'drizzle-orm/postgres-js';
import { geoLocations } from '../db/schema';
import { inArray, and, gte, lte } from 'drizzle-orm';
import { 
  HeatmapPoint, 
  HeatmapConfig, 
  HeatmapRequest, 
  GeoLocation,
  ClusteredPoint 
} from '../types';
import { HEATMAP_CONFIG } from '../constants';
import { 
  createHeatmapGrid, 
  filterPointsByBounds, 
  calculateHeatmapStats,
  clusterPoints,
  calculateClusterProperties 
} from '../utils/heatmap-calculations';

export class HeatmapService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async generateHeatmap(request: HeatmapRequest): Promise<HeatmapPoint[]> {
    const config: HeatmapConfig = {
      gridSize: request.config?.gridSize || HEATMAP_CONFIG.DEFAULT_GRID_SIZE,
      radius: request.config?.radius || HEATMAP_CONFIG.DEFAULT_RADIUS,
      intensityThreshold: request.config?.intensityThreshold || HEATMAP_CONFIG.DEFAULT_INTENSITY_THRESHOLD,
      maxPoints: request.config?.maxPoints || HEATMAP_CONFIG.DEFAULT_MAX_POINTS,
    };

    let query = this.db.select().from(geoLocations);

    if (request.trackIds && request.trackIds.length > 0) {
      query = query.where(inArray(geoLocations.randomizedId, request.trackIds));
    }

    if (request.bounds) {
      query = query.where(
        and(
          gte(geoLocations.lat, request.bounds.south),
          lte(geoLocations.lat, request.bounds.north),
          gte(geoLocations.lng, request.bounds.west),
          lte(geoLocations.lng, request.bounds.east)
        )
      );
    }

    const locations = await query;
    const geoLocationsData: GeoLocation[] = locations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    }));

    return createHeatmapGrid(geoLocationsData, config);
  }

  async generateHeatmapForTrack(trackId: string, config?: Partial<HeatmapConfig>): Promise<HeatmapPoint[]> {
    const locations = await this.db
      .select()
      .from(geoLocations)
      .where(inArray(geoLocations.randomizedId, [trackId]));

    const geoLocationsData: GeoLocation[] = locations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    }));

    const heatmapConfig: HeatmapConfig = {
      gridSize: config?.gridSize || HEATMAP_CONFIG.DEFAULT_GRID_SIZE,
      radius: config?.radius || HEATMAP_CONFIG.DEFAULT_RADIUS,
      intensityThreshold: config?.intensityThreshold || HEATMAP_CONFIG.DEFAULT_INTENSITY_THRESHOLD,
      maxPoints: config?.maxPoints || HEATMAP_CONFIG.DEFAULT_MAX_POINTS,
    };

    return createHeatmapGrid(geoLocationsData, heatmapConfig);
  }

  async generateHeatmapForBounds(
    bounds: { north: number; south: number; east: number; west: number },
    config?: Partial<HeatmapConfig>
  ): Promise<HeatmapPoint[]> {
    return this.generateHeatmap({ bounds, config });
  }

  async getHeatmapStats(request: HeatmapRequest): Promise<{
    totalPoints: number;
    totalIntensity: number;
    averageIntensity: number;
    maxIntensity: number;
    minIntensity: number;
    config: HeatmapConfig;
  }> {
    const heatmapPoints = await this.generateHeatmap(request);
    const stats = calculateHeatmapStats(heatmapPoints);
    
    const config: HeatmapConfig = {
      gridSize: request.config?.gridSize || HEATMAP_CONFIG.DEFAULT_GRID_SIZE,
      radius: request.config?.radius || HEATMAP_CONFIG.DEFAULT_RADIUS,
      intensityThreshold: request.config?.intensityThreshold || HEATMAP_CONFIG.DEFAULT_INTENSITY_THRESHOLD,
      maxPoints: request.config?.maxPoints || HEATMAP_CONFIG.DEFAULT_MAX_POINTS,
    };

    return {
      ...stats,
      config,
    };
  }

  async getClusteredPoints(
    request: HeatmapRequest,
    clusteringDistance: number = HEATMAP_CONFIG.CLUSTERING_DISTANCE
  ): Promise<ClusteredPoint[]> {
    let query = this.db.select().from(geoLocations);

    if (request.trackIds && request.trackIds.length > 0) {
      query = query.where(inArray(geoLocations.randomizedId, request.trackIds));
    }

    if (request.bounds) {
      query = query.where(
        and(
          gte(geoLocations.lat, request.bounds.south),
          lte(geoLocations.lat, request.bounds.north),
          gte(geoLocations.lng, request.bounds.west),
          lte(geoLocations.lng, request.bounds.east)
        )
      );
    }

    const locations = await query;
    const geoLocationsData: GeoLocation[] = locations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    }));

    const clusters = clusterPoints(geoLocationsData, clusteringDistance);
    return clusters.map(calculateClusterProperties);
  }

  async getHeatmapForTimeRange(
    startTime: Date,
    endTime: Date,
    config?: Partial<HeatmapConfig>
  ): Promise<HeatmapPoint[]> {
    const locations = await this.db
      .select()
      .from(geoLocations)
      .where(
        and(
          gte(geoLocations.id, 1),
          lte(geoLocations.id, 1000000)
        )
      );

    const geoLocationsData: GeoLocation[] = locations.map(loc => ({
      id: loc.randomizedId,
      lat: loc.lat,
      lng: loc.lng,
      alt: loc.alt,
      spd: loc.spd,
      azm: loc.azm,
    }));

    const heatmapConfig: HeatmapConfig = {
      gridSize: config?.gridSize || HEATMAP_CONFIG.DEFAULT_GRID_SIZE,
      radius: config?.radius || HEATMAP_CONFIG.DEFAULT_RADIUS,
      intensityThreshold: config?.intensityThreshold || HEATMAP_CONFIG.DEFAULT_INTENSITY_THRESHOLD,
      maxPoints: config?.maxPoints || HEATMAP_CONFIG.DEFAULT_MAX_POINTS,
    };

    return createHeatmapGrid(geoLocationsData, heatmapConfig);
  }
}
