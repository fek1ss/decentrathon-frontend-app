import { Elysia } from 'elysia';
import { WebSocketServer } from 'ws';
import { RealtimeTrackingService } from '../services/realtime-tracking.service';
import { RouteService } from '../services/route.service';
import { SOCKET_EVENTS } from '../constants';

export const createWebSocketApi = (realtimeTrackingService: RealtimeTrackingService) => {

  return new Elysia()
    .ws('/ws', {
      message(ws, message) {
        try {
          const data = JSON.parse(message.toString());
          ws.send(JSON.stringify({
            type: 'echo',
            data,
            timestamp: Date.now(),
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { error: 'Invalid JSON' },
            timestamp: Date.now(),
          }));
        }
      },
      open(ws) {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        (ws as any).clientId = clientId;
        
        realtimeTrackingService.addClient(clientId, ws as any);
        
        ws.send(JSON.stringify({
          type: 'connection',
          data: { clientId, message: 'Connected to realtime tracking' },
          timestamp: Date.now(),
        }));
      },
      close(ws) {
        const clientId = (ws as any).clientId;
        if (clientId) {
          realtimeTrackingService.removeClient(clientId);
        }
      },
    })
    .get('/ws/clients', () => ({
      activeClients: realtimeTrackingService.getActiveClients(),
      totalClients: realtimeTrackingService.getActiveClients().length,
    }))
    .get('/ws/tracking/:clientId', ({ params }) => {
      const trackingData = realtimeTrackingService.getTrackingData(params.clientId);
      if (!trackingData) {
        return { error: 'Client not found' };
      }
      return trackingData;
    })
    .get('/ws/tracking', () => ({
      trackingData: realtimeTrackingService.getAllTrackingData(),
    }));
};
