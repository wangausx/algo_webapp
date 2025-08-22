import { useState, useCallback, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

export const useAccount = (username: string) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [dailyPnL, setDailyPnL] = useState(0);

  const refreshAccountData = useCallback(async () => {
    if (!username || username.length < 6) {
      console.log('No username provided or username too short (need >= 6 chars), skipping account data fetch');
      return;
    }
    
    try {
      //console.log('Fetching account data for user:', username);
      const accountRes = await fetch(buildApiUrl(`/router/account/${username}`));
      //console.log('Account response status:', accountRes.status, accountRes.ok);
      
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        //console.log('Account data received from server:', accountData);
        
        setAccountBalance(Number(accountData.balance) || 0);
        setDailyPnL(Number(accountData.dailyPnL) || 0);
        console.log('Account data updated:', { balance: accountData.balance, dailyPnL: accountData.dailyPnL });
      } else if (accountRes.status === 404) {
        // User doesn't exist yet - this is normal for new users
        console.log('User not found, using default values:', username);
        setAccountBalance(10000); // Default balance
        setDailyPnL(0); // Default PnL
      } else {
        // Other error statuses - log but don't crash
        console.warn('Failed to fetch account data, using defaults:', accountRes.status);
        setAccountBalance(10000); // Default balance
        setDailyPnL(0); // Default PnL
      }
    } catch (error) {
      console.error('Error refreshing account data:', error);
      // Don't throw error, just use default values
      setAccountBalance(10000); // Default balance
      setDailyPnL(0); // Default PnL
    }
  }, [username]);

  // Load account data when username changes
  useEffect(() => {
    if (username && username.length >= 6) {
      refreshAccountData();
    }
  }, [username, refreshAccountData]);

  // Periodic refresh of account data
  useEffect(() => {
    if (username && username.length >= 6) {
      // Refresh account data every 3 minutes as a fallback
      const interval = setInterval(refreshAccountData, 180000);
      return () => clearInterval(interval);
    }
  }, [username, refreshAccountData]);

  // Handle page visibility changes to refresh data when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && username && username.length >= 6) {
        console.log('Page became visible, refreshing account data');
        refreshAccountData();
      }
    };

    const handleFocus = () => {
      if (username && username.length >= 6) {
        console.log('Window focused, refreshing account data');
        refreshAccountData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [username, refreshAccountData]);

  return {
    accountBalance,
    dailyPnL,
    refreshAccountData
  };
}; 