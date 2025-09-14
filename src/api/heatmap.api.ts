import { Elysia, t } from 'elysia';
import { HeatmapService } from '../services/heatmap.service';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../constants';
import { ApiResponse, HeatmapPoint, HeatmapRequest, ClusteredPoint } from '../types';

const HeatmapPointSchema = t.Object({
  lat: t.Number(),
  lng: t.Number(),
  radius: t.Number(),
  intensity: t.Number(),
  count: t.Number(),
});

const HeatmapConfigSchema = t.Object({
  gridSize: t.Optional(t.Number()),
  radius: t.Optional(t.Number()),
  intensityThreshold: t.Optional(t.Number()),
  maxPoints: t.Optional(t.Number()),
});

const BoundsSchema = t.Object({
  north: t.Number(),
  south: t.Number(),
  east: t.Number(),
  west: t.Number(),
});

const HeatmapRequestSchema = t.Object({
  bounds: t.Optional(BoundsSchema),
  config: t.Optional(HeatmapConfigSchema),
  trackIds: t.Optional(t.Array(t.String())),
});

export const createHeatmapApi = (heatmapService: HeatmapService) => {
  return new Elysia()
    .post(API_ENDPOINTS.HEATMAP, async ({ body }): Promise<ApiResponse<HeatmapPoint[]>> => {
      try {
        const request = body as HeatmapRequest;
        const heatmapPoints = await heatmapService.generateHeatmap(request);
        
        return {
          success: true,
          data: heatmapPoints,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: [],
          message,
        };
      }
    }, {
      body: HeatmapRequestSchema,
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(HeatmapPointSchema),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Heatmap'],
        summary: 'Generate heatmap from geo data',
        description: 'Create heatmap points with clustering and intensity calculation',
      },
    })

    .get(API_ENDPOINTS.HEATMAP_TRACK, async ({ params, query }): Promise<ApiResponse<HeatmapPoint[]>> => {
      try {
        const config = {
          gridSize: query.gridSize ? parseFloat(query.gridSize) : undefined,
          radius: query.radius ? parseFloat(query.radius) : undefined,
          intensityThreshold: query.intensityThreshold ? parseFloat(query.intensityThreshold) : undefined,
          maxPoints: query.maxPoints ? parseInt(query.maxPoints) : undefined,
        };

        const heatmapPoints = await heatmapService.generateHeatmapForTrack(params.trackId, config);
        
        return {
          success: true,
          data: heatmapPoints,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: [],
          message,
        };
      }
    }, {
      params: t.Object({
        trackId: t.String(),
      }),
      query: t.Object({
        gridSize: t.Optional(t.String()),
        radius: t.Optional(t.String()),
        intensityThreshold: t.Optional(t.String()),
        maxPoints: t.Optional(t.String()),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(HeatmapPointSchema),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Heatmap'],
        summary: 'Generate heatmap for specific track',
        description: 'Create heatmap points for a specific geo track',
      },
    })

    .post(API_ENDPOINTS.HEATMAP_BOUNDS, async ({ body }): Promise<ApiResponse<HeatmapPoint[]>> => {
      try {
        const { bounds, config } = body as { bounds: any; config?: any };
        const heatmapPoints = await heatmapService.generateHeatmapForBounds(bounds, config);
        
        return {
          success: true,
          data: heatmapPoints,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: [],
          message,
        };
      }
    }, {
      body: t.Object({
        bounds: BoundsSchema,
        config: t.Optional(HeatmapConfigSchema),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(HeatmapPointSchema),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Heatmap'],
        summary: 'Generate heatmap for bounds',
        description: 'Create heatmap points for specific geographic bounds',
      },
    })

    .post(API_ENDPOINTS.HEATMAP_STATS, async ({ body }): Promise<ApiResponse<any>> => {
      try {
        const request = body as HeatmapRequest;
        const stats = await heatmapService.getHeatmapStats(request);
        
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: null,
          message,
        };
      }
    }, {
      body: HeatmapRequestSchema,
      response: t.Object({
        success: t.Boolean(),
        data: t.Any(),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Heatmap'],
        summary: 'Get heatmap statistics',
        description: 'Get statistics about heatmap generation',
      },
    })

    .post(API_ENDPOINTS.HEATMAP_CLUSTERS, async ({ body }): Promise<ApiResponse<ClusteredPoint[]>> => {
      try {
        const { request, clusteringDistance } = body as { 
          request: HeatmapRequest; 
          clusteringDistance?: number; 
        };
        const clusters = await heatmapService.getClusteredPoints(request, clusteringDistance);
        
        return {
          success: true,
          data: clusters,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: [],
          message,
        };
      }
    }, {
      body: t.Object({
        request: HeatmapRequestSchema,
        clusteringDistance: t.Optional(t.Number()),
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          center: t.Object({
            lat: t.Number(),
            lng: t.Number(),
          }),
          points: t.Array(t.Object({
            id: t.String(),
            lat: t.Number(),
            lng: t.Number(),
            alt: t.Number(),
            spd: t.Number(),
            azm: t.Number(),
          })),
          radius: t.Number(),
          intensity: t.Number(),
          count: t.Number(),
        })),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Heatmap'],
        summary: 'Get clustered points',
        description: 'Get clustered geo points with detailed information',
      },
    });
};
