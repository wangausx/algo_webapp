import { useEffect } from 'react';
import { AccountConfig, PositionEntry } from '../components/Settings';

interface UseSettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  position: PositionEntry[];
  setPosition: React.Dispatch<React.SetStateAction<PositionEntry[]>>;
  ticker: string;
  setTicker: React.Dispatch<React.SetStateAction<string>>;
  tickerHistory: string[];
  setTickerHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

interface SavePositionData {
  username: string;
  position: PositionEntry[];
}

export const useSettings = ({
  accountConfig,
  setAccountConfig,
  position,
  setPosition,
  ticker,
  setTicker,
  tickerHistory,
  setTickerHistory
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

  const savePosition = async ({ username, position }: SavePositionData) => {
    try {
      const updatedPosition = position.map(entry => ({
        ticker: entry.ticker,
        share_amount: entry.share_amount,
      }));
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          position: updatedPosition,
        }),
      });
      if (!response.ok) throw new Error('Failed to save position');
      console.log('Saving position response: ', await response.json());
    } catch (error) {
      console.error('Error saving position:', error);
    }
  };
  

  const addTicker = () => {
    if (ticker && !position.some(p => p.ticker === ticker)) {
      setPosition([...position, { ticker, share_amount: 0 }]);
      if (!tickerHistory.includes(ticker)) {
        setTickerHistory([...tickerHistory, ticker]);
      }
      setTicker('');
    }
  };

  const removeTicker = (tickerToRemove: string) => {
    setPosition(position.filter(entry => entry.ticker !== tickerToRemove));
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
        if (accountData) setAccountConfig(prev => ({ ...prev, ...accountData }));

        // Load position
        const positionRes = await fetch(`/api/positions/${accountConfig.username}`);
        if (!positionRes.ok) throw new Error('Failed to fetch position');
        const positionData = await positionRes.json();
        console.log('Loaded position data:', positionData);

        const positionArray = (Array.isArray(positionData) ? positionData : positionData.position || []).map(
          (entry: any) => ({
            ticker: entry.ticker,
            share_amount: entry.share_amount,
          })
        );
        console.log('Mapped position array:', positionArray);
        setPosition(positionArray);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [accountConfig.username, setAccountConfig, setPosition]);

  useEffect(() => {
    console.log('Current position state:', position);
  }, [position]);

  return {
    saveAccountSettings,
    savePosition,
    addTicker,
    removeTicker
  };
};