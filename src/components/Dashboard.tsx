import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatDateWithOptions } from '../lib/utils';

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
  filledAt?: Date;
  clientOrderId?: string;
}

interface DashboardProps {
  tradingStatus: 'running' | 'stopped';
  toggleTrading: () => void;
  username?: string;
  positions: OpenPosition[];
  closedPositions: ClosedPosition[];
  handleCancelPosition: (symbol: string, side: 'long' | 'short') => Promise<void>;
  fetchClosedPositions: () => Promise<void>;
  accountBalance: number;
  dailyPnL: number;
  refreshAccountData: () => Promise<void>;
  orders: StockOrder[];
  fetchOrders: () => Promise<void>;
  tradingMode?: 'paper' | 'live';
  demoAccount?: boolean;
  isLoadingSavedData?: boolean; // Add this prop to track if app is still loading saved data
  usernameValidation?: {
    isValid: boolean;
    isChecking: boolean;
    exists: boolean;
    canUseForApi: boolean;
    error: string | null;
  };
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  tradingStatus, 
  toggleTrading, 
  username = '',
  positions,
  closedPositions,
  handleCancelPosition,
  fetchClosedPositions,
  accountBalance,
  dailyPnL,
  refreshAccountData,
  orders,
  fetchOrders,
  tradingMode = 'paper',
  demoAccount = false,
  isLoadingSavedData = false,
  usernameValidation = {
    isValid: false,
    isChecking: false,
    exists: false,
    canUseForApi: false,
    error: null
  }
}) => {
  // Debug: Log positions prop
  console.log('Dashboard received positions prop:', positions);
  // UI state
  const [showClosedPositions, setShowClosedPositions] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  const { 
    isLoading, 
    error, 
    initializeData 
  } = useDashboardData(
    username,
    fetchClosedPositions,
    fetchOrders,
    refreshAccountData
  );

  const handleStopTrading = () => {
    // Prevent demo account users from stopping trading
    if (demoAccount) {
      return;
    }
    
    if (positions.length > 0) {
      setShowStopConfirmation(true);
    } else {
      toggleTrading();
    }
  };

  // Initial data fetch - only for validated usernames that can be used for API calls
  useEffect(() => {
    if (username && username.length >= 6 && usernameValidation?.canUseForApi && !usernameValidation.isChecking) {
      initializeData();
    }
  }, [username, usernameValidation, initializeData]);

  // Show loading state while app is loading saved data
  if (isLoadingSavedData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-lg mb-4">Loading saved account data...</div>
        <div className="text-gray-600">Please wait while we retrieve your account information.</div>
      </div>
    );
  }

  // Show loading state while waiting for username validation to start
  if (username && username.length >= 6 && !usernameValidation) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-lg mb-4">Initializing account validation...</div>
        <div className="text-gray-600">Please wait while we set up your account.</div>
      </div>
    );
  }

  // Show loading state while username validation is in progress
  if (username && username.length >= 6 && usernameValidation?.isChecking) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-lg mb-4">Validating account credentials...</div>
        <div className="text-gray-600">Please wait while we verify your account access.</div>
      </div>
    );
  }

  // Show loading state while waiting for username to be validated for API calls
  if (username && username.length >= 6 && !usernameValidation?.canUseForApi && !usernameValidation?.isChecking) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-lg mb-4">Setting up account access...</div>
        <div className="text-gray-600">Please wait while we prepare your trading dashboard.</div>
      </div>
    );
  }

  // Show error if username validation failed
  if (username && username.length >= 6 && usernameValidation?.error && !usernameValidation.isChecking) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">Account validation failed</div>
        <div className="text-gray-600 mb-4">{usernameValidation.error}</div>
        <div className="text-gray-600">Please check your account settings and try again.</div>
      </div>
    );
  }

  // Only show "not configured" if there's actually no username
  if (!username || username.length < 6) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg mb-4">Your trading account is not configured yet!</div>
        <div className="text-gray-600">Please go to Account Settings to configure your account and manage your trading allocations.</div>
      </div>
    );
  }

  // Show loading state while dashboard data is being fetched
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-lg mb-4">Loading dashboard data...</div>
        <div className="text-gray-600">Please wait while we fetch your trading information.</div>
      </div>
    );
  }

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
      {/* Stop Trading Confirmation Modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cannot Stop Trading</h3>
            <p className="text-gray-600 mb-4">
              You have {positions.length} open position{positions.length !== 1 ? 's' : ''}. Please close all open positions manually before stopping trading.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                To close positions, use the "✕" button next to each position in the Open Positions table.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowStopConfirmation(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="w-full">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Trading Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between space-x-2 mb-3">
              <span className={`text-sm px-2 py-1 rounded ${
                tradingStatus === 'running'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tradingStatus.charAt(0).toUpperCase() + tradingStatus.slice(1)}
              </span>
              <button
                onClick={tradingStatus === 'running' ? handleStopTrading : toggleTrading}
                disabled={demoAccount && tradingStatus === 'running'}
                className={`px-3 py-2 md:px-4 md:py-2 text-sm rounded-lg text-white transition-colors ${
                  tradingStatus === 'running'
                    ? demoAccount 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {tradingStatus === 'running' ? 'Stop' : 'Start'}
              </button>
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-2">
              {tradingMode === 'paper' ? 'Paper Trading' : 'Live Trading'}
            </div>
            {demoAccount && tradingStatus === 'running' && (
              <div className="text-xs text-gray-400 mt-1">
                Demo account - Stop button disabled
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Account Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold mb-3">
              ${accountBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              {demoAccount ? 'Demo Account' : 'Personal Account'}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Today's P/L</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className={`text-xl md:text-2xl font-bold mb-3 ${
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">Open Positions for Today</CardTitle>
            <button
              onClick={async () => {
                try {
                  await Promise.all([
                    refreshAccountData(),
                    fetchClosedPositions(),
                    fetchOrders()
                  ]);
                  console.log('Manual refresh completed');
                } catch (error) {
                  console.error('Manual refresh failed:', error);
                }
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Refresh all data"
            >
              ↻ Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs md:text-sm bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Side</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Avg. Entry Price</th>
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
                          onClick={() => handleCancelPosition(position.symbol, position.side)}
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
                        <th className="p-2 text-left">Avg. Entry Price</th>
                        <th className="p-2 text-left">Avg. Exit Price</th>
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
                          .map((position) => (
                            <tr key={`${position.symbol}-${position.side}-${position.closedAt?.getTime() || 'unknown'}`} className="border-t">
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
                              <td className="p-2">{position.closedAt ? formatDateWithOptions(position.closedAt, 'short') : 'Unknown'}</td>
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
                        <th className="p-2 text-left">Filled Qty</th>
                        <th className="p-2 text-left">Avg. Fill Price</th>
                        <th className="p-2 text-left">Submitted At</th>
                        <th className="p-2 text-left">Filled At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">No recent orders</td>
                        </tr>
                      ) : (
                        [...orders]
                          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
                          .map((order) => (
                            <tr key={`${order.symbol}-${order.side}-${order.submittedAt.getTime()}-${order.clientOrderId || 'no-id'}`} className="border-t">
                              <td className="p-2">{order.symbol}</td>
                              <td className="p-2 capitalize">{order.side}</td>
                              <td className="p-2">{order.filledQuantity || '-'}</td>
                              <td className="p-2">{order.filledAvgPrice ? `$${order.filledAvgPrice.toFixed(2)}` : '-'}</td>
                              <td className="p-2">{formatDateWithOptions(order.submittedAt, 'short')}</td>
                              <td className="p-2">{order.filledAt ? formatDateWithOptions(order.filledAt, 'short') : '-'}</td>
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