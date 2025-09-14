export const EARTH_RADIUS_KM = 6371;

import { GeoTrackOptions } from '../types';

export const DEFAULT_GEO_OPTIONS: GeoTrackOptions = {
  includeRoute: false,
  includeDistance: false,
};

export const API_ENDPOINTS = {
  GEO_TRACKS: '/geo-tracks',
  GEO_TRACKS_COUNT: '/geo-tracks/count',
  GEO_TRACKS_STATS: '/geo-tracks/stats',
  GEO_TRACK_BY_ID: '/geo-tracks/:id',
  ROUTE: '/route',
  ROUTES: '/routes',
  ROUTE_TYPES: '/route-types',
  HEATMAP: '/heatmap',
  HEATMAP_TRACK: '/heatmap/track/:trackId',
  HEATMAP_BOUNDS: '/heatmap/bounds',
  HEATMAP_STATS: '/heatmap/stats',
  HEATMAP_CLUSTERS: '/heatmap/clusters',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  TRACK_NOT_FOUND: 'GeoTrack not found',
  INVALID_PARAMETERS: 'Invalid parameters provided',
  INTERNAL_ERROR: 'Internal server error',
  ROUTE_NOT_FOUND: 'Route not found',
  INVALID_COORDINATES: 'Invalid coordinates provided',
  INVALID_ROUTE_TYPE: 'Invalid route type provided',
  DATABASE_ERROR: 'Database operation failed',
} as const;

export const OSRM_CONFIG = {
  BASE_URL: 'https://router.project-osrm.org/route/v1',
  PROFILES: {
    driving: 'driving',
    walking: 'foot',
    cycling: 'cycling',
    bus: 'driving',
  },
} as const;

export const ROUTE_TYPES: RouteType[] = [
  {
    id: 'walking',
    name: 'Walking',
    description: 'Pedestrian route',
    icon: '🚶',
    color: '#4CAF50',
    osrmProfile: 'foot',
    speed: 5,
    emissions: 0,
  },
  {
    id: 'cycling',
    name: 'Cycling',
    description: 'Bicycle route',
    icon: '🚴',
    color: '#2196F3',
    osrmProfile: 'cycling',
    speed: 15,
    emissions: 0,
  },
  {
    id: 'bus',
    name: 'Public Transport',
    description: 'Public transportation route',
    icon: '🚌',
    color: '#FF9800',
    osrmProfile: 'driving',
    speed: 25,
    emissions: 0.1,
  },
  {
    id: 'driving',
    name: 'Driving',
    description: 'Car route',
    icon: '🚗',
    color: '#F44336',
    osrmProfile: 'driving',
    speed: 50,
    emissions: 0.2,
  },
] as const;

export const SOCKET_CONFIG = {
  PING_INTERVAL: 30000,
  PONG_TIMEOUT: 5000,
  LOCATION_UPDATE_INTERVAL: 5000,
  ROUTE_RECALCULATION_THRESHOLD: 100,
  MAX_ROUTE_AGE: 300000,
} as const;

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  LOCATION_UPDATE: 'location_update',
  ROUTE_REQUEST: 'route_request',
  ROUTE_RESPONSE: 'route_response',
  START_TRACKING: 'start_tracking',
  STOP_TRACKING: 'stop_tracking',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
} as const;

export const HEATMAP_CONFIG = {
  DEFAULT_GRID_SIZE: 0.001,
  DEFAULT_RADIUS: 100,
  DEFAULT_INTENSITY_THRESHOLD: 0.1,
  DEFAULT_MAX_POINTS: 1000,
  CLUSTERING_DISTANCE: 50,
} as const;
