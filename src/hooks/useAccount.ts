import { useState, useCallback, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

export const useAccount = (username: string) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [dailyPnL, setDailyPnL] = useState(0);

  const refreshAccountData = useCallback(async () => {
    if (!username) {
      console.log('No username provided, skipping account data fetch');
      return;
    }
    
    try {
      //console.log('Fetching account data for user:', username);
      const accountRes = await fetch(buildApiUrl(`/router/account/${username}`));
      //console.log('Account response status:', accountRes.status, accountRes.ok);
      
      if (!accountRes.ok) {
        throw new Error(`Failed to fetch account data: ${accountRes.status}`);
      }
      
      const accountData = await accountRes.json();
      //console.log('Account data received from server:', accountData);
      
      setAccountBalance(Number(accountData.balance) || 0);
      setDailyPnL(Number(accountData.dailyPnL) || 0);
      console.log('Account data updated:', { balance: accountData.balance, dailyPnL: accountData.dailyPnL });
    } catch (error) {
      console.error('Error refreshing account data:', error);
      throw error;
    }
  }, [username]);

  // Fetch account data when username changes
  useEffect(() => {
    if (username) {
      refreshAccountData();
    }
  }, [username, refreshAccountData]);

  return {
    accountBalance,
    dailyPnL,
    refreshAccountData
  };
}; 