import { useState, useCallback, useEffect } from 'react';
import { OpenPosition, ClosedPosition } from '../components/Dashboard';
import { buildApiUrl } from '../config/api';

export const usePositions = (
  username: string,
  refreshAccountData?: () => Promise<void>
) => {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);

  const fetchInitialPositions = useCallback(async () => {
    if (!username || username.length < 6) return;
    
    try {
      const positionRes = await fetch(buildApiUrl(`/router/positions/${username}`));
      if (positionRes.ok) {
        const positionData = await positionRes.json();
        console.log('Open positions retrieved: ', positionData);
        const positionArray = (Array.isArray(positionData)
          ? positionData
          : positionData.positions || []
        ).map((entry: any) => {
          console.log('Processing position entry:', entry);
          const mappedPosition = {
            symbol: entry.symbol,
            side: entry.side || 'long', // Default to 'long' if side is not provided
            quantity: Number(entry.quantity) || 0,
            entryPrice: Number(entry.entryPrice) || 0,
            currentPrice: entry.currentPrice != null ? Number(entry.currentPrice) : null,
            unrealizedPl: entry.unrealizedPl != null ? Number(entry.unrealizedPl) : 0,
          } as OpenPosition;
          
          console.log('Mapped position:', mappedPosition);
          // Additional validation
          if (!mappedPosition.symbol) {
            console.warn('Position missing symbol:', entry);
            return null;
          }
          
          return mappedPosition;
        }).filter((position: OpenPosition | null): position is OpenPosition => position !== null);
        
        console.log('Final positions array:', positionArray);
        console.log('Setting positions state with:', positionArray);
        setPositions(positionArray);
        return positionArray;
      } else {
        console.log('No open positions found for user:', username);
        setPositions([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching initial positions:', error);
      return [];
    }
  }, [username]);

  // Fetch initial positions when username changes - only for valid usernames (>= 6 characters)
  useEffect(() => {
    if (username && username.length >= 6) {
      fetchInitialPositions();
    }
  }, [username, fetchInitialPositions]);

  // Debug: Monitor positions state changes
  useEffect(() => {
    console.log('Positions state changed:', positions);
  }, [positions]);

  // Update positions state when positions prop changes
  useEffect(() => {
    setPositions(positions);
  }, [positions]);

  const fetchClosedPositions = useCallback(async () => {
    if (!username || username.length < 6) return;
    
    try {
      const closedPositionsRes = await fetch(buildApiUrl(`/router/closed-positions/${username}`));
      console.log('Closed positions response status:', closedPositionsRes.status, closedPositionsRes.ok);
      
      if (closedPositionsRes.ok) {
        const closedPositionsData = await closedPositionsRes.json();
        //console.log('Raw closed positions data from server:', closedPositionsData);
        
        const closedPositionsArray = closedPositionsData.map((entry: any) => ({
          symbol: entry.symbol,
          side: entry.side || 'long',
          quantity: Number(entry.quantity) || 0,
          entryPrice: Number(entry.entryPrice) || 0,
          exitPrice: Number(entry.exitPrice) || 0,
          realizedPl: Number(entry.realizedPl) || 0,
          closedAt: entry.closedAt ? new Date(entry.closedAt) : null,
        }));
        
        console.log('Final processed closed positions:', closedPositionsArray);
        setClosedPositions(closedPositionsArray);
      } else {
        console.log('No closed positions found for user:', username);
        setClosedPositions([]);
      }
    } catch (error) {
      console.error('Error fetching closed positions:', error);
      setClosedPositions([]);
    }
  }, [username]);

  // Fetch closed positions when username changes - only for valid usernames (>= 6 characters)
  useEffect(() => {
    if (username && username.length >= 6) {
      fetchClosedPositions();
    }
  }, [username, fetchClosedPositions]);

  const handlePositionUpdate = useCallback((positionUpdate: OpenPosition) => {
    //console.log('handlePositionUpdate callback created');
    console.log('Dashboard received position update:', positionUpdate);
    
    setPositions((prev) => {
      //console.log('Previous positions state:', prev);
      
      const existingPositionIndex = prev.findIndex(
        (p) => p.symbol === positionUpdate.symbol && p.side === positionUpdate.side
      );

      // Check for duplicate updates by comparing key fields
      const isDuplicate = existingPositionIndex !== -1 && 
        prev[existingPositionIndex].quantity === positionUpdate.quantity &&
        prev[existingPositionIndex].entryPrice === positionUpdate.entryPrice &&
        prev[existingPositionIndex].currentPrice === positionUpdate.currentPrice &&
        prev[existingPositionIndex].unrealizedPl === positionUpdate.unrealizedPl;

      if (isDuplicate) {
        console.log('Duplicate position update detected, skipping');
        return prev;
      }

      const newPosition = {
        symbol: positionUpdate.symbol,
        side: positionUpdate.side,
        quantity: Number(positionUpdate.quantity) || 0,
        entryPrice: Number(positionUpdate.entryPrice) || 0,
        currentPrice: positionUpdate.currentPrice != null ? Number(positionUpdate.currentPrice) : null,
        unrealizedPl: positionUpdate.unrealizedPl != null ? Number(positionUpdate.unrealizedPl) : 0,
      } as OpenPosition;
      
      console.log('Position update type:', existingPositionIndex === -1 ? 'New position' : 'Update existing position');
      console.log('Position data:', newPosition);
      
      let newPositions;
      if (existingPositionIndex === -1) {
        newPositions = [...prev, newPosition];
        console.log('Adding new position to state');
      } else {
        newPositions = [...prev];
        newPositions[existingPositionIndex] = {
          ...newPositions[existingPositionIndex],
          quantity: newPosition.quantity,
          entryPrice: newPosition.entryPrice,
          currentPrice: newPosition.currentPrice ?? newPositions[existingPositionIndex].currentPrice,
          unrealizedPl: newPosition.unrealizedPl ?? newPositions[existingPositionIndex].unrealizedPl,
        };
        //console.log('Updating existing position in state');
      }
      
      //console.log('New positions state:', newPositions);
      return [...newPositions];
    });

    // Refresh account data after position update
    refreshAccountData?.();
  }, [refreshAccountData]);

  const handlePositionDeletion = useCallback((symbol: string) => {
    console.log('Position deletion received for symbol:', symbol);
    setPositions((prev) => {
      const closedPosition = prev.find((p) => p.symbol === symbol);
      
      if (closedPosition) {
        // Add to closed positions
        setClosedPositions((prevClosed) => {
          const closedPositionEntry = {
            symbol: closedPosition.symbol,
            side: closedPosition.side,
            quantity: closedPosition.quantity,
            entryPrice: closedPosition.entryPrice,
            exitPrice: closedPosition.currentPrice || closedPosition.entryPrice,
            realizedPl: closedPosition.unrealizedPl || 0,
            closedAt: new Date(),
          };
          
          console.log('Adding closed position:', closedPositionEntry);
          return [...prevClosed, closedPositionEntry];
        });
      }
      
      const updated = prev.filter((p) => p.symbol !== symbol);
      console.log('Updated open positions after deletion:', updated);
      return updated;
    });
  }, []);

  const handleCancelPosition = useCallback(async (symbol: string, side: 'long' | 'short') => {
    if (!username) return;
    
    try {
      const response = await fetch(buildApiUrl(`/router/cancel-position/${username}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      console.log(`Position close request sent for ${symbol} (${side})`);
      
      // Refresh closed positions after successful cancellation
      await fetchClosedPositions();
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }, [username, fetchClosedPositions]);

  // Refresh closed positions periodically
  //useEffect(() => {
  //  if (username) {
  //    const interval = setInterval(fetchClosedPositions, 60000); // Refresh every minute
  //    return () => clearInterval(interval);
  //  }
  //}, [username, fetchClosedPositions]);

  return {
    positions,
    closedPositions,
    fetchClosedPositions,
    handlePositionUpdate,
    handlePositionDeletion,
    handleCancelPosition
  };
}; 