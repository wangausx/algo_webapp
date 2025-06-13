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

export interface WarningPayload {
  type: 'warning';
  message: string;
}

export function useWebSocket(
  userId: string,
  onPositionUpdate: (payload: OpenPosition) => void,
  onStockOrder?: (payload: StockOrder) => void,
  onPositionDeletion?: (symbol: string) => void,
  onWarning?: (message: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnecting = useRef(false);
  const isSubscribed = useRef(false);

  // Add logging for dependency changes
  useEffect(() => {
    // Only log if we don't have an active connection
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket hook dependencies changed, checking connection status:', {
        userId,
        hasPositionUpdate: !!onPositionUpdate,
        hasStockOrder: !!onStockOrder,
        hasPositionDeletion: !!onPositionDeletion,
        hasWarning: !!onWarning,
        timestamp: new Date().toISOString()
      });
    }
  }, [userId, onPositionUpdate, onStockOrder, onPositionDeletion, onWarning]);

  useEffect(() => {
    if (!userId) {
      console.log('No userId provided, skipping WebSocket connection');
      return;
    }

    const WS_PORT = 3001;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const WS_URL = `${protocol}://${window.location.hostname}:${WS_PORT}`;
    console.log('Attempting WebSocket connection to:', WS_URL);

    const connect = () => {
      if (isConnecting.current) {
        console.log('Connection already in progress, skipping');
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, skipping connection');
        return;
      }

      try {
        isConnecting.current = true;
        console.log('Creating new WebSocket connection');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            isConnecting.current = false;
            ws.close();
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          isConnecting.current = false;
          console.log('WebSocket connected successfully');
          reconnectAttempts.current = 0;
          
          // Only send subscription if not already subscribed
          if (!isSubscribed.current) {
            const subscribeMessage = { type: 'subscribe', userId };
            console.log('Sending subscription message:', subscribeMessage);
            ws.send(JSON.stringify(subscribeMessage));
            console.log('User subscribed to WebSocket:', userId);
          }

          // Start heartbeat
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
          }
          heartbeatRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);
            
            switch (message.type) {
              case 'connection_established':
                console.log('Connection established:', message);
                isSubscribed.current = true;
                break;
              case 'position_update':
                console.log('Handling position update:', message.payload);
                onPositionUpdate(message.payload);
                break;
              case 'order_update':
                console.log('Handling order update:', message.payload);
                if (onStockOrder) {
                  console.log('Calling onStockOrder callback with payload:', message.payload);
                  onStockOrder(message.payload);
                } else {
                  console.warn('onStockOrder callback is not provided');
                }
                break;
              case 'position_deletion':
                console.log('Handling position deletion:', message.payload);
                onPositionDeletion?.(message.payload.symbol);
                break;
              case 'warning':
                console.log('Received warning:', message.message);
                onWarning?.(message.message);
                break;
              case 'pong':
                console.log('Received pong response');
                break;
              default:
                console.warn('Unhandled message type:', message.type);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', event.data, err);
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          isConnecting.current = false;
          isSubscribed.current = false;
          console.warn('WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            timestamp: new Date().toISOString()
          });
          
          // Log specific close codes
          switch (event.code) {
            case 1000:
              console.log('Normal closure');
              break;
            case 1001:
              console.log('Going away - endpoint is going away');
              break;
            case 1002:
              console.log('Protocol error');
              break;
            case 1003:
              console.log('Unsupported data');
              break;
            case 1005:
              console.log('No status received');
              break;
            case 1006:
              console.log('Abnormal closure');
              break;
            case 1007:
              console.log('Invalid frame payload data');
              break;
            case 1008:
              console.log('Policy violation');
              break;
            case 1009:
              console.log('Message too big');
              break;
            case 1010:
              console.log('Missing extension');
              break;
            case 1011:
              console.log('Internal error');
              break;
            case 1012:
              console.log('Service restart');
              break;
            case 1013:
              console.log('Try again later');
              break;
            case 1014:
              console.log('Bad gateway');
              break;
            case 1015:
              console.log('TLS handshake');
              break;
            default:
              console.log('Unknown close code');
          }
          
          // Only attempt reconnect if not cleanly closed
          if (!event.wasClean) {
            console.log('Connection was not cleanly closed, attempting to reconnect...');
            cleanup();
            scheduleReconnect();
          }
        };

        ws.onerror = (err) => {
          clearTimeout(connectionTimeout);
          isConnecting.current = false;
          console.error('WebSocket error:', {
            error: err,
            timestamp: new Date().toISOString(),
            readyState: ws.readyState
          });
          ws.close(); // Triggers `onclose`
        };
      } catch (err) {
        isConnecting.current = false;
        console.error('Failed to create WebSocket:', err);
        scheduleReconnect();
      }              
    };

    const cleanup = () => {
      console.log('Cleaning up WebSocket connection');
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN && isSubscribed.current) {
            const unsubscribeMessage = { type: 'unsubscribe', userId };
            console.log('Sending unsubscribe message:', unsubscribeMessage);
            wsRef.current.send(JSON.stringify(unsubscribeMessage));
          }
          wsRef.current.close();
        } catch (err) {
          console.error('Error cleaning up WebSocket:', err);
        }
        wsRef.current = null;
      }
      isSubscribed.current = false;
    };
    
    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) return;
      const delay = Math.min(10000, 1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5)));
      console.log(`Attempting to reconnect in ${delay / 1000}s...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      console.log('WebSocket effect cleanup running');
      cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [userId, onPositionUpdate, onStockOrder, onPositionDeletion, onWarning]);
}