import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

// The new interface matching the DB structure
interface OpenPositionInstance {
  userId: string;
  symbol: string;
  strategyId?: string;
  entryTimestamp: Date;
  isOption?: boolean;
  // Keeping some fields from the old interface for display purposes
  share_amount?: number;
  entry_price?: number;
  currentPrice?: number | null;
}

interface DashboardProps {
  tradingStatus: 'running' | 'stopped';
  toggleTrading: () => void;
  username?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ tradingStatus, toggleTrading, username = '' }) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [positions, setPositions] = useState<OpenPositionInstance[]>([]);
  const [tradingHistory, setTradingHistory] = useState<OpenPositionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Function to fetch current price from Yahoo Finance
  const fetchCurrentPrice = async (symbol: string): Promise<number | null> => {
    try {
      const response = await fetch(`/api/stock-price?ticker=${symbol}`);
      const data = await response.json();
      console.log(`Response for ${symbol}:`, data); 
      const price = data.price;
      return price || null;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  };

  // Function to update current prices for all positions
  const updatePrices = async (currentPositions: OpenPositionInstance[]) => {
    const updatedPositions = await Promise.all(
      currentPositions.map(async (pos) => {
        const currentPrice = await fetchCurrentPrice(pos.symbol);
        return { ...pos, currentPrice };
      })
    );
    setPositions(updatedPositions);
  };

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
        const accountRes = await fetch(`/api/account/${username}`);
        if (!accountRes.ok) {
          throw new Error(`Failed to fetch account data: ${accountRes.status}`);
        }
        const accountData = await accountRes.json();
        setAccountBalance(accountData.balance || 0);

        // Fetch initial positions with new interface
        const positionRes = await fetch(`/api/positions/${username}`);
        let positionArray = [];
        
        if (positionRes.ok) {
          const positionData = await positionRes.json();
          console.log('positionData refreshed.');
          positionArray = (Array.isArray(positionData) 
            ? positionData 
            : positionData.positions || []
          ).map((entry: any) => ({
            userId: entry.userId,
            symbol: entry.symbol,
            strategyId: entry.strategyId,
            entryTimestamp: new Date(entry.entryTimestamp),
            isOption: entry.isOption || false,
            // Additional fields for display
            share_amount: entry.share_amount,
            entry_price: entry.entry_price,
            currentPrice: null,
          }));
        } else {
          console.log('No open positions yet!');
        }

        // Set positions and update prices if there are any
        setPositions(positionArray);
        if (positionArray.length > 0) {
          await updatePrices(positionArray);
        }

        // Fetch trading history
        const historyRes = await fetch(`/api/trade-history/${username}`);
        const historyData = historyRes.ok ? await historyRes.json() : {};
        const historyArray = (Array.isArray(historyData)
          ? historyData
          : historyData.history || []
        ).map((entry: any) => ({
          userId: entry.userId,
          symbol: entry.symbol,
          strategyId: entry.strategyId,
          entryTimestamp: new Date(entry.entryTimestamp),
          isOption: entry.isOption || false,
          share_amount: entry.share_amount,
          entry_price: entry.entry_price,
        }));
        setTradingHistory(historyArray);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for current prices every 20 seconds
    const intervalId = setInterval(() => {
      if (positions.length > 0) {
        updatePrices(positions);
      }
    }, 20000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);

  }, [username]);

  const totalPL = 0;
  const currentBalance = accountBalance + totalPL;

  if (!username) {
    return <div>Your trading account is not configured yet! Please set your account and manage your trading allocations under Settings.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
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

  const TradingHistoryContent = () => (
    <div className="max-h-[60vh] overflow-y-auto">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-xs md:text-sm bg-gray-50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Symbol</th>
              <th className="p-2 text-left">Position</th>
              <th className="p-2 text-left">Entry Time</th>
              <th className="p-2 text-left">Strategy</th>
              <th className="p-2 text-left">Option</th>
              <th className="p-2 text-left">Entry Price</th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm">
            {tradingHistory.map((entry, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{entry.symbol}</td>
                <td className="p-2">{entry.share_amount || '-'}</td>
                <td className="p-2">{entry.entryTimestamp.toLocaleString()}</td>
                <td className="p-2">{entry.strategyId || '-'}</td>
                <td className="p-2">{entry.isOption ? 'Option' : 'Stock'}</td>
                <td className="p-2">{entry.entry_price || '-'}</td>
              </tr>
            ))}
            {tradingHistory.length === 0 && (
              <tr>
                <td colSpan={6} className="p-2 text-center text-gray-500">
                  No trading history
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Existing Cards for Trading Status, Account Balance, Today's P/L */}
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
            <div className="text-xl md:text-2xl font-bold text-gray-500">
              $0.00
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              0.0% ROI
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions Table */}
      <Card className="max-h-[40vh] overflow-y-auto">
        <CardHeader className="p-3 md:p-4 sticky top-0 bg-white z-10">
          <CardTitle className="text-sm md:text-base">Open Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs md:text-sm bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Symbol</th>
                  <th className="p-2 text-left">Position</th>
                  <th className="p-2 text-left">Entry Time</th>
                  <th className="p-2 text-left">Strategy</th>
                  <th className="p-2 text-left">Option</th>
                  <th className="p-2 text-left">Current Price</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {positions.map((entry, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{entry.symbol}</td>
                    <td className="p-2">{entry.share_amount || '-'}</td>
                    <td className="p-2">{entry.entryTimestamp.toLocaleString()}</td>
                    <td className="p-2">{entry.strategyId || '-'}</td>
                    <td className="p-2">{entry.isOption ? 'Option' : 'Stock'}</td>
                    <td className="p-2">{entry.currentPrice ?? '-'}</td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-gray-500">
                      No open positions yet!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trading History Button */}
      <div className="flex justify-end p-4">
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogTrigger asChild>
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Trading History
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Trading History</DialogTitle>
            </DialogHeader>
            <TradingHistoryContent />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;