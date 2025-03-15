import { useEffect } from 'react';
import { AccountConfig, PortfolioEntry } from '../components/Settings';

interface UseSettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  portfolio: PortfolioEntry[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioEntry[]>>;
  ticker: string;
  setTicker: React.Dispatch<React.SetStateAction<string>>;
  tickerHistory: string[];
  setTickerHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useSettings = ({
  accountConfig,
  setAccountConfig,
  portfolio,
  setPortfolio,
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

  const savePortfolio = async () => {
    try {
      const updatedPortfolio = portfolio.map(entry => ({
        ticker: entry.ticker,
        share_amount: entry.share_amount,
      }));
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: accountConfig.username,
          portfolio: updatedPortfolio,
        }),
      });
      if (!response.ok) throw new Error('Failed to save portfolio');
      console.log('Saving portfolio response: ', await response.json());
    } catch (error) {
      console.error('Error saving portfolio:', error);
    }
  };

  const addTicker = () => {
    if (ticker && !portfolio.some(p => p.ticker === ticker)) {
      setPortfolio([...portfolio, { ticker, share_amount: 0 }]);
      if (!tickerHistory.includes(ticker)) {
        setTickerHistory([...tickerHistory, ticker]);
      }
      setTicker('');
    }
  };

  const removeTicker = (tickerToRemove: string) => {
    setPortfolio(portfolio.filter(entry => entry.ticker !== tickerToRemove));
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

        // Load portfolio
        const portfolioRes = await fetch(`/api/portfolio/${accountConfig.username}`);
        if (!portfolioRes.ok) throw new Error('Failed to fetch portfolio');
        const portfolioData = await portfolioRes.json();
        console.log('Loaded portfolio data:', portfolioData);

        const portfolioArray = (Array.isArray(portfolioData) ? portfolioData : portfolioData.portfolio || []).map(
          (entry: any) => ({
            ticker: entry.ticker,
            share_amount: entry.share_amount,
          })
        );
        console.log('Mapped portfolio array:', portfolioArray);
        setPortfolio(portfolioArray);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [accountConfig.username, setAccountConfig, setPortfolio]);

  useEffect(() => {
    console.log('Current portfolio state:', portfolio);
  }, [portfolio]);

  return {
    saveAccountSettings,
    savePortfolio,
    addTicker,
    removeTicker
  };
};