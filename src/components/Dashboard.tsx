import { Position } from '../hooks/useTrading'; // Use the same type

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "./ui/card";
  
  interface DashboardProps {
    tradingStatus: 'running' | 'stopped';
    toggleTrading: () => void;
    positions: Position[];
  }
  
  const Dashboard: React.FC<DashboardProps> = ({ tradingStatus, toggleTrading, positions }) => {
    // Calculate total P/L from positions
    const calculateTotalPL = (): number => {
      return positions.reduce((acc, position) => {
        const pl = (position.currentPrice - position.entryPrice) * position.position;
        return acc + pl;
      }, 0);
    };
  
    // Calculate account balance
    const totalPL = calculateTotalPL();
    const accountBalance = 10000 + totalPL;
  
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Trading Status Card */}
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
  
          {/* Account Balance Card */}
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
  
          {/* Today's P/L Card */}
          <Card>
            <CardHeader className="p-3 md:p-4">
              <CardTitle className="text-sm md:text-base">Today's P/L</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="text-xl md:text-2xl font-bold text-green-600">+$225.50</div>
              {/*//<div className={`text-xl md:text-2xl font-bold ${
              //  totalPL >= 0 ? 'text-green-600' : 'text-red-600'
              //}`}>
              //</CardContent>  {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
              //</div>
              //<div className="text-xs md:text-sm text-gray-500">
              //</div>  {(totalPL / 10000 * 100).toFixed(1)}% ROI
              //</div>*/}
            </CardContent>
          </Card>
        </div>
  
        {/* Positions Table */}
        <Card>
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Open Positions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs md:text-sm bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Symbol</th>
                    <th className="p-2 text-left">Position</th>
                    <th className="p-2 text-left">Entry Price</th>
                    <th className="p-2 text-left">Current Price</th>
                    <th className="p-2 text-left">P/L</th>
                  </tr>
                </thead>
                <tbody className="text-xs md:text-sm">
                      <tr className="border-t">
                        <td className="p-2">AAPL</td>
                        <td className="p-2">100</td>
                        <td className="p-2">$250.00</td>
                        <td className="p-2">$245.5</td>
                        <td className="p-2 text-red-600">-$450.00</td>
                      </tr>
                    </tbody>
                    <tbody className="text-xs md:text-sm">
                      <tr className="border-t">
                        <td className="p-2">TSLA</td>
                        <td className="p-2">50</td>
                        <td className="p-2">$335.00</td>
                        <td className="p-2">$351.50</td>
                        <td className="p-2 text-green-600">+$775.00</td>
                      </tr>
                    </tbody>                    
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default Dashboard;