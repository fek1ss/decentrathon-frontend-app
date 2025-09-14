import { Elysia, t } from 'elysia';
import { GeoTrackService } from '../services/geo-track.service';
import { DEFAULT_GEO_OPTIONS, API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { ApiResponse, GeoTrack, GeoTrackStats } from '../types';

const GeoTrackResponse = t.Object({
  success: t.Boolean(),
  data: t.Any(),
  message: t.Optional(t.String()),
});

const GeoTrackCountResponse = t.Object({
  success: t.Boolean(),
  data: t.Object({
    count: t.Number(),
  }),
  message: t.Optional(t.String()),
});

const GeoTrackStatsResponse = t.Object({
  success: t.Boolean(),
  data: t.Object({
    totalTracks: t.Number(),
    totalPoints: t.Number(),
    averagePointsPerTrack: t.Number(),
  }),
  message: t.Optional(t.String()),
});

export const createGeoTrackApi = (geoTrackService: GeoTrackService) => {
  return new Elysia()
    .get(API_ENDPOINTS.GEO_TRACKS_COUNT, async (): Promise<ApiResponse<{ count: number }>> => {
      try {
        const count = await geoTrackService.getUniqueTrackCount();
        return {
          success: true,
          data: { count },
        };
      } catch (error) {
        return {
          success: false,
          data: { count: 0 },
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        };
      }
    })

    .get(API_ENDPOINTS.GEO_TRACKS_STATS, async (): Promise<ApiResponse<GeoTrackStats>> => {
      try {
        const stats = await geoTrackService.getTrackStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        return {
          success: false,
          data: {
            totalTracks: 0,
            totalPoints: 0,
            averagePointsPerTrack: 0,
          },
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        };
      }
    })

    .get(API_ENDPOINTS.GEO_TRACKS, async ({ query }): Promise<ApiResponse<GeoTrack[]>> => {
      try {
        const options = {
          includeRoute: query.includeRoute === 'true',
          includeDistance: query.includeDistance === 'true',
        };

        const tracks = await geoTrackService.getAllTracks(options);
        return {
          success: true,
          data: tracks,
        };
      } catch (error) {
        return {
          success: false,
          data: [],
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        };
      }
    }, {
      query: t.Object({
        includeRoute: t.Optional(t.String()),
        includeDistance: t.Optional(t.String()),
      }),
    })

    .get(API_ENDPOINTS.GEO_TRACK_BY_ID, async ({ params, query }): Promise<ApiResponse<GeoTrack | null>> => {
      try {
        const options = {
          includeRoute: query.includeRoute === 'true',
          includeDistance: query.includeDistance === 'true',
        };

        const track = await geoTrackService.getTrackById(params.id, options);
        
        if (!track) {
          return {
            success: false,
            data: null,
            message: ERROR_MESSAGES.TRACK_NOT_FOUND,
          };
        }

        return {
          success: true,
          data: track,
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        };
      }
    }, {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        includeRoute: t.Optional(t.String()),
        includeDistance: t.Optional(t.String()),
      }),
    });
};
