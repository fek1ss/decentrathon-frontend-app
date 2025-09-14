import axios from 'axios';
import { RouteRequest, RouteResponse, OSRMRoute, GeoPoint, RouteProfile } from '../types';
import { OSRM_CONFIG, ERROR_MESSAGES } from '../constants';

export class RouteService {
  private validateCoordinates(point: GeoPoint): boolean {
    return (
      point.lat >= -90 && point.lat <= 90 &&
      point.lng >= -180 && point.lng <= 180
    );
  }

  private formatCoordinates(point: GeoPoint): string {
    return `${point.lng},${point.lat}`;
  }

  private parseOSRMResponse(osrmResponse: OSRMRoute, profile: string): RouteResponse {
    const coordinates = osrmResponse.geometry.coordinates;
    const route: GeoPoint[] = coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1],
    }));

    const instructions: string[] = [];
    osrmResponse.legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.maneuver.instruction) {
          instructions.push(step.maneuver.instruction);
        }
      });
    });

    return {
      route,
      distance: osrmResponse.distance,
      duration: osrmResponse.duration,
      profile,
      instructions,
    };
  }

  async getRoute(request: RouteRequest): Promise<RouteResponse> {
    if (!this.validateCoordinates(request.startPoint) || !this.validateCoordinates(request.endPoint)) {
      throw new Error(ERROR_MESSAGES.INVALID_COORDINATES);
    }

    const profile: RouteProfile = request.profile || 'driving';
    
    if (!OSRM_CONFIG.PROFILES[profile]) {
      throw new Error(ERROR_MESSAGES.INVALID_ROUTE_TYPE);
    }
    
    const osrmProfile = OSRM_CONFIG.PROFILES[profile];
    const startCoords = this.formatCoordinates(request.startPoint);
    const endCoords = this.formatCoordinates(request.endPoint);

    try {
      const response = await axios.get(
        `${OSRM_CONFIG.BASE_URL}/${osrmProfile}/${startCoords};${endCoords}`,
        {
          params: {
            overview: 'full',
            steps: 'true',
            geometries: 'geojson',
          },
          timeout: 10000,
        }
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
      }

      return this.parseOSRMResponse(response.data.routes[0], profile);
    } catch (error) {
      if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error(ERROR_MESSAGES.INVALID_COORDINATES);
      }
      if (error.response?.status === 404) {
        throw new Error(ERROR_MESSAGES.ROUTE_NOT_FOUND);
      }
      if (error.response?.status >= 500) {
        throw new Error(ERROR_MESSAGES.INTERNAL_ERROR);
      }
      }
      throw new Error(ERROR_MESSAGES.INTERNAL_ERROR);
    }
  }

  async getMultipleRoutes(requests: RouteRequest[]): Promise<RouteResponse[]> {
    const promises = requests.map(request => this.getRoute(request));
    return Promise.all(promises);
  }
}
