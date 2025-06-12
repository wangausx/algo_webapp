import { useState, useCallback, useEffect } from 'react';
import { OpenPosition } from '../components/Dashboard';

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
      const positionRes = await fetch(`http://localhost:3001/router/positions/${username}`);
      if (positionRes.ok) {
        const positionData = await positionRes.json();
        console.log('Open positions retrieved: ', positionData);
        const positionArray = (Array.isArray(positionData)
          ? positionData
          : positionData.positions || []
        ).map((entry: any) => ({
          symbol: entry.symbol,
          side: entry.side,
          quantity: Number(entry.quantity) || 0,
          entryPrice: Number(entry.avgEntryPrice) || 0,
          currentPrice: entry.currentPrice != null ? Number(entry.currentPrice) : null,
          unrealizedPl: entry.unrealizedPl != null ? Number(entry.unrealizedPl) : 0,
        } as OpenPosition));
        
        setInitialPositions(positionArray);
        // Refresh account data when positions are updated
        await refreshAccountData();
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
  }, [username, refreshAccountData]);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      await Promise.all([
        fetchClosedPositions(),
        fetchOrders(),
        refreshAccountData()
      ]);

    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [fetchClosedPositions, fetchOrders, refreshAccountData]);

  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First fetch initial positions
      const positions = await fetchInitialData();
      
      // Then fetch all other data
      await fetchAllData();

      return positions;
    } catch (error) {
      console.error('Error initializing dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchInitialData, fetchAllData]);

  return {
    isLoading,
    error,
    initialPositions,
    initializeData
  };
}; 