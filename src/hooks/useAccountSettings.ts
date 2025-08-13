import { useEffect, useState, useCallback } from 'react';
import { AccountConfig } from '../components/AccountSettings';
import { buildApiUrl } from '../config/api';
import { loadUsername } from '../utils/storage';

export const useAccountSettings = (username: string) => {
  const [accountConfig, setAccountConfig] = useState<AccountConfig>(() => {
    // Initialize with saved username from localStorage if available
    const savedUsername = loadUsername();
    const initialUsername = username || savedUsername;
    
    return {
      username: initialUsername,
      apiKey: '',
      secretKey: '',
      brokerageType: 'paper',
      modelType: 'intraday_reversal',
      riskLevel: 'moderate',
      balance: 0,
      demoAccount: initialUsername === 'wangausx'
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);

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

  // Load demo account data - memoized with useCallback
  const loadDemoAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load demo account settings
      const response = await fetch(buildApiUrl('/router/account/wangausx'));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded demo account data:', data);
        if (data) {
          setAccountConfig(prev => ({ 
            ...prev, 
            ...data,
            username: 'wangausx',
            demoAccount: true
          }));
        }
      } else {
        console.warn('Failed to fetch demo account settings, using defaults');
        // Set default demo account values if API fails
        setAccountConfig(prev => ({
          ...prev,
          username: 'wangausx',
          apiKey: 'demo_api_key',
          secretKey: 'demo_secret_key',
          brokerageType: 'paper',
          modelType: 'intraday_reversal',
          riskLevel: 'moderate',
          balance: 100000,
          demoAccount: true
        }));
      }
    } catch (error) {
      console.error('Error loading demo account data:', error);
      // Set default demo account values if API fails
      setAccountConfig(prev => ({
        ...prev,
        username: 'wangausx',
        apiKey: 'demo_api_key',
        secretKey: 'demo_secret_key',
        brokerageType: 'paper',
        modelType: 'intraday_reversal',
        riskLevel: 'moderate',
        balance: 100000,
        demoAccount: true
      }));
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  // Load account settings data - memoized with useCallback
  const loadAccountSettings = useCallback(async () => {
    if (!username) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/router/account/${username}`));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded account data:', data);
        if (data) {
          setAccountConfig(prev => ({ ...prev, ...data }));
        }
      } else {
        console.warn('Failed to fetch account settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading account settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  return {
    accountConfig,
    setAccountConfig,
    isLoading,
    saveAccountSettings,
    loadAccountSettings,
    loadDemoAccountData
  };
};
