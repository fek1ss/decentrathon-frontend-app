import { Elysia, t } from 'elysia';
import { DriverService } from '../services/driver.service';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse, DriverLocation, DriverRecommendation, GeoPoint } from '../types';

export const createDriverApi = (driverService: DriverService) => {
  return new Elysia({ prefix: '/drivers' })
    .post('/location', async ({ body }): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        const { driverId, lat, lng, status } = body as {
          driverId: string;
          lat: number;
          lng: number;
          status?: 'available' | 'busy' | 'offline';
        };

        await driverService.updateDriverLocation(driverId, lat, lng, status);

        return {
          success: true,
          data: { success: true },
          message: 'Driver location updated successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: { success: false },
          message: error instanceof Error ? error.message : 'Failed to update driver location'
        };
      }
    }, {
      body: t.Object({
        driverId: t.String(),
        lat: t.Number(),
        lng: t.Number(),
        status: t.Optional(t.Union([t.Literal('available'), t.Literal('busy'), t.Literal('offline')]))
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({
          success: t.Boolean()
        }),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Update driver location',
        description: 'Update driver location in Redis with anonymized data'
      }
    })

    .get('/location/:driverId', async ({ params }): Promise<ApiResponse<DriverLocation | null>> => {
      try {
        const { driverId } = params as { driverId: string };
        const location = await driverService.getDriverLocation(driverId);

        return {
          success: true,
          data: location,
          message: location ? 'Driver location found' : 'Driver location not found'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to get driver location'
        };
      }
    }, {
      params: t.Object({
        driverId: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Union([t.Object({
          id: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          timestamp: t.Number(),
          status: t.Union([t.Literal('available'), t.Literal('busy'), t.Literal('offline')])
        }), t.Null()]),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Get driver location',
        description: 'Get current location of a specific driver'
      }
    })

    .get('/nearby', async ({ query }): Promise<ApiResponse<DriverLocation[]>> => {
      try {
        const { lat, lng, radius } = query as {
          lat: number;
          lng: number;
          radius?: number;
        };

        const drivers = await driverService.getNearbyDrivers(lat, lng, radius || 1000);

        return {
          success: true,
          data: drivers,
          message: `Found ${drivers.length} nearby drivers`
        };
      } catch (error) {
        return {
          success: false,
          data: [],
          message: error instanceof Error ? error.message : 'Failed to get nearby drivers'
        };
      }
    }, {
      query: t.Object({
        lat: t.Number(),
        lng: t.Number(),
        radius: t.Optional(t.Number())
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          id: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          timestamp: t.Number(),
          status: t.Union([t.Literal('available'), t.Literal('busy'), t.Literal('offline')])
        })),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Get nearby drivers',
        description: 'Get all drivers within specified radius of a location'
      }
    })

    .get('/all', async (): Promise<ApiResponse<DriverLocation[]>> => {
      try {
        const drivers = await driverService.getAllDrivers();

        return {
          success: true,
          data: drivers,
          message: `Found ${drivers.length} total drivers`
        };
      } catch (error) {
        return {
          success: false,
          data: [],
          message: error instanceof Error ? error.message : 'Failed to get all drivers'
        };
      }
    }, {
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          id: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          timestamp: t.Number(),
          status: t.Union([t.Literal('available'), t.Literal('busy'), t.Literal('offline')])
        })),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Get all drivers',
        description: 'Get all active drivers in the system'
      }
    })

    .post('/recommendations', async ({ body }): Promise<ApiResponse<DriverRecommendation[]>> => {
      try {
        const { lat, lng, maxDistance } = body as {
          lat: number;
          lng: number;
          maxDistance?: number;
        };

        const recommendations = await driverService.getDemandRecommendations(
          { lat, lng },
          maxDistance || 5000
        );

        return {
          success: true,
          data: recommendations,
          message: `Found ${recommendations.length} demand recommendations`
        };
      } catch (error) {
        return {
          success: false,
          data: [],
          message: error instanceof Error ? error.message : 'Failed to get demand recommendations'
        };
      }
    }, {
      body: t.Object({
        lat: t.Number(),
        lng: t.Number(),
        maxDistance: t.Optional(t.Number())
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          point: t.Object({
            lat: t.Number(),
            lng: t.Number(),
            intensity: t.Number(),
            radius: t.Number(),
            driverCount: t.Number(),
            score: t.Number()
          }),
          distance: t.Number(),
          estimatedTime: t.Number(),
          competition: t.Number(),
          demand: t.Number(),
          finalScore: t.Number()
        })),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Get demand recommendations',
        description: 'Get recommended demand points for driver with competition analysis'
      }
    })

    .post('/best-demand', async ({ body }): Promise<ApiResponse<DriverRecommendation | null>> => {
      try {
        const { lat, lng, maxDistance } = body as {
          lat: number;
          lng: number;
          maxDistance?: number;
        };

        const bestPoint = await driverService.getBestDemandPoint(
          { lat, lng },
          maxDistance || 5000
        );

        return {
          success: true,
          data: bestPoint,
          message: bestPoint ? 'Best demand point found' : 'No suitable demand points found'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to get best demand point'
        };
      }
    }, {
      body: t.Object({
        lat: t.Number(),
        lng: t.Number(),
        maxDistance: t.Optional(t.Number())
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Union([t.Object({
          point: t.Object({
            lat: t.Number(),
            lng: t.Number(),
            intensity: t.Number(),
            radius: t.Number(),
            driverCount: t.Number(),
            score: t.Number()
          }),
          distance: t.Number(),
          estimatedTime: t.Number(),
          competition: t.Number(),
          demand: t.Number(),
          finalScore: t.Number()
        }), t.Null()]),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Get best demand point',
        description: 'Get the single best demand point recommendation for a driver'
      }
    })

    .delete('/:driverId', async ({ params }): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        const { driverId } = params as { driverId: string };
        await driverService.removeDriver(driverId);

        return {
          success: true,
          data: { success: true },
          message: 'Driver removed successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: { success: false },
          message: error instanceof Error ? error.message : 'Failed to remove driver'
        };
      }
    }, {
      params: t.Object({
        driverId: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({
          success: t.Boolean()
        }),
        message: t.Optional(t.String())
      }),
      detail: {
        tags: ['Drivers'],
        summary: 'Remove driver',
        description: 'Remove driver from the system'
      }
    });
};
