import { useState, useCallback } from 'react';

export const useAccount = (username: string) => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [dailyPnL, setDailyPnL] = useState(0);

  const refreshAccountData = useCallback(async () => {
    if (!username) return;
    
    try {
      const accountRes = await fetch(`http://localhost:3001/router/account/${username}`);
      if (!accountRes.ok) {
        throw new Error(`Failed to fetch account data: ${accountRes.status}`);
      }
      
      const accountData = await accountRes.json();
      setAccountBalance(Number(accountData.balance) || 0);
      setDailyPnL(Number(accountData.dailyPnL) || 0);
      console.log('Account data refreshed:', accountData);
    } catch (error) {
      console.error('Error refreshing account data:', error);
      throw error;
    }
  }, [username]);

  return {
    accountBalance,
    dailyPnL,
    refreshAccountData
  };
}; 