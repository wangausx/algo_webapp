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

export interface TradeSetting {
  user_id: string;
  subscribedSymbols: string[];
  riskSettings: {
    maxPositionSize: number;
    riskPercentage: number;
    maxDailyLoss: number;
  };
  isOption: 'yes' | 'no'
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
    },
    isOption: 'yes'
  });
  
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = React.useState("");

  const {
    saveAccountSettings,
    saveTradeSetting,
    addSymbol,
    removeSymbol
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
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Subscribing Symbols</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSymbol}
                    onChange={(e) => {
                      const symbol = e.target.value;
                      if (symbol) {
                        addSymbol(symbol);
                        setSelectedSymbol(""); // Reset after adding
                      }
                    }}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                  >
                    <option value="" disabled>Select a symbol</option>
                    {STOCK_SYMBOLS.filter(symbol => !tradeSetting.subscribedSymbols.includes(symbol)).map(symbol => (
                      <option key={symbol} value={symbol}>{symbol}</option>
                    ))}
                  </select>
                </div>
                {tradeSetting.subscribedSymbols.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tradeSetting.subscribedSymbols.map(symbol => (
                      <div key={symbol} className="flex items-center justify-between p-2 border-b">
                        <span>{symbol}</span>
                        <button
                          onClick={() => removeSymbol(symbol)}
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
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Trading Type (isOption) */}
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm">Trading Type</label>
                    <select
                      value={tradeSetting.isOption}
                      onChange={(e) => setTradeSetting(prev => ({
                        ...prev,
                        isOption: e.target.value as 'yes' | 'no',
                      }))}
                      className="w-full p-2 text-sm md:text-base border rounded-lg"
                    >
                      <option value="yes">Options</option>
                      <option value="no">Stocks</option>
                    </select>
                  </div>

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
                    <label className="text-xs md:text-sm">Risk Percentage (%)</label>
                    <input
                      type="number"
                      value={tradeSetting.riskSettings.riskPercentage}
                      onChange={(e) => setTradeSetting(prev => ({
                        ...prev,
                        riskSettings: { ...prev.riskSettings, riskPercentage: parseFloat(e.target.value) || 0 },
                      }))}
                      className="w-full p-2 text-sm md:text-base border rounded-lg"
                      min="0"
                      max="100"
                      step="0.1"
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