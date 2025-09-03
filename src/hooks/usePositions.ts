import { useState, useCallback, useEffect, useRef } from 'react';
import { OpenPosition, ClosedPosition } from '../components/Dashboard';
import { buildApiUrl } from '../config/api';
import { convertBackendTimeToLocal, logTimeConversion } from '../lib/utils';

export const usePositions = (
  username: string,
  refreshAccountData?: () => Promise<void>
) => {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  
  // Track recently deleted positions to prevent them from being restored by periodic refreshes
  const recentlyDeletedRef = useRef<Set<string>>(new Set());
  
  // Global cooldown mechanism for closed positions fetching
  const lastClosedPositionsFetchRef = useRef<number>(0);
  const CLOSED_POSITIONS_FETCH_COOLDOWN = 5000; // 5 seconds minimum between fetches

  // Debug: Monitor closedPositions state changes
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] closedPositions state changed:`, closedPositions.length, 'positions:', closedPositions.map(p => `${p.symbol}-${p.side}`));
  }, [closedPositions]);

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
        
        // Filter out recently deleted positions to prevent them from being restored
        const filteredPositions = positionArray.filter((position: OpenPosition) => {
          const isRecentlyDeleted = recentlyDeletedRef.current.has(position.symbol);
          if (isRecentlyDeleted) {
            console.log(`Filtering out recently deleted position: ${position.symbol} from initial fetch`);
          }
          return !isRecentlyDeleted;
        });
        
        console.log('Final positions array:', filteredPositions);
        console.log('Setting positions state with:', filteredPositions);
        setPositions(filteredPositions);
        return filteredPositions;
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
      // Clear recently deleted positions when username changes
      recentlyDeletedRef.current.clear();
      console.log('Cleared recently deleted positions set due to username change');
      fetchInitialPositions();
      
      // Also fetch closed positions initially, but reset the cooldown timer
      lastClosedPositionsFetchRef.current = 0; // Reset cooldown for initial fetch
      // fetchClosedPositions will be called after it's declared
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

  const fetchClosedPositionsInternal = useCallback(async () => {
    if (!username || username.length < 6) return;
    
    console.log(`[${new Date().toISOString()}] fetchClosedPositions called`);
    try {
      const closedPositionsRes = await fetch(buildApiUrl(`/router/closed-positions/${username}`));
      console.log('Closed positions response status:', closedPositionsRes.status, closedPositionsRes.ok);
      
      if (closedPositionsRes.ok) {
        const closedPositionsData = await closedPositionsRes.json();
        //console.log('Raw closed positions data from server:', closedPositionsData);
        
        const closedPositionsArray = closedPositionsData.map((entry: any) => {
          const closedAt = entry.closedAt ? convertBackendTimeToLocal(entry.closedAt) : null;
          
          // Create a deep clone to prevent any object reference issues
          const safeClosedAt = closedAt ? new Date(closedAt.getTime()) : null;
          
          return {
            symbol: entry.symbol,
            side: entry.side || 'long',
            quantity: Number(entry.quantity) || 0,
            entryPrice: Number(entry.entryPrice) || 0,
            exitPrice: Number(entry.exitPrice) || 0,
            realizedPl: Number(entry.realizedPl) || 0,
            closedAt: safeClosedAt,
          };
        });
        
        console.log(`[${new Date().toISOString()}] Fetched ${closedPositionsArray.length} closed positions from server:`, closedPositionsArray.map((p: ClosedPosition) => `${p.symbol}-${p.side}`));
        
        // Use the existing duplicate detection pattern from handlePositionUpdate
        setClosedPositions((prevClosedPositions) => {
          // Check for duplicate updates by comparing key fields
          const isDuplicate = prevClosedPositions.length === closedPositionsArray.length &&
            closedPositionsArray.every((fetchedPos: ClosedPosition, index: number) => {
              const existingPos = prevClosedPositions[index];
              return existingPos && 
                existingPos.symbol === fetchedPos.symbol &&
                existingPos.side === fetchedPos.side &&
                existingPos.quantity === fetchedPos.quantity &&
                existingPos.entryPrice === fetchedPos.entryPrice &&
                existingPos.exitPrice === fetchedPos.exitPrice &&
                existingPos.realizedPl === fetchedPos.realizedPl &&
                existingPos.closedAt?.getTime() === fetchedPos.closedAt?.getTime();
            });

          if (isDuplicate) {
            console.log('Duplicate closed positions update detected, skipping');
            return prevClosedPositions;
          }

          console.log('Updating closed positions state with new data');
          return closedPositionsArray;
        });
        
      } else {
        console.log('No closed positions found for user:', username);
        setClosedPositions([]);
      }
    } catch (error) {
      console.error('Error fetching closed positions:', error);
      setClosedPositions([]);
    }
  }, [username]);

  // Wrapper function with cooldown mechanism
  const fetchClosedPositions = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastClosedPositionsFetchRef.current;
    
    if (timeSinceLastFetch < CLOSED_POSITIONS_FETCH_COOLDOWN) {
      console.log(`Skipping closed positions fetch - only ${timeSinceLastFetch}ms since last fetch (cooldown: ${CLOSED_POSITIONS_FETCH_COOLDOWN}ms)`);
      return;
    }
    
    lastClosedPositionsFetchRef.current = now;
    await fetchClosedPositionsInternal();
  }, [fetchClosedPositionsInternal]);

  // Initial fetch of closed positions when username changes
  useEffect(() => {
    if (username && username.length >= 6 && lastClosedPositionsFetchRef.current === 0) {
      fetchClosedPositions();
    }
  }, [username, fetchClosedPositions]);

  // Remove duplicate username effect - consolidated refresh mechanism handles this
  // useEffect(() => {
  //   if (username && username.length >= 6) {
  //     fetchClosedPositions();
  //   }
  // }, [username, fetchClosedPositions]);

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
    console.log('Calling refreshAccountData after position update');
    refreshAccountData?.();
  }, [refreshAccountData]);

  // Handle position deletion from WebSocket notifications
  // Note: We update the open positions state and then fetch updated closed positions from server
  // This ensures data consistency and that closed positions are always up to date
  const handlePositionDeletion = useCallback((symbol: string) => {
    console.log('Position deletion received for symbol:', symbol);
    
    // Track this deletion to prevent it from being restored by periodic refreshes
    recentlyDeletedRef.current.add(symbol);
    console.log('Added to recently deleted set:', symbol, 'Current set:', Array.from(recentlyDeletedRef.current));
    
    // Clear the deletion tracking after 2 minutes to allow for legitimate position re-openings
    setTimeout(() => {
      recentlyDeletedRef.current.delete(symbol);
      console.log('Removed from recently deleted set:', symbol, 'Current set:', Array.from(recentlyDeletedRef.current));
    }, 120000); // 2 minutes
    
    setPositions((prev) => {
      const updated = prev.filter((p) => p.symbol !== symbol);
      console.log('Updated open positions after deletion:', updated);
      return updated;
    });
    
    // Automatically fetch updated closed positions from backend
    // This ensures the closed positions data reflects the newly closed position
    // Use a small delay to allow the backend to process the deletion
    console.log('Triggering automatic fetch of closed positions after position deletion');
    setTimeout(() => {
      fetchClosedPositions();
    }, 1000); // 1 second delay to ensure backend has processed the deletion
  }, [fetchClosedPositions]);

  // Handle manual position cancellation (user clicks close button)
  // This is the primary flow that updates both open and closed positions
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
      
      // Track this deletion to prevent it from being restored by periodic refreshes
      recentlyDeletedRef.current.add(symbol);
      console.log('Added to recently deleted set (manual cancellation):', symbol, 'Current set:', Array.from(recentlyDeletedRef.current));
      
      // Clear the deletion tracking after 2 minutes to allow for legitimate position re-openings
      setTimeout(() => {
        recentlyDeletedRef.current.delete(symbol);
        console.log('Removed from recently deleted set (manual cancellation):', symbol, 'Current set:', Array.from(recentlyDeletedRef.current));
      }, 120000); // 2 minutes
      
      // Refresh closed positions after successful cancellation
      // Use a small delay to ensure backend has processed the cancellation
      console.log('Triggering fetch of closed positions after manual position cancellation');
      setTimeout(() => {
        fetchClosedPositions();
      }, 1500); // 1.5 second delay to ensure backend has processed the cancellation
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }, [username, fetchClosedPositions]);

  // Separate mechanism for refreshing open positions
  useEffect(() => {
    if (!username) return;

    const refreshOpenPositions = async () => {
      try {
        const response = await fetch(buildApiUrl(`/router/positions/${username}`));
        if (response.ok) {
          const positionData = await response.json();
          const positionArray = (Array.isArray(positionData)
            ? positionData
            : positionData.positions || []
          ).map((entry: any) => ({
            symbol: entry.symbol,
            side: entry.side || 'long',
            quantity: Number(entry.quantity) || 0,
            entryPrice: Number(entry.entryPrice) || 0,
            currentPrice: entry.currentPrice != null ? Number(entry.currentPrice) : null,
            unrealizedPl: entry.unrealizedPl != null ? Number(entry.unrealizedPl) : 0,
          } as OpenPosition));
          
          // Filter out recently deleted positions to prevent them from being restored
          const filteredPositions = positionArray.filter((position: OpenPosition) => {
            const isRecentlyDeleted = recentlyDeletedRef.current.has(position.symbol);
            if (isRecentlyDeleted) {
              console.log(`Filtering out recently deleted position: ${position.symbol} from periodic refresh`);
            }
            return !isRecentlyDeleted;
          });
          
          setPositions(filteredPositions);
          console.log('Open positions refresh: Updated from backend, filtered positions:', filteredPositions.length, 'of', positionArray.length);
        }
      } catch (error) {
        console.warn('Open positions refresh failed:', error);
      }
    };

    // Refresh open positions every 3 minutes
    const interval = setInterval(refreshOpenPositions, 180000);
    
    return () => clearInterval(interval);
  }, [username]);

  // Consolidated refresh mechanism with improved debouncing
  useEffect(() => {
    if (!username) return;

    let refreshTimeout: NodeJS.Timeout;
    let isRefreshing = false;

    const debouncedRefresh = () => {
      if (isRefreshing) return; // Prevent concurrent refreshes
      
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(async () => {
        if (isRefreshing) return;
        
        isRefreshing = true;
        try {
          await fetchClosedPositions(); // This now includes the cooldown logic
        } finally {
          isRefreshing = false;
        }
      }, 2000); // 2 second debounce
    };

    const isTradingHours = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Monday to Friday, 9:30 AM to 4:00 PM EST (market hours)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
    };

    const getRefreshInterval = () => {
      if (isTradingHours()) {
        return 1000000; // 10 minutes during trading hours
      } else {
        return 6000000; // 60 minutes outside trading hours
      }
    };

    // Periodic refresh with smart intervals
    const interval = setInterval(debouncedRefresh, getRefreshInterval());

    // Page visibility and focus handlers with debouncing
    const handleVisibilityChange = () => {
      if (!document.hidden && username) {
        console.log('Page became visible, scheduling position data refresh');
        debouncedRefresh();
      }
    };

    const handleFocus = () => {
      if (username) {
        console.log('Window focused, scheduling position data refresh');
        debouncedRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      clearTimeout(refreshTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [username, fetchClosedPositions]);

  return {
    positions,
    closedPositions,
    fetchClosedPositions,
    handlePositionUpdate,
    handlePositionDeletion,
    handleCancelPosition
  };
}; 