import { useEffect } from 'react';
import { AccountConfig, TradeSetting } from '../components/Settings';
import { useState } from 'react';
import { buildApiUrl } from '../config/api';

interface UseSettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  tradeSetting: TradeSetting;
  setTradeSetting: React.Dispatch<React.SetStateAction<TradeSetting>>;
}

interface SymbolConfig {
  symbol: string;
  isOption: 'yes' | 'no';
  optionDetails?: {
    strike: number;
    expiration: string;
    type: 'call' | 'put';
  };
}

export const useSettings = ({
  accountConfig,
  setAccountConfig,
  tradeSetting,
  setTradeSetting
}: UseSettingsProps) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Save account settings
  const saveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payload being sent:', JSON.stringify(accountConfig));
    try {
      const response = await fetch(buildApiUrl('/router/account'), {
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


  // Save trade settings
  const saveTradeSetting = async (settings: TradeSetting) => {
    setSaveStatus('saving');
    // Here you would typically make an API call to save the settings
    console.log('Saving trade settings:', settings);
    if (!tradeSetting?.user_id) throw new Error('Username is required');
    if (!Array.isArray(tradeSetting.subscribedSymbols) || typeof tradeSetting.riskSettings !== 'object') {
      throw new Error('Invalid trade setting data');
    }
    try {
      const response = await fetch('/api/tradesetting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeSetting), // send with `tradeSetting` key
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
  const addSymbol = (symbolConfig: SymbolConfig) => {
    // Check if symbol already exists
    if (tradeSetting.subscribedSymbols.some(s => s.symbol === symbolConfig.symbol)) {
      console.warn('Symbol already exists:', symbolConfig.symbol);
      return;
    }
    
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: [...prev.subscribedSymbols, symbolConfig]
    }));
  };

  // Remove a symbol by its name
  const removeSymbol = (symbolToRemove: string) => {
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: prev.subscribedSymbols.filter(s => s.symbol !== symbolToRemove)
    }));
  };

  // Update a symbol's configuration
  const updateSymbolConfig = (symbol: string, updatedConfig: Partial<SymbolConfig>) => {
    setTradeSetting(prev => ({
      ...prev,
      subscribedSymbols: prev.subscribedSymbols.map(s => {
        if (s.symbol === symbol) {
          // If updating option details, merge with existing option details if they exist
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
          // Otherwise just merge the top-level properties
          return { ...s, ...updatedConfig };
        }
        return s;
      })
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!accountConfig.username) return;

      try {
        // Load account settings including balance
        const accountRes = await fetch(buildApiUrl(`/router/account/${accountConfig.username}`));
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
    saveStatus,
    saveAccountSettings,
    saveTradeSetting,
    addSymbol,
    removeSymbol,
    updateSymbolConfig
  };
};