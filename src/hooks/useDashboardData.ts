import { useState, useCallback, useEffect } from 'react';
import { OpenPosition } from '../components/Dashboard';
import { buildApiUrl } from '../config/api';

export const useDashboardData = (
  username: string,
  fetchClosedPositions: () => Promise<void>,
  fetchOrders: () => Promise<void>,
  refreshAccountData: () => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialPositions, setInitialPositions] = useState<OpenPosition[]>([]);

  const fetchInitialData = useCallback(async () => {
    if (!username) {
      setIsLoading(false);
      console.log('Username is empty or null. Skipping data fetch.');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch initial positions
      const positionRes = await fetch(buildApiUrl(`/router/positions/${username}`));
      if (positionRes.ok) {
        const positionData = await positionRes.json();
        console.log('Open positions retrieved: ', positionData);
        const positionArray = (Array.isArray(positionData)
          ? positionData
          : positionData.positions || []
        ).map((entry: any) => ({
          symbol: entry.symbol,
          side: entry.side || 'long', // Default to 'long' if side is not provided
          quantity: Number(entry.quantity) || 0,
          entryPrice: Number(entry.entryPrice) || 0,
          currentPrice: entry.currentPrice != null ? Number(entry.currentPrice) : null,
          unrealizedPl: entry.unrealizedPl != null ? Number(entry.unrealizedPl) : 0,
        } as OpenPosition));
        
        setInitialPositions(positionArray);
        return positionArray;
      } else {
        console.log('No open positions yet!');
        return [];
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch closed positions and orders in parallel
      await Promise.all([
        fetchClosedPositions(),
        fetchOrders()
      ]);

    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [fetchClosedPositions, fetchOrders]);

  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting data initialization for user:', username);

      // First establish user account in backend
      console.log('Establishing user account in backend...');
      await refreshAccountData();
      console.log('User account established successfully');

      // Then fetch initial positions
      console.log('Fetching initial positions...');
      const positions = await fetchInitialData();
      console.log('Initial positions fetched successfully');
      
      // Finally fetch all other data in parallel
      console.log('Fetching remaining data in parallel...');
      await fetchAllData();
      console.log('All data initialization completed');

      return positions;
    } catch (error) {
      console.error('Error initializing dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [username, fetchInitialData, fetchAllData, refreshAccountData]);

  return {
    isLoading,
    error,
    initialPositions,
    initializeData
  };
}; 