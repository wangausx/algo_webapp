import { useState } from 'react';

export interface Position {
    symbol: string;
    position: number;
    entryPrice: number;
    currentPrice: number;
}

export const useTrading = (username: string) => {  // Added userId parameter
  const [tradingStatus, setTradingStatus] = useState<'stopped' | 'running'>('stopped');
  const [positions, setPositions] = useState<Position[]>([]);

  const toggleTrading = async () => {  // Made async to handle the API call
    setTradingStatus(prev => {
      const newStatus = prev === 'running' ? 'stopped' : 'running';
      
      // If switching to running, send signal to backend
      if (newStatus === 'running') {
        try {
          fetch('api/trade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              symbol: 'AUTO_START'  // You can modify this based on your needs
            }),
          })
          .then(response => response.json())
          .then(data => console.log('Trading started:', data))
          .catch(error => console.error('Error starting trading:', error));
        } catch (error) {
          console.error('Failed to send trading signal:', error);
        }
      }
      
      return newStatus;
    });
  };

  return {
    tradingStatus,
    positions,
    toggleTrading,
  };
};