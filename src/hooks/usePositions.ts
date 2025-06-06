import { useState, useCallback, useEffect } from 'react';
import { OpenPosition, ClosedPosition } from '../components/Dashboard';

export const usePositions = (username: string) => {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);

  const fetchClosedPositions = useCallback(async () => {
    if (!username) return;
    
    try {
      const closedPositionsRes = await fetch(`http://localhost:3001/router/closed-positions/${username}`);
      if (closedPositionsRes.ok) {
        const closedPositionsData = await closedPositionsRes.json();
        console.log('Raw closed positions data from server:', closedPositionsData);
        
        const closedPositionsArray = closedPositionsData.map((entry: any) => ({
          ...entry,
          closedAt: entry.closedAt ? new Date(entry.closedAt) : null,
        })).filter((position: ClosedPosition) => {
          const hasEssentialData = position.symbol && position.side;
          if (!hasEssentialData) {
            console.warn('Filtering out position missing essential data:', position);
          }
          return hasEssentialData;
        });
        
        console.log('Final processed closed positions:', closedPositionsArray);
        setClosedPositions(closedPositionsArray);
      } else {
        console.log('No closed positions yet!');
      }
    } catch (error) {
      console.error('Error fetching closed positions:', error);
    }
  }, [username]);

  const handlePositionUpdate = useCallback((positionUpdate: OpenPosition) => {
    console.log('handlePositionUpdate callback created');
    console.log('Dashboard received position update:', positionUpdate);
    
    setPositions((prev) => {
      console.log('Previous positions state:', prev);
      
      const existingPositionIndex = prev.findIndex(
        (p) => p.symbol === positionUpdate.symbol && p.side === positionUpdate.side
      );
      
      const newPosition = {
        symbol: positionUpdate.symbol,
        side: positionUpdate.side,
        quantity: Math.abs(Number(positionUpdate.quantity)),
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
          ...newPosition,
          quantity: newPosition.quantity || newPositions[existingPositionIndex].quantity,
          entryPrice: newPosition.entryPrice || newPositions[existingPositionIndex].entryPrice,
          currentPrice: newPosition.currentPrice ?? newPositions[existingPositionIndex].currentPrice,
          unrealizedPl: newPosition.unrealizedPl ?? newPositions[existingPositionIndex].unrealizedPl,
        };
        console.log('Updating existing position in state');
      }
      
      console.log('New positions state:', newPositions);
      return [...newPositions];
    });
  }, []);

  const handlePositionDeletion = useCallback((symbol: string) => {
    console.log('handlePositionDeletion callback created');
    console.log('Position deletion received for symbol:', symbol);
    setPositions((prev) => {
      const closedPosition = prev.find((p) => p.symbol === symbol);
      
      if (closedPosition) {
        setClosedPositions(prevClosed => {
          const FIVE_MINUTES_MS = 5 * 60 * 1000;
          const currentTime = new Date().getTime();
          
          const isAlreadyClosed = prevClosed.some(
            p => p.symbol === closedPosition.symbol && 
                 p.side === closedPosition.side &&
                 p.entryPrice === closedPosition.entryPrice &&
                 p.quantity === closedPosition.quantity &&
                 p.closedAt && 
                 Math.abs(p.closedAt.getTime() - currentTime) < FIVE_MINUTES_MS
          );
          
          if (!isAlreadyClosed) {
            const closedPositionEntry: ClosedPosition = {
              symbol: closedPosition.symbol,
              side: closedPosition.side,
              quantity: closedPosition.quantity,
              entryPrice: closedPosition.entryPrice,
              exitPrice: closedPosition.currentPrice ?? 0,
              realizedPl: closedPosition.unrealizedPl ?? 0,
              closedAt: new Date(),
            };
            
            console.log('Adding closed position:', closedPositionEntry);
            return [...prevClosed, closedPositionEntry];
          }
          
          return prevClosed;
        });

        // Refresh closed positions from server after local update
        fetchClosedPositions();
      }
      
      const updated = prev.filter((p) => p.symbol !== symbol);
      console.log('Updated open positions after deletion:', updated);
      return updated;
    });
  }, [fetchClosedPositions]);

  const handleCancelPosition = useCallback(async (symbol: string, side: 'long' | 'short') => {
    if (!username) return;
    
    try {
      const response = await fetch(`http://localhost:3001/router/cancel-position/${username}`, {
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