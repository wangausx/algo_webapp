import * as Tabs from "@radix-ui/react-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import '../tabs.css';
import React from 'react';
import { useSettings } from '../hooks/useSettings';

export interface AccountConfig {
  username: string;
  apiKey: string;
  secretKey: string;
  brokerageType: 'paper' | 'live';
  modelType: 'intraday_reversal' | 'trend_following';
  riskLevel: 'moderate' | 'conservative' | 'aggressive';
  balance: number;
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

export interface TradeSetting {
  user_id: string;
  subscribedSymbols: SymbolConfig[];
  riskSettings: {
    maxPositionSize: number;
    riskPercentage: number;
    maxDailyLoss: number;
  };
}

interface SettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  setParentAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
}

// Predefined list of stock symbols
const STOCK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'WMT'];

const Settings: React.FC<SettingsProps> = ({ accountConfig: initialAccountConfig, setParentAccountConfig }) => {
  const [accountConfig, setAccountConfig] = React.useState<AccountConfig>(initialAccountConfig);
  const [tradeSetting, setTradeSetting] = React.useState<TradeSetting>({
    user_id: initialAccountConfig.username,
    subscribedSymbols: [],
    riskSettings: {
      maxPositionSize: 1000,
      riskPercentage: 2,
      maxDailyLoss: 500,
    }
  });
  
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = React.useState("");
  const [isOptionSelected, setIsOptionSelected] = React.useState<'yes' | 'no'>('no');
  const [optionStrike, setOptionStrike] = React.useState<number>(0);
  const [optionExpiration, setOptionExpiration] = React.useState<string>("");
  const [optionType, setOptionType] = React.useState<'call' | 'put'>('call');
  const [showSymbolForm, setShowSymbolForm] = React.useState<boolean>(false);

  const {
    saveAccountSettings,
    saveTradeSetting,
    addSymbol,
    removeSymbol,
  } = useSettings({
    accountConfig,
    setAccountConfig,
    tradeSetting,
    setTradeSetting
  });

  // Sync accountConfig changes to parent and update tradeSetting.user_id
  React.useEffect(() => {
    setParentAccountConfig(accountConfig);
    setTradeSetting(prev => ({ ...prev, user_id: accountConfig.username}));
  }, [accountConfig, setParentAccountConfig]);

  // Handle saving trade settings
  const handleSaveTradeSettings = () => {
    if (!accountConfig.username || accountConfig.username.trim() === '') {
      setError("Username is required. Please set it in Account Settings tab.");
      return;
    }
    setError(null);
    saveTradeSetting(tradeSetting);
    console.log("Saving trade settings:", tradeSetting);
  };

  // Handle adding a new symbol with configuration
  const handleAddSymbol = () => {
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

  // Format the display string for a symbol configuration
  const formatSymbolDisplay = (symbolConfig: SymbolConfig) => {
    if (symbolConfig.isOption === 'yes' && symbolConfig.optionDetails) {
      const { type, strike, expiration } = symbolConfig.optionDetails;
      return `${symbolConfig.symbol} ${type.toUpperCase()} $${strike} exp: ${expiration}`;
    }
    return symbolConfig.symbol;
  };

  return (
    <Card>
      <Tabs.Root defaultValue="account" className="w-full">
        <Tabs.List className="TabsList">
          <Tabs.Trigger value="account" className="TabsTrigger">
            Account Settings
          </Tabs.Trigger>
          <Tabs.Trigger value="trade" className="TabsTrigger">
            Trade Settings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="account" className="TabsContent">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Account Settings</CardTitle>
            <CardDescription className="text-xs md:text-sm">Configure your account parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <form className="space-y-3 md:space-y-4 grid md:grid-cols-2 gap-4" onSubmit={saveAccountSettings}>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={accountConfig.username}
                  onChange={(e) => setAccountConfig(prev => ({...prev, username: e.target.value}))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={accountConfig.apiKey}
                  onChange={(e) => setAccountConfig(prev => ({...prev, apiKey: e.target.value}))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Secret Key</label>
                <input
                  type="password"
                  value={accountConfig.secretKey}
                  onChange={(e) => setAccountConfig(prev => ({...prev, secretKey: e.target.value}))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Account Balance ($)</label>
                <input
                  type="number"
                  value={accountConfig.balance === 0 ? '' : accountConfig.balance}
                  onChange={(e) => setAccountConfig(prev => ({
                    ...prev,
                    balance: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Trading Mode</label>
                <select
                  value={accountConfig.brokerageType}
                  onChange={(e) => setAccountConfig(prev => ({
                    ...prev,
                    brokerageType: e.target.value as AccountConfig["brokerageType"]
                  }))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                >
                  <option value="paper">Paper Trading</option>
                  <option value="live">Live Trading</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Trading Model</label>
                <select
                  value={accountConfig.modelType}
                  onChange={(e) => setAccountConfig(prev => ({
                    ...prev,
                    modelType: e.target.value as AccountConfig["modelType"]
                  }))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                >
                  <option value="intraday_reversal">Intraday Reversal</option>
                  <option value="trend_following">Trend Following</option>
                </select>
              </div>

              <button
                type="submit"
                className="md:col-span-2 w-full px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Settings
              </button>
            </form>
          </CardContent>
        </Tabs.Content>

        <Tabs.Content value="trade" className="TabsContent">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Trade Settings</CardTitle>
            <CardDescription className="text-xs md:text-sm">Configure your trading preferences and risk settings</CardDescription>
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
                      onClick={() => setShowSymbolForm(true)}
                      className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
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
                          className="w-full p-2 text-sm md:text-base border rounded-lg"
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
                          className="w-full p-2 text-sm md:text-base border rounded-lg"
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
                              className="w-full p-2 text-sm md:text-base border rounded-lg"
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
                              className="w-full p-2 text-sm md:text-base border rounded-lg"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs md:text-sm font-medium">Expiration Date</label>
                            <input
                              type="date"
                              value={optionExpiration}
                              onChange={(e) => setOptionExpiration(e.target.value)}
                              className="w-full p-2 text-sm md:text-base border rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddSymbol}
                          disabled={!selectedSymbol}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
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
                          onClick={() => removeSymbol(symbolConfig.symbol)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
                      onChange={(e) => setTradeSetting(prev => ({
                        ...prev,
                        riskSettings: { ...prev.riskSettings, maxPositionSize: parseFloat(e.target.value) || 0 },
                      }))}
                      className="w-full p-2 text-sm md:text-base border rounded-lg"
                      min="0"
                    />
                  </div>

                  {/* Risk Percentage */}
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm">Base Position Risk (%)</label>
                    <input
                      type="number"
                      value={tradeSetting.riskSettings.riskPercentage || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty input for direct typing
                        if (value === '') {
                          setTradeSetting(prev => ({
                            ...prev,
                            riskSettings: { ...prev.riskSettings, riskPercentage: 0 },
                          }));
                          return;
                        }
                        const numValue = parseFloat(value);
                        // Only update if it's a valid number between 0 and 100
                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                          setTradeSetting(prev => ({
                            ...prev,
                            riskSettings: { ...prev.riskSettings, riskPercentage: numValue },
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        // If the field is empty on blur, set it to 0
                        if (e.target.value === '') {
                          setTradeSetting(prev => ({
                            ...prev,
                            riskSettings: { ...prev.riskSettings, riskPercentage: 0 },
                          }));
                        }
                      }}
                      className="w-full p-2 text-sm md:text-base border rounded-lg"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Enter risk percentage"
                    />
                  </div>

                  {/* Max Daily Loss */}
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm">Max Daily Loss ($)</label>
                    <input
                      type="number"
                      value={tradeSetting.riskSettings.maxDailyLoss}
                      onChange={(e) => setTradeSetting(prev => ({
                        ...prev,
                        riskSettings: { ...prev.riskSettings, maxDailyLoss: parseFloat(e.target.value) || 0 },
                      }))}
                      className="w-full p-2 text-sm md:text-base border rounded-lg"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveTradeSettings}
                className="w-full px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Trade Settings
              </button>
            </div>
          </CardContent>
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  );
};

export default Settings;