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

  useEffect(() => {
    if (!userId) return;

    const WS_PORT = 3001;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const WS_URL = `${protocol}://${window.location.hostname}:${WS_PORT}`;
    console.log('Attempting WebSocket connection to:', WS_URL);

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts.current = 0;
          ws.send(JSON.stringify({ type: 'subscribe', userId }));
          console.log('User subscribed to WebSocket:', userId);

          // Start heartbeat
          heartbeatRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
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
          console.warn('WebSocket connection closed');
          cleanup();
          scheduleReconnect();
        };

        ws.onerror = (err) => {
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
      if (reconnectTimeoutRef.current) return;
      const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts.current); // exponential backoff up to 10s
      console.log(`Attempting to reconnect in ${delay / 1000}s...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      cleanup();
      reconnectTimeoutRef.current && clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    };
  }, [userId, onPositionUpdate, onStockOrder, onPositionDeletion]); // Reconnect if userId changes or if the callback functions change
}
