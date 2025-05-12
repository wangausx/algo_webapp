import { useEffect } from 'react';

interface PositionUpdatePayload {
  type: 'position_update';
  data: {
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPl: number;
    entryTimestamp: string;
    strategyId?: string;
  };
}

export function useWebSocket(userId: string, onPositionUpdate: (data: PositionUpdatePayload['data']) => void) {
  useEffect(() => {
    if (!userId) return;

    const WS_PORT = 3001;
    const ws = new WebSocket(`ws://${window.location.hostname}:${WS_PORT}`);

    ws.onopen = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'subscribe', userId }));
      } else {
        console.warn("WebSocket not ready:", ws.readyState);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'position_update') {
          onPositionUpdate(message.data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', userId }));
      }
      ws.close();
    };
  }, [userId, onPositionUpdate]);
}
