import { number } from 'prop-types';
import { useState } from 'react';

export interface Position {
    symbol: string;
    position: number;
    entryPrice: number;
    currentPrice: number;
  }

export const useTrading = () => {
  const [tradingStatus, setTradingStatus] = useState<'stopped' | 'running'>('stopped');
  const [positions, setPositions] = useState<Position[]>([]);

  const toggleTrading = () => {
    setTradingStatus(prev => (prev === 'running' ? 'stopped' : 'running'));
  };

  return {
    tradingStatus,
    positions,
    toggleTrading,
  };
};
