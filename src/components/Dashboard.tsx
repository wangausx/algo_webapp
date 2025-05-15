import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useWebSocket, PositionUpdatePayload, OrderUpdatePayload } from '../hooks/useWebSocket';

interface OpenPositionInstance {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  unrealizedPl: number;
  //entryTimestamp: Date;
  //strategyId?: string;
}

interface DashboardProps {
  tradingStatus: 'running' | 'stopped';
  toggleTrading: () => void;
  username?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ tradingStatus, toggleTrading, username = '' }) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [positions, setPositions] = useState<OpenPositionInstance[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePositionUpdate = useCallback((positionUpdate: PositionUpdatePayload['data']) => {
    console.log('Position update received: ', positionUpdate);
  setPositions((prev) => {
    const updated = prev.filter((p) => p.symbol !== positionUpdate.symbol);
    return [
      ...updated,
      {
        symbol: positionUpdate.symbol,
        side: positionUpdate.side,
        quantity: Number(positionUpdate.quantity),
        entryPrice: positionUpdate.entryPrice != null ? Number(positionUpdate.entryPrice) : null,
        currentPrice: positionUpdate.currentPrice != null ? Number(positionUpdate.currentPrice) : null,
        unrealizedPl: positionUpdate.unrealizedPl != null ? Number(positionUpdate.unrealizedPl) : null,
      } as OpenPositionInstance,
    ];
  });
  }, []);

  
  const handleOrderUpdate = useCallback((orderUpdate: OrderUpdatePayload['payload']) => {
    console.log('orderUpdate received: ', orderUpdate);
    setOrders((prev) => {
      const updated = prev.filter((o) => o.symbol !== orderUpdate.symbol || o.status !== 'open');
      return [
        ...updated,
        {
          ...orderUpdate,
          submittedAt: orderUpdate.submittedAt ? new Date(orderUpdate.submittedAt) : undefined,
          expiresAt: orderUpdate.expiresAt ? new Date(orderUpdate.expiresAt) : null,
        },
      ];
    });
  }, []); // Add dependencies here if needed
  
  useWebSocket(username, handlePositionUpdate, handleOrderUpdate);
  

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
        const accountRes = await fetch(`http://localhost:3001/api/router/account/${username}`);
        if (!accountRes.ok) {
          throw new Error(`Failed to fetch account data: ${accountRes.status}`);
        }
        
        const accountData = await accountRes.json();
        setAccountBalance(Number(accountData.balance) || 0);
        console.log('Acccount balance fetched: ', accountData.balance);

        // Fetch initial positions
        const positionRes = await fetch(`/api/router/positions/${username}`);
        if (positionRes.ok) {
          const positionData = await positionRes.json();
          console.log('Open positions retrieved: ', positionData)
          const positionArray = (Array.isArray(positionData)
            ? positionData
            : positionData.positions || []
          ).map((entry: any) => ({
            symbol: entry.symbol,
            side: entry.side,
            quantity: entry.quantity,
            entryPrice: entry.avgEntryPrice,
            currentPrice: entry.currentPrice ?? null,
            unrealizedPl: entry.unrealizedPl ?? null,
          }));
          
          setPositions(positionArray);
        } else {
          console.log('No open positions yet!');
        }

        // Fetch orders
        const ordersRes = await fetch(`/api/router/orders/${username}`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          console.log('Recent orders retrieved: ', ordersData)
          const ordersArray = (Array.isArray(ordersData)
            ? ordersData
            : ordersData.orders || []
          ).map((order: any) => ({
            symbol: order.symbol,
            //orderType: order.type,
            side: order.side,
            quantity: order.quantity,
            filledQty: order.filledQty,
            avgFillPrice: order.filledAvgPrice,
            status: order.status,
            //submittedAt: new Date(order.submitted_at),
            submittedAt: order.submittedAt ? new Date(order.submittedAt) : null,
            //expiresAt: order.expiredAt ? new Date(order.expiredAt) : null,
          }));
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
  }, [username]);

  const totalPL = positions.reduce((acc, pos) => acc + (Number(pos.unrealizedPl) || 0), 0);
  const currentBalance = accountBalance + totalPL;

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
              ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Demo Account</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Today's P/L</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold text-gray-700">
              ${totalPL.toFixed(2)}
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              {accountBalance > 0 ? ((totalPL / accountBalance) * 100).toFixed(2) : '0.00'}% ROI
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card className="max-h-[40vh] overflow-y-auto">
        <CardHeader className="p-3 md:p-4 sticky top-0 bg-white z-10">
          <CardTitle className="text-sm md:text-base">Open Positions</CardTitle>
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
                </tr>
              </thead>
              <tbody>
                {positions.map((entry, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{entry.symbol}</td>
                    <td className="p-2 capitalize">{entry.side}</td>
                    <td className="p-2">{entry.quantity}</td>
                    <td className="p-2">{typeof entry.entryPrice === 'number' ? `$${entry.entryPrice.toFixed(2)}` : '-'}</td>
                    <td className="p-2">{typeof entry.currentPrice === 'number' ? `$${entry.currentPrice.toFixed(2)}` : '-'}</td>
                    <td className="p-2">{typeof entry.unrealizedPl=== 'number' ? `$${entry.unrealizedPl.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="mt-6 max-h-[40vh] overflow-y-auto">
        <CardHeader className="p-3 md:p-4 sticky top-0 bg-white z-10">
          <CardTitle className="text-sm md:text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs md:text-sm bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  {/*<th className="p-2 text-left">Type</th>*/}
                  <th className="p-2 text-left">Side</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Filled Qty</th>
                  <th className="p-2 text-left">Avg. Fill Price</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Submitted At</th>
                  {/*<th className="p-2 text-left">Expires At</th>*/}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{order.symbol}</td>
                    {/*<td className="p-2 capitalize">{order.orderType}</td>*/}
                    <td className="p-2 capitalize">{order.side}</td>
                    <td className="p-2">{order.quantity}</td>
                    <td className="p-2">{order.filledQty}</td>
                    <td className="p-2">{typeof order.avgFillPrice === 'number' ? `$${order.avgFillPrice.toFixed(2)}` : '-'}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2">{order.submittedAt ? order.submittedAt.toLocaleString() : ''}</td>
                    {/*<td className="p-2">{order.expiresAt ? order.expiresAt.toLocaleString() : ''}</td>*/}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;
