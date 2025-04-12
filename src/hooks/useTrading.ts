import { useState } from 'react';

export interface Position {
    symbol: string;
    position: number;
    entryPrice: number;
    currentPrice: number;
}

export const useTrading = (username: string) => {
  const [tradingStatus, setTradingStatus] = useState<'stopped' | 'running'>('stopped');

  const toggleTrading = async () => {
    setTradingStatus(prev => {
      const newStatus = prev === 'running' ? 'stopped' : 'running';
      
      try {
        console.log('Request trading status change for:', username);
        fetch('api/router/trade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: username,
            tradingStatus: newStatus  // Changed from symbol to include the new status
          }),
        })
        .then(async (response) => {
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};
          console.log('Trading status updated:', data);
        })
        .then(data => console.log('Trading status updated:', data))
        .catch(error => console.error('Error updating trading status:', error));
      } catch (error) {
        console.error('Failed to send trading signal:', error);
      }
      
      return newStatus;
    });
  };

  return {
    tradingStatus,
    toggleTrading,
  };
};