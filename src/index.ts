import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger';
import { createConnection } from './db/connection';
import { GeoTrackService } from './services/geo-track.service';
import { RouteService } from './services/route.service';
import { HeatmapService } from './services/heatmap.service';
import { createGeoTrackApi } from './api/geo-track.api';
import { createRouteApi } from './api/route.api';
import { createWebSocketApi } from './api/websocket.api';
import { createHeatmapApi } from './api/heatmap.api';
import { createDriverApi } from './api/driver.api';
import { DriverService } from './services/driver.service';
import { RealtimeTrackingService } from './services/realtime-tracking.service';
import { redisClient } from './db/redis';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'indrive_hackaton',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

const db = createConnection(config);
const geoTrackService = new GeoTrackService(db);
const routeService = new RouteService();
const heatmapService = new HeatmapService(db);
const driverService = new DriverService(heatmapService, routeService);
const realtimeTrackingService = new RealtimeTrackingService(routeService, driverService);

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Geo Track API',
        version: '1.0.0',
        description: 'API for managing and analyzing geo tracks data with OpenStreetMap routing and heatmap generation',
      },
      tags: [
        { name: 'GeoTracks', description: 'Geo tracks operations' },
        { name: 'Routes', description: 'Route calculation using OpenStreetMap' },
        { name: 'Heatmap', description: 'Heatmap generation and clustering' },
        { name: 'Drivers', description: 'Driver location tracking and demand recommendations' },
      ],
    },
  }))
  .use(createGeoTrackApi(geoTrackService))
  .use(createRouteApi(routeService))
  .use(createWebSocketApi(realtimeTrackingService))
  .use(createHeatmapApi(heatmapService))
  .use(createDriverApi(driverService))
  .get("/", () => ({
    message: "Geo Track API with OpenStreetMap Routing, Realtime Tracking & Heatmap Generation",
    documentation: "/swagger",
    websocketClient: "/websocket-client.html",
    endpoints: {
      tracks: "/geo-tracks",
      tracksCount: "/geo-tracks/count",
      tracksStats: "/geo-tracks/stats",
      trackById: "/geo-tracks/:id",
      route: "POST /route - calculate route between two points",
      routes: "POST /routes - calculate multiple routes",
      routeTypes: "GET /route-types - get available transportation types",
      websocket: "WS /ws - realtime tracking and route updates",
      wsClients: "GET /ws/clients - get active WebSocket clients",
      wsTracking: "GET /ws/tracking - get all tracking data",
      heatmap: "POST /heatmap - generate heatmap from geo data",
      heatmapTrack: "GET /heatmap/track/:id - heatmap for specific track",
      heatmapBounds: "POST /heatmap/bounds - heatmap for geographic bounds",
      heatmapStats: "POST /heatmap/stats - heatmap statistics",
      heatmapClusters: "POST /heatmap/clusters - clustered points",
      driverLocation: "POST /drivers/location - update driver location",
      driverRecommendations: "POST /drivers/recommendations - get demand recommendations",
      driverBestDemand: "POST /drivers/best-demand - get best demand point",
    },
    queryParams: {
      includeRoute: "boolean - include route points",
      includeDistance: "boolean - include distance calculation",
    },
    availableTransportTypes: {
      driving: "Car route with road access",
      walking: "Pedestrian route with sidewalks", 
      cycling: "Bicycle route with bike lanes",
      bus: "Public transport route with bus stops",
    },
    websocketFeatures: {
      realtimeTracking: "Real-time location updates",
      routeRecalculation: "Automatic route updates when off-course",
      multipleClients: "Support for multiple tracking clients",
      pingPong: "Connection health monitoring",
    },
  }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`📚 Swagger documentation: http://${app.server?.hostname}:${app.server?.port}/swagger`);
