import { useEffect, useRef } from 'react';
import { OpenPosition, StockOrder } from '../components/Dashboard';
import { buildWsUrl } from '../config/api';

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
  onWarning?: (message: string) => void,
  onReconnect?: () => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnecting = useRef(false);
  const isSubscribed = useRef(false);
  
  // Silent connection detection
  const lastPongReceived = useRef<number>(Date.now());
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionHealthCheckRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    
    if (connectionHealthCheckRef.current) {
      clearInterval(connectionHealthCheckRef.current);
      connectionHealthCheckRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN && isSubscribed.current) {
        const unsubscribeMessage = { type: 'unsubscribe', userId };
        console.log('Sending unsubscribe message:', unsubscribeMessage);
        wsRef.current.send(JSON.stringify(unsubscribeMessage));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    isConnecting.current = false;
    isSubscribed.current = false;
  };

  // Trading hours detection
  const isTradingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday to Friday, 9:30 AM to 4:00 PM EST (market hours)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  };

  const scheduleReconnect = () => {
    // Increase max attempts during trading hours for better reliability
    const maxAttempts = isTradingHours() ? 15 : 10;
    
    if (reconnectAttempts.current < maxAttempts) {
      reconnectAttempts.current++;
      
      // More aggressive reconnection during trading hours
      const baseDelay = isTradingHours() ? 1000 : 2000;
      const exponentialDelay = baseDelay * Math.pow(2, reconnectAttempts.current);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, isTradingHours() ? 15000 : 30000);
      
      console.log(`Scheduling reconnection attempt ${reconnectAttempts.current}/${maxAttempts} in ${Math.round(delay)}ms (trading hours: ${isTradingHours()})`);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    } else {
      console.warn(`Max reconnection attempts (${maxAttempts}) reached. Will retry when trading hours change or user action triggers reconnection.`);
    }
  };

  const connect = () => {
    if (!userId || userId.length < 6) {
      console.log('No userId provided or userId too short (< 6 chars), skipping WebSocket connection');
      return;
    }

    const WS_URL = buildWsUrl();
    console.log('Attempting WebSocket connection to:', WS_URL);
    console.log('Current window.location:', {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port
    });

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
      console.log('Setting up WebSocket connection for user:', userId);
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
        console.log('[WebSocket] Connected successfully');
        console.log('[WebSocket] readyState after connection:', ws.readyState);
        reconnectAttempts.current = 0;
        
        // Send subscription message immediately upon connection
        const subscribeMessage = { type: 'subscribe', userId };
        console.log('Sending subscription message:', subscribeMessage);
        try {
          ws.send(JSON.stringify(subscribeMessage));
            console.log('[WebSocket] User subscribed:', userId);
          isSubscribed.current = true;
          
          // Trigger reconnection callback to refresh data on every reconnection
          if (onReconnectRef.current) {
            console.log('WebSocket connected, triggering data refresh');
            onReconnectRef.current();
          }
        } catch (err) {
          console.error('Error sending subscription message:', err);
        }
        
        // Start improved heartbeat with pong validation
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
        
        // Reset pong timestamp
        lastPongReceived.current = Date.now();
        
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
              // console.log('Sent ping to WebSocket server');
              
              // Set timeout for pong response
              if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
              }
              
              heartbeatTimeoutRef.current = setTimeout(() => {
                const timeSinceLastPong = Date.now() - lastPongReceived.current;
                console.warn(`No pong received for ${timeSinceLastPong}ms, connection may be silent`);
                
                // If no pong received for 30 seconds, consider connection silent
                if (timeSinceLastPong > 30000) {
                  console.error('WebSocket connection appears silent, forcing reconnection');
                  ws.close(1006, 'Silent connection detected');
                }
              }, 15000); // 15 second timeout for pong response
              
            } catch (err) {
              console.error('Error sending ping:', err);
            }
          }
        }, 10000);
        
        // Start connection health monitoring
        if (connectionHealthCheckRef.current) {
          clearInterval(connectionHealthCheckRef.current);
        }
        
        connectionHealthCheckRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const timeSinceLastPong = Date.now() - lastPongReceived.current;
            const timeSinceLastMessage = Date.now() - lastPongReceived.current;
            
            // Check if connection has been silent for too long
            if (timeSinceLastPong > 60000) { // 1 minute without any response
              console.warn(`WebSocket connection silent for ${timeSinceLastPong}ms, checking health`);
              
              // Send a test message to verify connection
              try {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
              } catch (err) {
                console.error('Failed to send health check ping:', err);
                ws.close(1006, 'Health check failed');
              }
            }
          }
        }, 30000); // Check every 30 seconds
      };

      ws.onmessage = (event) => {
        //console.log('WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          //console.log('Received WebSocket message:', message);
          
          switch (message.type) {
            case 'connection_established':
              console.log('Connection established:', message);
              isSubscribed.current = true;
              break;
            case 'position_update':
              console.log('Handling position update:', message.payload);
              if (message.payload && typeof message.payload === 'object') {
                // Validate position update data
                const payload = message.payload;
                if (payload.symbol && (payload.side === 'long' || payload.side === 'short')) {
                  onPositionUpdateRef.current(message.payload);
                } else {
                  console.warn('Invalid position update payload:', payload);
                }
              } else {
                console.warn('Invalid position update message format:', message);
              }
              break;
            case 'order_update':
              console.log('Handling order update:', message.payload);
              if (onStockOrderRef.current && message.payload && typeof message.payload === 'object') {
                // Validate order update data
                const payload = message.payload;
                if (payload.symbol && (payload.side === 'buy' || payload.side === 'sell')) {
                  console.log('Calling onStockOrder callback with payload:', message.payload);
                  onStockOrderRef.current(message.payload);
                } else {
                  console.warn('Invalid order update payload:', payload);
                }
              } else {
                console.warn('onStockOrder callback is not provided for order update or invalid payload');
              }
              break;
            case 'position_deletion':
              console.log('Handling position deletion:', message.payload);
              if (message.payload && typeof message.payload === 'object' && message.payload.symbol) {
                onPositionDeletionRef.current?.(message.payload.symbol);
              } else {
                console.warn('Invalid position deletion payload:', message.payload);
              }
              break;
            case 'warning':
              console.log('Received warning:', message.message);
              onWarningRef.current?.(message.message);
              break;
            case 'pong':
              // console.log('Received pong response');
              lastPongReceived.current = Date.now();
              
              // Clear any pending heartbeat timeout
              if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
              }
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
        console.log('WebSocket readyState at close:', ws.readyState);
        
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
        console.error('WebSocket error event fired:', err);
        console.log('WebSocket readyState at error:', ws.readyState);
        clearTimeout(connectionTimeout);
        isConnecting.current = false;
        console.error('WebSocket error:', {
          error: err,
          timestamp: new Date().toISOString(),
          readyState: ws.readyState
        });
        // Don't call ws.close() here - let the onclose handler deal with it
        // ws.close(); // Triggers `onclose`
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      isConnecting.current = false;
      scheduleReconnect();
    }              
  };

  // Monitor dependencies for changes
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

  // Monitor trading hours changes to reset reconnection attempts
  useEffect(() => {
    const tradingHoursCheck = setInterval(() => {
      const currentlyTrading = isTradingHours();
      const wasTrading = reconnectAttempts.current > 0; // Simple heuristic
      
      // If trading hours just started and we had failed connections, reset attempts
      if (currentlyTrading && reconnectAttempts.current >= 5) {
        console.log('Trading hours started, resetting reconnection attempts');
        reconnectAttempts.current = 0;
        
        // Try to reconnect if not already connected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('Attempting reconnection due to trading hours start');
          scheduleReconnect();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(tradingHoursCheck);
  }, []);

  // Keep callback refs up to date so we don't have to depend on them in the effect (avoids reconnect on every render when callbacks change)
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const onStockOrderRef = useRef(onStockOrder);
  const onPositionDeletionRef = useRef(onPositionDeletion);
  const onWarningRef = useRef(onWarning);
  const onReconnectRef = useRef(onReconnect);
  onPositionUpdateRef.current = onPositionUpdate;
  onStockOrderRef.current = onStockOrder;
  onPositionDeletionRef.current = onPositionDeletion;
  onWarningRef.current = onWarning;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    console.log('[WebSocket] Effect ran. userId:', userId ? `${userId.length} chars` : 'empty');
    if (!userId || userId.length < 6) {
      console.warn('[WebSocket] Not connecting: userId missing or too short (< 6 chars). validatedUsername:', userId ? `${userId.slice(0, 2)}...` : 'empty');
      return;
    }

    const WS_URL = buildWsUrl();
    console.log('[WebSocket] Attempting connection to:', WS_URL);
    console.log('Current window.location:', {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port
    });

    connect();

    return () => {
      console.log('WebSocket effect cleanup running');
      cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend only on userId so we connect when validation completes and don't disconnect when parent callbacks change
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);
}