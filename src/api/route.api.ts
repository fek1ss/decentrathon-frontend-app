import { Elysia, t } from 'elysia';
import { RouteService } from '../services/route.service';
import { API_ENDPOINTS, ERROR_MESSAGES, ROUTE_TYPES } from '../constants';
import { ApiResponse, RouteRequest, RouteResponse, RouteType } from '../types';

const GeoPointSchema = t.Object({
  lat: t.Number({
    minimum: -90,
    maximum: 90,
    description: 'Latitude coordinate',
  }),
  lng: t.Number({
    minimum: -180,
    maximum: 180,
    description: 'Longitude coordinate',
  }),
});

const RouteRequestSchema = t.Object({
  startPoint: GeoPointSchema,
  endPoint: GeoPointSchema,
  profile: t.Optional(t.Union([
    t.Literal('driving'),
    t.Literal('walking'),
    t.Literal('cycling'),
    t.Literal('bus'),
  ], {
    description: 'Route profile type',
    default: 'driving',
  })),
});

const RouteResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    route: t.Array(GeoPointSchema),
    distance: t.Number(),
    duration: t.Number(),
    profile: t.String(),
    instructions: t.Optional(t.Array(t.String())),
  }),
  message: t.Optional(t.String()),
});

export const createRouteApi = (routeService: RouteService) => {
  return new Elysia()
    .get(API_ENDPOINTS.ROUTE_TYPES, (): ApiResponse<RouteType[]> => {
      return {
        success: true,
        data: ROUTE_TYPES,
      };
    }, {
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          id: t.String(),
          name: t.String(),
          description: t.String(),
          icon: t.String(),
          color: t.String(),
          osrmProfile: t.String(),
          speed: t.Number(),
          emissions: t.Number(),
        })),
      }),
      detail: {
        tags: ['Routes'],
        summary: 'Get available route types',
        description: 'Get list of available transportation types for routing with metadata',
      },
    })
    .post(API_ENDPOINTS.ROUTE, async ({ body }): Promise<ApiResponse<RouteResponse>> => {
      try {
        const routeRequest = body as RouteRequest;
        const route = await routeService.getRoute(routeRequest);
        
        return {
          success: true,
          data: route,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
        
        return {
          success: false,
          data: {
            route: [],
            distance: 0,
            duration: 0,
            profile: 'driving',
            instructions: [],
          },
          message,
        };
      }
    }, {
      body: RouteRequestSchema,
      response: RouteResponseSchema,
      detail: {
        tags: ['Routes'],
        summary: 'Calculate route between two points',
        description: 'Calculate optimal route between start and end points using OpenStreetMap with specified transportation type',
      },
    })

    .post(API_ENDPOINTS.ROUTES, async ({ body }): Promise<ApiResponse<RouteResponse[]>> => {
      try {
        const routeRequests = body as RouteRequest[];
        const routes = await routeService.getMultipleRoutes(routeRequests);
        
        return {
          success: true,
          data: routes,
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
      body: t.Array(RouteRequestSchema),
      response: t.Object({
        success: t.Boolean(),
        data: t.Array(t.Object({
          route: t.Array(GeoPointSchema),
          distance: t.Number(),
          duration: t.Number(),
          profile: t.String(),
          instructions: t.Optional(t.Array(t.String())),
        })),
        message: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Routes'],
        summary: 'Calculate multiple routes',
        description: 'Calculate multiple routes in batch with different transportation types',
      },
    });
};
