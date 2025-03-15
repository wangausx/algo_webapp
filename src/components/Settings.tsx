import { Dispatch, SetStateAction } from "react";
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
  balance: number; // Added balance to AccountConfig
}

export interface PortfolioEntry {
  ticker: string;
  share_amount: number;
}

interface SettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
}

const Settings: React.FC<SettingsProps> = ({ accountConfig: initialAccountConfig, setAccountConfig: setParentAccountConfig }) => {
  const [accountConfig, setAccountConfig] = React.useState<AccountConfig>(initialAccountConfig);
  const [portfolio, setPortfolio] = React.useState<PortfolioEntry[]>([]);
  const [ticker, setTicker] = React.useState<string>('');
  const [tickerHistory, setTickerHistory] = React.useState<string[]>([]);

  const {
    saveAccountSettings,
    savePortfolio,
    addTicker,
    removeTicker
  } = useSettings({
    accountConfig,
    setAccountConfig,
    portfolio,
    setPortfolio,
    ticker,
    setTicker,
    tickerHistory,
    setTickerHistory
  });

  React.useEffect(() => {
    setParentAccountConfig(accountConfig);
  }, [accountConfig, setParentAccountConfig]);

  return (
    <Card>
      <Tabs.Root defaultValue="account" className="w-full">
        <Tabs.List className="TabsList">
          <Tabs.Trigger value="account" className="TabsTrigger">
            Account Settings
          </Tabs.Trigger>
          <Tabs.Trigger value="portfolio" className="TabsTrigger">
            Portfolio Setting
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="account" className="TabsContent">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Account Settings</CardTitle>
            <CardDescription className="text-xs md:text-sm">Configure your trading parameters</CardDescription>
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
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Risk Level</label>
                <select
                  value={accountConfig.riskLevel}
                  onChange={(e) => setAccountConfig(prev => ({
                    ...prev,
                    riskLevel: e.target.value as AccountConfig["riskLevel"]
                  }))}
                  className="w-full p-2 text-sm md:text-base border rounded-lg"
                >
                  <option value="moderate">Moderate</option>
                  <option value="conservative">Conservative</option>
                  <option value="aggressive">Aggressive</option>
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

        <Tabs.Content value="portfolio" className="TabsContent">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-sm md:text-base">Trading Portfolio</CardTitle>
            <CardDescription className="text-xs md:text-sm">Manage your trading allocations</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs md:text-sm font-medium">Add Ticker (for Reversal Trading)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                    list="tickerHistory"
                    placeholder="Enter ticker (e.g., AAPL)"
                  />
                  <datalist id="tickerHistory">
                    {tickerHistory.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <button
                    onClick={addTicker}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
              </div>
              {portfolio.length > 0 && (
                <div className="space-y-2">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Ticker</th>
                        <th className="border p-2 text-left">Shares per Trade</th>
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((entry, index) => (
                        <tr key={entry.ticker}>
                          <td className="border p-2">{entry.ticker}</td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={entry.share_amount === 0 ? '' : entry.share_amount}
                              onChange={(e) => {
                                const newPortfolio = [...portfolio];
                                const inputValue = e.target.value;
                                newPortfolio[index].share_amount = inputValue === '' ? 0 : parseInt(inputValue) || 0;
                                setPortfolio(newPortfolio);
                              }}
                              className="w-full p-1 border rounded"
                              min="0"
                              step="1"
                              placeholder="0"
                            />
                          </td>
                          <td className="border p-2">
                            <button
                              onClick={() => removeTicker(entry.ticker)}
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                onClick={savePortfolio}
                className="w-full px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Portfolio
              </button>
            </div>
          </CardContent>
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  );
};

export default Settings;