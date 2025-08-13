import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import React from 'react';
import { useTradeSettings } from '../hooks/useTradeSettings';
import DemoAccountRestrictionPopup from './DemoAccountRestrictionPopup';
import { AlertTriangle } from 'lucide-react';

export interface TradeSetting {
  user_id: string;
  subscribedSymbols: SymbolConfig[];
  riskSettings: {
    maxPositionSize: number;
    riskPercentage: number;
    maxDailyLoss: number;
  };
}

interface SymbolConfig {
  symbol: string;
  isOption: 'yes' | 'no';
  optionDetails?: {
    strike: number;
    expiration: string; // e.g., '2025-04-18'
    type: 'call' | 'put';
  };
}

interface TradeSettingsProps {
  username: string;
  demoAccount?: boolean;
}

// Predefined list of stock symbols
const STOCK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'WMT'];

const TradeSettings: React.FC<TradeSettingsProps> = ({ username, demoAccount = false }) => {
  const [showRestrictionPopup, setShowRestrictionPopup] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = React.useState("");
  const [isOptionSelected, setIsOptionSelected] = React.useState<'yes' | 'no'>('no');
  const [optionStrike, setOptionStrike] = React.useState<number>(0);
  const [optionExpiration, setOptionExpiration] = React.useState<string>("");
  const [optionType, setOptionType] = React.useState<'call' | 'put'>('call');
  const [showSymbolForm, setShowSymbolForm] = React.useState<boolean>(false);
  const demoDataLoadedRef = React.useRef(false);

  const {
    tradeSetting,
    setTradeSetting,
    saveTradeSetting,
    addSymbol,
    removeSymbol,
    isLoading,
    loadDemoTradeSettings
  } = useTradeSettings(username);

  // Load demo trade settings when demo account is selected (only once)
  React.useEffect(() => {
    if (demoAccount && !demoDataLoadedRef.current) {
      console.log('Loading demo trade settings...');
      demoDataLoadedRef.current = true;
      loadDemoTradeSettings();
    } else if (!demoAccount) {
      demoDataLoadedRef.current = false;
    }
  }, [demoAccount, loadDemoTradeSettings]);

  // Handle saving trade settings with demo account restriction
  const handleSaveTradeSettings = () => {
    if (demoAccount) {
      setShowRestrictionPopup(true);
      return;
    }
    
    if (!username || username.trim() === '') {
      setError("Username is required. Please set it in Account Settings.");
      return;
    }
    setError(null);
    saveTradeSetting(tradeSetting);
    console.log("Saving trade settings:", tradeSetting);
  };

  // Handle adding a new symbol with demo account restriction
  const handleAddSymbol = () => {
    if (demoAccount) {
      setShowRestrictionPopup(true);
      return;
    }
    
    if (!selectedSymbol) return;
    
    const symbolConfig: SymbolConfig = {
      symbol: selectedSymbol,
      isOption: isOptionSelected
    };
    
    if (isOptionSelected === 'yes') {
      symbolConfig.optionDetails = {
        strike: optionStrike,
        expiration: optionExpiration,
        type: optionType
      };
    }
    
    addSymbol(symbolConfig);
    setSelectedSymbol("");
    setIsOptionSelected('no');
    setOptionStrike(0);
    setOptionExpiration("");
    setOptionType('call');
    setShowSymbolForm(false);
  };

  // Handle removing a symbol with demo account restriction
  const handleRemoveSymbol = (symbolToRemove: string) => {
    if (demoAccount) {
      setShowRestrictionPopup(true);
      return;
    }
    removeSymbol(symbolToRemove);
  };

  // Handle form changes with demo account restriction
  const handleFormChange = (callback: () => void) => {
    if (demoAccount) {
      setShowRestrictionPopup(true);
      return;
    }
    callback();
  };

  // Format the display string for a symbol configuration
  const formatSymbolDisplay = (symbolConfig: SymbolConfig) => {
    if (symbolConfig.isOption === 'yes' && symbolConfig.optionDetails) {
      const { type, strike, expiration } = symbolConfig.optionDetails;
      return `${symbolConfig.symbol} ${type.toUpperCase()} $${strike} exp: ${expiration}`;
    }
    return symbolConfig.symbol;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">Loading trade settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="text-sm md:text-base">Trade Settings</CardTitle>
          <CardDescription className="text-xs md:text-sm">Configure your trading preferences and risk settings</CardDescription>
          {demoAccount && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">Demo account - changes are restricted</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {error}
              </div>
            )}
            <div>
              <div className="grid grid-cols-2 items-center">
                <label className="text-xs md:text-sm font-medium">Subscribing Symbols</label>
                {!showSymbolForm && (
                  <button
                    onClick={() => handleFormChange(() => setShowSymbolForm(true))}
                    className={`px-2 py-1 text-sm rounded hover:transition-colors ${
                      demoAccount 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    disabled={demoAccount}
                  >
                    Add Symbol
                  </button>
                )}
              </div>

              {showSymbolForm && (
                <div className="mt-2 p-4 border rounded-lg">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                          demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        disabled={demoAccount}
                      >
                        <option value="" disabled>Select a symbol</option>
                        {STOCK_SYMBOLS.filter(symbol =>
                          !tradeSetting.subscribedSymbols.some(s => s.symbol === symbol)
                        ).map(symbol => (
                          <option key={symbol} value={symbol}>{symbol}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium">Trading Type</label>
                      <select
                        value={isOptionSelected}
                        onChange={(e) => setIsOptionSelected(e.target.value as 'yes' | 'no')}
                        className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                          demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        disabled={demoAccount}
                      >
                        <option value="no">Stock</option>
                        <option value="yes">Option</option>
                      </select>
                    </div>

                    {isOptionSelected === 'yes' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-medium">Option Type</label>
                          <select
                            value={optionType}
                            onChange={(e) => setOptionType(e.target.value as 'call' | 'put')}
                            className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                              demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            disabled={demoAccount}
                          >
                            <option value="call">Call</option>
                            <option value="put">Put</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-medium">Strike Price ($)</label>
                          <input
                            type="number"
                            value={optionStrike === 0 ? "" : optionStrike}
                            onChange={(e) => setOptionStrike(parseFloat(e.target.value) || 0)}
                            className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                              demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            step="0.01"
                            min="0"
                            disabled={demoAccount}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-medium">Expiration Date</label>
                          <input
                            type="date"
                            value={optionExpiration}
                            onChange={(e) => setOptionExpiration(e.target.value)}
                            className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                              demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            disabled={demoAccount}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSymbol}
                        disabled={!selectedSymbol || demoAccount}
                        className={`px-4 py-2 rounded hover:transition-colors ${
                          demoAccount || !selectedSymbol
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowSymbolForm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {tradeSetting.subscribedSymbols.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {tradeSetting.subscribedSymbols.map((symbolConfig, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{formatSymbolDisplay(symbolConfig)}</span>
                      <button
                        onClick={() => handleRemoveSymbol(symbolConfig.symbol)}
                        className={`px-2 py-1 rounded hover:transition-colors ${
                          demoAccount 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                        disabled={demoAccount}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Risk Settings</label>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Max Position Size */}
                <div className="space-y-1">
                  <label className="text-xs md:text-sm">Max Position Size ($)</label>
                  <input
                    type="number"
                    value={tradeSetting.riskSettings.maxPositionSize}
                    onChange={(e) => handleFormChange(() => setTradeSetting(prev => ({
                      ...prev,
                      riskSettings: { ...prev.riskSettings, maxPositionSize: parseFloat(e.target.value) || 0 },
                    })))}
                    className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                      demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    min="0"
                    disabled={demoAccount}
                  />
                </div>

                {/* Risk Percentage */}
                <div className="space-y-1">
                  <label className="text-xs md:text-sm">Base Position Risk (%)</label>
                  <input
                    type="number"
                    value={tradeSetting.riskSettings.riskPercentage || ''}
                    onChange={(e) => handleFormChange(() => {
                      const value = e.target.value;
                      if (value === '') {
                        setTradeSetting(prev => ({
                          ...prev,
                          riskSettings: { ...prev.riskSettings, riskPercentage: 0 },
                        }));
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                        setTradeSetting(prev => ({
                          ...prev,
                          riskSettings: { ...prev.riskSettings, riskPercentage: numValue },
                        }));
                      }
                    })}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        setTradeSetting(prev => ({
                          ...prev,
                          riskSettings: { ...prev.riskSettings, riskPercentage: 0 },
                        }));
                      }
                    }}
                    className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                      demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Enter risk percentage"
                    disabled={demoAccount}
                  />
                </div>

                {/* Max Daily Loss */}
                <div className="space-y-1">
                  <label className="text-xs md:text-sm">Max Daily Loss ($)</label>
                  <input
                    type="number"
                    value={tradeSetting.riskSettings.maxDailyLoss}
                    onChange={(e) => handleFormChange(() => setTradeSetting(prev => ({
                      ...prev,
                      riskSettings: { ...prev.riskSettings, maxDailyLoss: parseFloat(e.target.value) || 0 },
                    })))}
                    className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                      demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    min="0"
                    disabled={demoAccount}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveTradeSettings}
              className={`w-full px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                demoAccount 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={demoAccount}
            >
              {demoAccount ? 'Changes Not Allowed (Demo Account)' : 'Save Trade Settings'}
            </button>
          </div>
        </CardContent>
      </Card>

      <DemoAccountRestrictionPopup
        isOpen={showRestrictionPopup}
        onClose={() => setShowRestrictionPopup(false)}
      />
    </>
  );
};

export default TradeSettings;
