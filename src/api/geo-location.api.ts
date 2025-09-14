import { Elysia } from 'elysia';
import { GeoLocationService } from '../services/geo-location.service';

export const createGeoLocationApi = (geoLocationService: GeoLocationService) => {
  return new Elysia()
    .get('/geo-locations', async () => {
      const locations = await geoLocationService.getAll();
      return { data: locations, count: locations.length };
    })
    .get('/geo-locations/count', async () => {
      const count = await geoLocationService.getCount();
      return { count };
    });
};
