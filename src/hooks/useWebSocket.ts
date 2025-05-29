import { useEffect, useRef } from 'react';
import { OpenPosition, StockOrder } from '../components/Dashboard';

export interface PositionUpdatePayload {
  type: 'position_update';
  payload: OpenPosition;
}

export interface OrderUpdatePayload {
  type: 'order_update';
  payload: StockOrder;
}

export interface PositionDeletionPayload {
  type: 'position_deletion';
  payload: {
    symbol: string;
  };
}

export function useWebSocket(
  userId: string,
  onPositionUpdate: (payload: OpenPosition) => void,
  onStockOrder?: (payload: StockOrder) => void,
  onPositionDeletion?: (symbol: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    if (!userId) return;

    const WS_PORT = 3001;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const WS_URL = `${protocol}://${window.location.hostname}:${WS_PORT}`;
    console.log('Attempting WebSocket connection to:', WS_URL);

    const connect = () => {
      if (!isComponentMounted.current) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted.current) {
            ws.close();
            return;
          }
          console.log('WebSocket connected');
          reconnectAttempts.current = 0;
          ws.send(JSON.stringify({ type: 'subscribe', userId }));
          console.log('User subscribed to WebSocket:', userId);

          // Start heartbeat
          heartbeatRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && isComponentMounted.current) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted.current) return;
          try {
            const message = JSON.parse(event.data);
            console.log('Websocket event message received:', message.type);
            switch (message.type) {
              case 'position_update':
                onPositionUpdate(message.payload);
                break;
              case 'order_update':
                onStockOrder?.(message.payload);
                break;
              case 'position_deletion':
                onPositionDeletion?.(message.payload.symbol);
                break;
              case 'pong':
                // Optional: log heartbeat acknowledgment
                break;
              default:
                console.warn('Unhandled message type:', message.type);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', event.data);
          }
        };

        ws.onclose = () => {
          if (!isComponentMounted.current) return;
          console.warn('WebSocket connection closed');
          cleanup();
          scheduleReconnect();
        };

        ws.onerror = (err) => {
          if (!isComponentMounted.current) return;
          console.error('WebSocket error:', err);
          ws.close(); // Triggers `onclose`
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
      }              
    };

    const cleanup = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', userId }));
          }
          wsRef.current.close();
        } catch (err) {
          console.error('Error cleaning up WebSocket:', err);
        }
        wsRef.current = null;
      }
    };
    
    const scheduleReconnect = () => {
      if (!isComponentMounted.current) return;
      if (reconnectTimeoutRef.current) return;
      const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts.current);
      console.log(`Attempting to reconnect in ${delay / 1000}s...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isComponentMounted.current) return;
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      isComponentMounted.current = false;
      cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [userId, onPositionUpdate, onStockOrder, onPositionDeletion]);
}
