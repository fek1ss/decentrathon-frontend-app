import { WebSocket } from 'ws';
import { RouteService } from './route.service';
import { DriverService } from './driver.service';
import { RealtimeTracking, LocationUpdate, GeoPoint, RouteResponse, SocketMessage, TrackingConfig } from '../types';
import { SOCKET_CONFIG, SOCKET_EVENTS } from '../constants';

export class RealtimeTrackingService {
  private clients: Map<string, WebSocket> = new Map();
  private trackingData: Map<string, RealtimeTracking> = new Map();
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private config: TrackingConfig;

  constructor(
    private routeService: RouteService,
    private driverService?: DriverService,
    config?: Partial<TrackingConfig>
  ) {
    this.config = {
      updateInterval: config?.updateInterval || SOCKET_CONFIG.LOCATION_UPDATE_INTERVAL,
      routeRecalculationThreshold: config?.routeRecalculationThreshold || SOCKET_CONFIG.ROUTE_RECALCULATION_THRESHOLD,
      maxRouteAge: config?.maxRouteAge || SOCKET_CONFIG.MAX_ROUTE_AGE,
    };
  }

  addClient(clientId: string, socket: WebSocket): void {
    this.clients.set(clientId, socket);
    this.setupClientHandlers(clientId, socket);
    this.startPingInterval(clientId);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.trackingData.delete(clientId);
    this.clearIntervals(clientId);
  }

  private setupClientHandlers(clientId: string, socket: WebSocket): void {
    socket.on('message', (data) => {
      try {
        const message: SocketMessage = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        this.sendError(clientId, 'Invalid message format');
      }
    });

    socket.on('close', () => {
      this.removeClient(clientId);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });
  }

  private handleMessage(clientId: string, message: SocketMessage): void {
    switch (message.type) {
      case 'location_update':
        this.handleLocationUpdate(clientId, message.data);
        break;
      case 'route_request':
        this.handleRouteRequest(clientId, message.data);
        break;
      case 'start_tracking':
        this.startTracking(clientId, message.data);
        break;
      case 'stop_tracking':
        this.stopTracking(clientId);
        break;
      case 'pong':
        this.handlePong(clientId);
        break;
      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  private handleLocationUpdate(clientId: string, location: LocationUpdate): void {
    const tracking = this.trackingData.get(clientId);
    if (!tracking) return;

    tracking.currentLocation = location;
    tracking.lastUpdate = Date.now();

    this.checkRouteRecalculation(clientId, tracking);
    this.broadcastLocationUpdate(clientId, location);

    if (this.driverService && tracking.isDriver) {
      this.driverService.updateDriverLocation(
        clientId,
        location.lat,
        location.lng,
        'available'
      );
    }
  }

  private async handleRouteRequest(clientId: string, data: { destination: GeoPoint; profile?: string }): Promise<void> {
    const tracking = this.trackingData.get(clientId);
    if (!tracking) return;

    try {
      const route = await this.routeService.getRoute({
        startPoint: tracking.currentLocation,
        endPoint: data.destination,
        profile: data.profile || 'driving',
      });

      tracking.destination = data.destination;
      tracking.route = route;

      this.sendMessage(clientId, {
        type: 'route_response',
        data: route,
        timestamp: Date.now(),
        clientId,
      });
    } catch (error) {
      this.sendError(clientId, `Route calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkRouteRecalculation(clientId: string, tracking: RealtimeTracking): Promise<void> {
    if (!tracking.route || !tracking.destination) return;

    const routeAge = Date.now() - tracking.lastUpdate;
    if (routeAge > this.config.maxRouteAge) {
      await this.recalculateRoute(clientId, tracking);
      return;
    }

    const distanceFromRoute = this.calculateDistanceFromRoute(tracking.currentLocation, tracking.route);
    if (distanceFromRoute > this.config.routeRecalculationThreshold) {
      await this.recalculateRoute(clientId, tracking);
    }
  }

  private async recalculateRoute(clientId: string, tracking: RealtimeTracking): Promise<void> {
    if (!tracking.destination) return;

    try {
      const newRoute = await this.routeService.getRoute({
        startPoint: tracking.currentLocation,
        endPoint: tracking.destination,
        profile: 'driving',
      });

      tracking.route = newRoute;

      this.sendMessage(clientId, {
        type: 'route_response',
        data: newRoute,
        timestamp: Date.now(),
        clientId,
      });
    } catch (error) {
      console.error(`Route recalculation failed for client ${clientId}:`, error);
    }
  }

  private calculateDistanceFromRoute(location: LocationUpdate, route: RouteResponse): number {
    let minDistance = Infinity;
    
    for (const point of route.route) {
      const distance = this.calculateDistance(
        { lat: location.lat, lng: location.lng },
        point
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371e3;
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private startTracking(clientId: string, data: { location: LocationUpdate; destination?: GeoPoint; isDriver?: boolean }): void {
    const tracking: RealtimeTracking = {
      clientId,
      currentLocation: data.location,
      destination: data.destination,
      isTracking: true,
      lastUpdate: Date.now(),
      isDriver: data.isDriver || false,
    };

    this.trackingData.set(clientId, tracking);
    this.startUpdateInterval(clientId);
    this.sendMessage(clientId, { type: 'tracking_started', data: { clientId } });

    if (this.driverService && data.isDriver) {
      this.driverService.updateDriverLocation(
        clientId,
        data.location.lat,
        data.location.lng,
        'available'
      );
    }
  }

  private stopTracking(clientId: string): void {
    const tracking = this.trackingData.get(clientId);
    if (tracking) {
      tracking.isTracking = false;
    }
    this.clearUpdateInterval(clientId);
  }

  private startPingInterval(clientId: string): void {
    const interval = setInterval(() => {
      this.sendPing(clientId);
    }, SOCKET_CONFIG.PING_INTERVAL);

    this.pingIntervals.set(clientId, interval);
  }

  private startUpdateInterval(clientId: string): void {
    const interval = setInterval(() => {
      this.requestLocationUpdate(clientId);
    }, this.config.updateInterval);

    this.updateIntervals.set(clientId, interval);
  }

  private requestLocationUpdate(clientId: string): void {
    this.sendMessage(clientId, {
      type: 'ping',
      data: { request: 'location_update' },
      timestamp: Date.now(),
      clientId,
    });
  }

  private sendPing(clientId: string): void {
    this.sendMessage(clientId, {
      type: 'ping',
      data: { request: 'pong' },
      timestamp: Date.now(),
      clientId,
    });
  }

  private handlePong(clientId: string): void {
    const tracking = this.trackingData.get(clientId);
    if (tracking) {
      tracking.lastUpdate = Date.now();
    }
  }

  private sendMessage(clientId: string, message: SocketMessage): void {
    const socket = this.clients.get(clientId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'error',
      data: { error },
      timestamp: Date.now(),
      clientId,
    });
  }

  private broadcastLocationUpdate(clientId: string, location: LocationUpdate): void {
    const message: SocketMessage = {
      type: 'location_update',
      data: { clientId, location },
      timestamp: Date.now(),
    };

    this.clients.forEach((socket, id) => {
      if (id !== clientId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }

  private clearIntervals(clientId: string): void {
    this.clearPingInterval(clientId);
    this.clearUpdateInterval(clientId);
  }

  private clearPingInterval(clientId: string): void {
    const interval = this.pingIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.pingIntervals.delete(clientId);
    }
  }

  private clearUpdateInterval(clientId: string): void {
    const interval = this.updateIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(clientId);
    }
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getTrackingData(clientId: string): RealtimeTracking | undefined {
    return this.trackingData.get(clientId);
  }

  getAllTrackingData(): RealtimeTracking[] {
    return Array.from(this.trackingData.values());
  }
}
