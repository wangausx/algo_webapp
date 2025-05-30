import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useWebSocket, PositionUpdatePayload, OrderUpdatePayload } from '../hooks/useWebSocket';

console.log('Dashboard component imported useWebSocket:', useWebSocket);

export interface OpenPosition {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  unrealizedPl: number;
}

export interface ClosedPosition {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  realizedPl: number;
  closedAt: Date | null;
}

export interface StockOrder {
  symbol: string;
  quantity: number;
  filledQuantity?: number;
  side: 'buy' | 'sell';
  status: 'pending' | 'filled' | 'partially_filled' | 'canceled' | 'rejected';
  filledAvgPrice?: number;
  submittedAt: Date;
  clientOrderId?: string;
}

interface DashboardProps {
  tradingStatus: 'running' | 'stopped';
  toggleTrading: () => void;
  username?: string;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ tradingStatus, toggleTrading, username = '' }) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [dailyPnL, setDailyPnL] = useState(0);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClosedPositions, setShowClosedPositions] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  console.log('Dashboard rendering with username:', username);

  const fetchClosedPositions = useCallback(async () => {
    if (!username) return;
    
    try {
      const closedPositionsRes = await fetch(`http://localhost:3001/router/closed-positions/${username}`);
      if (closedPositionsRes.ok) {
        const closedPositionsData = await closedPositionsRes.json();
        console.log('Raw closed positions data from server:', closedPositionsData);
        
        const closedPositionsArray = (Array.isArray(closedPositionsData)
          ? closedPositionsData
          : closedPositionsData.positions || []
        ).map((entry: any) => {
          console.log('Processing entry:', entry);
          
          // Get the most recent trade's entryDate as the closedAt time
          let closedAtDate: Date | null = null;
          if (entry.trades && entry.trades.length > 0) {
            // Sort trades by entryDate in descending order and take the most recent one
            const sortedTrades = [...entry.trades].sort((a: any, b: any) => 
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
            );
            const mostRecentTrade = sortedTrades[0];
            closedAtDate = new Date(mostRecentTrade.entryDate);
          }

          // Parse numeric values, using nullish coalescing to handle 0 values correctly
          const exitPrice = Number(entry.exitPrice) ?? 0;
          const realizedPl = Number(entry.realizedPl) ?? 0;
          const entryPrice = Number(entry.entryPrice) ?? 0;
          const quantity = Number(entry.quantity) ?? 0;

          console.log('Parsed values:', {
            symbol: entry.symbol,
            exitPrice,
            realizedPl,
            entryPrice,
            quantity,
            closedAt: closedAtDate
          });

          return {
            symbol: entry.symbol,
            side: entry.side,
            quantity: quantity,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            realizedPl: realizedPl,
            closedAt: closedAtDate,
          } as ClosedPosition;
        }).filter((position: ClosedPosition) => {
          // Only filter out positions with missing essential data
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

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePositionUpdate = useCallback((positionUpdate: PositionUpdatePayload['payload']) => {
    console.log('handlePositionUpdate callback created');
    console.log('Dashboard received position update:', positionUpdate);
    
    // Refresh account balance and daily P/L
    const refreshAccountData = async () => {
      try {
        const accountRes = await fetch(`http://localhost:3001/router/account/${username}`);
        if (!accountRes.ok) {
          throw new Error(`Failed to fetch account data: ${accountRes.status}`);
        }
        
        const accountData = await accountRes.json();
        setAccountBalance(Number(accountData.balance) || 0);
        setDailyPnL(Number(accountData.dailyPnL) || 0);
        console.log('Account data refreshed:', accountData);
      } catch (error) {
        console.error('Error refreshing account data:', error);
      }
    };
    
    refreshAccountData();
    
    setPositions((prev) => {
      console.log('Previous positions state:', prev);
      
      // Check if this is a new position or an update to an existing one
      const existingPositionIndex = prev.findIndex(
        (p) => p.symbol === positionUpdate.symbol && p.side === positionUpdate.side
      );
      
      const newPosition = {
        symbol: positionUpdate.symbol,
        side: positionUpdate.side,
        quantity: Math.abs(Number(positionUpdate.quantity)), // Ensure positive quantity
        entryPrice: Number(positionUpdate.entryPrice) || 0,
        currentPrice: positionUpdate.currentPrice != null ? Number(positionUpdate.currentPrice) : null,
        unrealizedPl: positionUpdate.unrealizedPl != null ? Number(positionUpdate.unrealizedPl) : 0,
      } as OpenPosition;
      
      console.log('Position update type:', existingPositionIndex === -1 ? 'New position' : 'Update existing position');
      console.log('Position data:', newPosition);
      
      let newPositions;
      if (existingPositionIndex === -1) {
        // This is a new position
        newPositions = [...prev, newPosition];
        console.log('Adding new position to state');
      } else {
        // This is an update to an existing position
        newPositions = [...prev];
        newPositions[existingPositionIndex] = {
          ...newPositions[existingPositionIndex],
          ...newPosition,
          // Ensure we're not losing any existing data
          quantity: newPosition.quantity || newPositions[existingPositionIndex].quantity,
          entryPrice: newPosition.entryPrice || newPositions[existingPositionIndex].entryPrice,
          currentPrice: newPosition.currentPrice ?? newPositions[existingPositionIndex].currentPrice,
          unrealizedPl: newPosition.unrealizedPl ?? newPositions[existingPositionIndex].unrealizedPl,
        };
        console.log('Updating existing position in state');
      }
      
      console.log('New positions state:', newPositions);
      // Force a new array reference to ensure React detects the change
      return [...newPositions];
    });
  }, [username]);

  const handleOrderUpdate = useCallback((orderUpdate: OrderUpdatePayload['payload']) => {
    console.log('handleOrderUpdate callback created');
    console.log('orderUpdate received: ', orderUpdate);
    setOrders((prev) => {
      const updated = prev.filter((o) => o.symbol !== orderUpdate.symbol || o.status !== 'pending');
      return [
        ...updated,
        {
          symbol: orderUpdate.symbol,
          quantity: Number(orderUpdate.quantity) || 0,
          filledQuantity: Number(orderUpdate.filledQuantity) || 0,
          side: orderUpdate.side,
          status: orderUpdate.status,
          filledAvgPrice: Number(orderUpdate.filledAvgPrice) || undefined,
          submittedAt: orderUpdate.submittedAt ? new Date(orderUpdate.submittedAt) : new Date(),
          clientOrderId: orderUpdate.clientOrderId,
        } as StockOrder,
      ];
    });
  }, []);

  const handlePositionDeletion = useCallback((symbol: string) => {
    console.log('handlePositionDeletion callback created');
    console.log('Position deletion received for symbol:', symbol);
    setPositions((prev) => {
      // Find the position being closed
      const closedPosition = prev.find((p) => p.symbol === symbol);
      
      if (closedPosition) {
        // Create a closed position entry
        const closedPositionEntry: ClosedPosition = {
          symbol: closedPosition.symbol,
          side: closedPosition.side,
          quantity: closedPosition.quantity,
          entryPrice: closedPosition.entryPrice,
          exitPrice: closedPosition.currentPrice ?? 0,  // Use nullish coalescing
          realizedPl: closedPosition.unrealizedPl ?? 0, // Use nullish coalescing
          closedAt: new Date(),
        };
        
        console.log('Adding closed position:', closedPositionEntry);
        setClosedPositions(prevClosed => [...prevClosed, closedPositionEntry]);
      }
      
      // Remove the position from open positions
      const updated = prev.filter((p) => p.symbol !== symbol);
      console.log('Updated open positions after deletion:', updated);
      return updated;
    });
  }, []);

  const handleClosePosition = async (symbol: string, side: 'long' | 'short') => {
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

      // The position will be removed via the WebSocket update
      console.log(`Position close request sent for ${symbol} (${side})`);
    } catch (error) {
      console.error('Error closing position:', error);
      setError(error instanceof Error ? error.message : 'Failed to close position');
    }
  };

  // Use the WebSocket hook
  useWebSocket(
    username,
    handlePositionUpdate,
    handleOrderUpdate,
    handlePositionDeletion
  );

  // Remove all the old WebSocket connection logic and keep only the data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!username) {
        setIsLoading(false);
        console.log('Username is empty or null. Skipping data fetch.');
        return;
      }
      try {
        setIsLoading(true);
        setError(null);

        // Fetch account balance
        const accountRes = await fetch(`http://localhost:3001/router/account/${username}`);
        if (!accountRes.ok) {
          throw new Error(`Failed to fetch account data: ${accountRes.status}`);
        }
        
        const accountData = await accountRes.json();
        setAccountBalance(Number(accountData.balance) || 0);
        setDailyPnL(Number(accountData.dailyPnL) || 0);
        console.log('Account balance fetched: ', accountData.balance, accountData.dailyPnL);

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
          
          setPositions(positionArray);
        } else {
          console.log('No open positions yet!');
        }

        // Fetch initial closed positions
        await fetchClosedPositions();

        // Fetch orders
        const ordersRes = await fetch(`http://localhost:3001/router/orders/${username}`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          console.log('Recent orders retrieved: ', ordersData);
          const ordersArray = (Array.isArray(ordersData)
            ? ordersData
            : ordersData.orders || []
          ).map((order: any) => ({
            symbol: order.symbol,
            quantity: Number(order.quantity) || 0,
            filledQuantity: Number(order.filledQuantity) || undefined,
            side: order.side,
            status: order.status,
            filledAvgPrice: Number(order.filledAvgPrice) || undefined,
            submittedAt: order.submittedAt ? new Date(order.submittedAt) : new Date(),
            clientOrderId: order.clientOrderId,
          } as StockOrder));
          setOrders(ordersArray);
        } else {
          console.log('No orders found.');
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, fetchClosedPositions]);

  // Add a useEffect to monitor position changes
  useEffect(() => {
    console.log('Positions state updated:', positions);
  }, [positions]);

  // Add a useEffect to monitor account balance changes
  useEffect(() => {
    console.log('Account balance updated:', accountBalance);
  }, [accountBalance]);

  // Add a useEffect to monitor daily P/L changes
  useEffect(() => {
    console.log('Daily P/L updated:', dailyPnL);
  }, [dailyPnL]);

  if (!username) {
    return <div>Your trading account is not configured yet! Please set your account and manage your trading allocations under Settings.</div>;
  }

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="w-full">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Trading Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between space-x-2">
              <span className={`text-sm px-2 py-1 rounded ${
                tradingStatus === 'running'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tradingStatus.charAt(0).toUpperCase() + tradingStatus.slice(1)}
              </span>
              <button
                onClick={toggleTrading}
                className={`px-3 py-2 md:px-4 md:py-2 text-sm rounded-lg text-white ${
                  tradingStatus === 'running'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {tradingStatus === 'running' ? 'Stop' : 'Start'}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Account Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold">
              ${accountBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Demo Account</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Today's P/L</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className={`text-xl md:text-2xl font-bold ${
              dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${dailyPnL.toFixed(2)}
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              {accountBalance > 0 ? ((dailyPnL / accountBalance) * 100).toFixed(2) : '0.00'}% ROI
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card className="max-h-[40vh] overflow-y-auto">
        <CardHeader className="p-3 md:p-4 sticky top-0 bg-white z-10">
          <CardTitle className="text-sm md:text-base">Open Positions for Today</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs md:text-sm bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Side</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Entry Price</th>
                  <th className="p-2 text-left">Current Price</th>
                  <th className="p-2 text-left">Unrealized P/L</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">No open positions</td>
                  </tr>
                ) : (
                  positions.map((position, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{position.symbol}</td>
                      <td className="p-2 capitalize">{position.side}</td>
                      <td className="p-2">{position.quantity}</td>
                      <td className="p-2">{typeof position.entryPrice === 'number' ? `$${position.entryPrice.toFixed(2)}` : '-'}</td>
                      <td className="p-2">{position.currentPrice !== null ? `$${position.currentPrice.toFixed(2)}` : '-'}</td>
                      <td className={`p-2 ${
                        typeof position.unrealizedPl === 'number' 
                          ? position.unrealizedPl >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                          : ''
                      }`}>
                        {typeof position.unrealizedPl === 'number' ? `$${position.unrealizedPl.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleClosePosition(position.symbol, position.side)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          title="Close position"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Closed Positions Section */}
      <div className="mt-6">
        <div className="rounded-lg overflow-hidden">
          <button
            onClick={() => setShowClosedPositions(!showClosedPositions)}
            className={`w-full py-3 px-4 transition-colors duration-200 flex items-center justify-between bg-white hover:bg-gray-50 text-gray-700 border border-gray-200`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xl transition-transform duration-200 ${showClosedPositions ? 'rotate-90' : ''}`}>›</span>
              <span className="font-medium">Closed Positions for Today</span>
            </div>
            <span className="text-sm text-gray-500">
              {closedPositions.length} position{closedPositions.length !== 1 ? 's' : ''}
            </span>
          </button>

          <div className={`transition-all duration-300 ease-in-out ${showClosedPositions ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>
            <Card className="rounded-t-none border-t-0">
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="text-xs md:text-sm bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Symbol</th>
                        <th className="p-2 text-left">Side</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Entry Price</th>
                        <th className="p-2 text-left">Exit Price</th>
                        <th className="p-2 text-left">Realized P/L</th>
                        <th className="p-2 text-left">Closed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedPositions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">No closed positions</td>
                        </tr>
                      ) : (
                        [...closedPositions]
                          .sort((a, b) => (b.closedAt?.getTime() || 0) - (a.closedAt?.getTime() || 0))
                          .map((position, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{position.symbol}</td>
                              <td className="p-2 capitalize">{position.side}</td>
                              <td className="p-2">{position.quantity}</td>
                              <td className="p-2">${position.entryPrice.toFixed(2)}</td>
                              <td className="p-2">${position.exitPrice.toFixed(2)}</td>
                              <td className={`p-2 ${
                                position.realizedPl >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${position.realizedPl.toFixed(2)}
                              </td>
                              <td className="p-2">{position.closedAt ? position.closedAt.toLocaleString() : 'Unknown'}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-6">
        <div className="rounded-lg overflow-hidden">
          <button
            onClick={() => setShowRecentOrders(!showRecentOrders)}
            className={`w-full py-3 px-4 transition-colors duration-200 flex items-center justify-between bg-white hover:bg-gray-50 text-gray-700 border border-gray-200`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xl transition-transform duration-200 ${showRecentOrders ? 'rotate-90' : ''}`}>›</span>
              <span className="font-medium">Recent Orders</span>
            </div>
            <span className="text-sm text-gray-500">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
          </button>

          <div className={`transition-all duration-300 ease-in-out ${showRecentOrders ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>
            <Card className="rounded-t-none border-t-0">
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="text-xs md:text-sm bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Symbol</th>
                        <th className="p-2 text-left">Side</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Filled Qty</th>
                        <th className="p-2 text-left">Avg. Fill Price</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">No recent orders</td>
                        </tr>
                      ) : (
                        orders.map((order, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{order.symbol}</td>
                            <td className="p-2 capitalize">{order.side}</td>
                            <td className="p-2">{order.quantity}</td>
                            <td className="p-2">{order.filledQuantity || '-'}</td>
                            <td className="p-2">{order.filledAvgPrice ? `$${order.filledAvgPrice.toFixed(2)}` : '-'}</td>
                            <td className="p-2 capitalize">{order.status}</td>
                            <td className="p-2">{order.submittedAt.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;