import { useState, useEffect } from 'react';

export const useTrading = (username: string) => {
  const [tradingStatus, setTradingStatus] = useState<'stopped' | 'running'>('stopped');

  useEffect(() => {
    const fetchTradingStatus = async () => {
      try {
        
        console.log('Fetching trading status for:', username);
        const response = await fetch(`/api/tradesetting/${username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trading status');
        }
        const data = await response.json();
        console.log('Fetched trading status:', data);

        if (data?.tradingStatus === 'running' || data?.tradingStatus === 'stopped') {
          setTradingStatus(data.tradingStatus);
        } else {
          console.warn('Unexpected tradingStatus from server:', data?.tradingStatus);
        }
      } catch (error) {
        console.error('Error fetching trading status:', error);
      }
    };

    fetchTradingStatus();
  }, [username]);

  const toggleTrading = async () => {
    setTradingStatus(prev => {
      const newStatus = prev === 'running' ? 'stopped' : 'running';
      
      try {
        console.log('Request trading status change for:', username);
        fetch('/router/trade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: username,
            tradingStatus: newStatus,
          }),
        })
        .then(async (response) => {
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};
          console.log('Trading status updated:', data);
        })
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
