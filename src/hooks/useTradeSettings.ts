import { useEffect, useState, useCallback } from 'react';
import { TradeSetting } from '../components/TradeSettings';
import { buildApiUrl } from '../config/api';

interface SymbolConfig {
  symbol: string;
  isOption: 'yes' | 'no';
  optionDetails?: {
    strike: number;
    expiration: string;
    type: 'call' | 'put';
  };
}

export const useTradeSettings = (username: string) => {
  const [tradeSetting, setTradeSetting] = useState<TradeSetting>({
    user_id: username,
    subscribedSymbols: [],
    riskSettings: {
      maxPositionSize: 10000,
      riskPercentage: 15,
      maxDailyLoss: 500,
    }
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  // Save trade settings
  const saveTradeSetting = async (settings: TradeSetting) => {
    setSaveStatus('saving');
    if (!username) throw new Error('Username is required');
    if (!Array.isArray(settings.subscribedSymbols) || typeof settings.riskSettings !== 'object') {
      throw new Error('Invalid trade setting data');
    }
    
    try {
      const response = await fetch(buildApiUrl('/api/tradesetting'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save trade settings: ${response.status}`);
      }

      setSaveStatus('success');
      alert('Trade settings saved successfully');
    } catch (error) {
      console.error('Error saving trade settings:', error);
      setSaveStatus('error');
      throw error;
    }
  };

  // Add a symbol with its configuration
  const addSymbol = useCallback((symbolConfig: SymbolConfig) => {
    if (tradeSetting.subscribedSymbols.some(s => s.symbol === symbolConfig.symbol)) {
      console.warn('Symbol already exists:', symbolConfig.symbol);
      return;
    }
    
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: [...prev.subscribedSymbols, symbolConfig]
    }));
  }, [tradeSetting.subscribedSymbols]);

  // Remove a symbol by its name
  const removeSymbol = useCallback((symbolToRemove: string) => {
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: prev.subscribedSymbols.filter(s => s.symbol !== symbolToRemove)
    }));
  }, []);

  // Update a symbol's configuration
  const updateSymbolConfig = useCallback((symbol: string, updatedConfig: Partial<SymbolConfig>) => {
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: prev.subscribedSymbols.map(s => {
        if (s.symbol === symbol) {
          if (updatedConfig.optionDetails && s.optionDetails) {
            return {
              ...s,
              ...updatedConfig,
              optionDetails: {
                ...s.optionDetails,
                ...updatedConfig.optionDetails
              }
            };
          }
          return { ...s, ...updatedConfig };
        }
        return s;
      })
    }));
  }, []);

  // Load demo trade settings data - memoized with useCallback
  const loadDemoTradeSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load demo trade settings
      const response = await fetch(buildApiUrl('/api/tradesetting/wangausx'));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded demo trade settings data:', data);
        setTradeSetting(data);
      } else {
        console.warn('Failed to fetch demo trade settings, using defaults');
        // Set default demo trade settings if API fails
        setTradeSetting({
          user_id: 'wangausx',
          subscribedSymbols: [
            { symbol: 'AAPL', isOption: 'no' },
            { symbol: 'GOOGL', isOption: 'no' },
            { symbol: 'MSFT', isOption: 'no' }
          ],
          riskSettings: {
            maxPositionSize: 10000,
            riskPercentage: 2,
            maxDailyLoss: 2000,
          }
        });
      }
    } catch (error) {
      console.error('Error loading demo trade settings:', error);
      // Set default demo trade settings if API fails
      setTradeSetting({
        user_id: 'wangausx',
        subscribedSymbols: [
          { symbol: 'AAPL', isOption: 'no' },
          { symbol: 'GOOGL', isOption: 'no' },
          { symbol: 'MSFT', isOption: 'no' }
        ],
        riskSettings: {
          maxPositionSize: 10000,
          riskPercentage: 2,
          maxDailyLoss: 2000,
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  // Load trade settings data - memoized with useCallback
  const loadTradeSettings = useCallback(async () => {
    if (!username) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/tradesetting/${username}`));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded trade settings data:', data);
        setTradeSetting(data);
      } else {
        console.warn('Failed to fetch trade settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading trade settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Update user_id when username changes
  useEffect(() => {
    setTradeSetting(prev => ({ ...prev, user_id: username }));
  }, [username]);

  // Load data when username changes
  useEffect(() => {
    if (username) {
      loadTradeSettings();
    }
  }, [username, loadTradeSettings]);

  return {
    tradeSetting,
    setTradeSetting,
    saveStatus,
    isLoading,
    saveTradeSetting,
    addSymbol,
    removeSymbol,
    updateSymbolConfig,
    loadTradeSettings,
    loadDemoTradeSettings
  };
};
