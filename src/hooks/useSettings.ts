import { useEffect } from 'react';
import { AccountConfig, TradeSetting } from '../components/Settings';

interface UseSettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  tradeSetting: TradeSetting;
  setTradeSetting: React.Dispatch<React.SetStateAction<TradeSetting>>;
  //symbol: string;
  //setSymbol: React.Dispatch<React.SetStateAction<string>>;
  //tickerHistory: string[];
  //setTickerHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

interface TradeSettingData {
  username: string;
  tradeSetting: TradeSetting;
}

export const useSettings = ({
  accountConfig,
  setAccountConfig,
  tradeSetting,
  setTradeSetting
}: UseSettingsProps) => {
  const saveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payload being sent:', JSON.stringify(accountConfig));
    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountConfig),
      });
      if (!response.ok) throw new Error('Failed to save account settings');
      alert('Account settings saved successfully');
    } catch (error) {
      console.error('Error saving account settings:', error);
      alert('Failed to save account settings');
    }
  };

  const saveTradeSetting = async ({ username, tradeSetting }: TradeSettingData) => {
    if (!username) throw new Error('Username is required');
    if (!tradeSetting?.paperBalance || !tradeSetting?.subscribedSymbols || !tradeSetting?.riskSettings) {
      throw new Error('Invalid trade setting data');
    }
    try {
      const response = await fetch('/api/tradesetting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          tradeSetting: tradeSetting,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tradeSetting');
      }
      
      const data = await response.json();
      console.log('Saving tradeSetting response: ', data);
      setTradeSetting(data); // Update local state with server response
      return data;
    } catch (error) {
      console.error('Error saving tradeSetting:', error);
      throw error; // Let the caller handle the error
    }
  };

  // Handle adding a symbol
  const addSymbol = (symbol: string) => {
    if (symbol && !tradeSetting.subscribedSymbols.includes(symbol)) {
      setTradeSetting(prev => ({
        ...prev,
        subscribedSymbols: [...prev.subscribedSymbols, symbol],
      }));
    }
  };

  // Handle removing a symbol
  const removeSymbol = (symbol: string) => {
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: prev.subscribedSymbols.filter(s => s !== symbol),
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!accountConfig.username) return;

      try {
        // Load account settings including balance
        const accountRes = await fetch(`/api/account/${accountConfig.username}`);
        if (!accountRes.ok) throw new Error('Failed to fetch account settings');
        const accountData = await accountRes.json();
        console.log('Loaded account data:', accountData);
        if (accountData) setAccountConfig((prev) => ({ ...prev, ...accountData }));

        // Load tradeSetting
        const trade_setting = await fetch(`/api/tradesetting/${accountConfig.username}`);
        if (!trade_setting.ok) throw new Error('Failed to fetch tradeSetting');
        const tradesetting_data = await trade_setting.json();
        console.log('Loaded tradeSetting data:', tradesetting_data);

        setTradeSetting(tradesetting_data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [accountConfig.username, setAccountConfig, setTradeSetting]);

  useEffect(() => {
    console.log('Current tradeSetting state:', tradeSetting);
  }, [tradeSetting]);

  return {
    saveAccountSettings,
    saveTradeSetting,
    addSymbol,
    removeSymbol,
  };
};