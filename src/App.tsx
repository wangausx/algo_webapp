import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Settings as SettingsIcon, TrendingUp, User, Shield } from 'lucide-react';
import AccountSettings, { AccountConfig } from './components/AccountSettings';
import TradeSettings from './components/TradeSettings';
import Dashboard from './components/Dashboard'; 
import { useTrading } from './hooks/useTrading';
import { useWebSocket } from './hooks/useWebSocket';
import { usePositions } from './hooks/usePositions';
import { useOrders } from './hooks/useOrders';
import { useAccount } from './hooks/useAccount';
import { useAccountSettings } from './hooks/useAccountSettings';
import { 
  loadUsername, 
  saveUsername, 
  loadDemoAccountSelection, 
  saveDemoAccountSelection,
  saveAccountConfig 
} from './utils/storage';

const AlgoTradingApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoAccountSelected, setIsDemoAccountSelected] = useState(false);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);

  const [accountConfig, setAccountConfig] = useState<AccountConfig>({
    username: '',
    apiKey: '',
    secretKey: '',
    brokerageType: 'paper',
    modelType: 'intraday_reversal',
    riskLevel: 'moderate',
    balance: 0,
    demoAccount: false
  });

  // Load saved data from localStorage on startup
  useEffect(() => {
    const savedUsername = loadUsername();
    const savedDemoSelection = loadDemoAccountSelection();
    
    if (savedUsername) {
      setAccountConfig(prev => ({ ...prev, username: savedUsername }));
    }
    
    if (savedDemoSelection) {
      setIsDemoAccountSelected(savedDemoSelection);
    }
    
    // Mark loading as complete
    setIsLoadingSavedData(false);
  }, []);

  // Update demo account status when selection changes
  useEffect(() => {
    if (isDemoAccountSelected) {
      setAccountConfig(prev => ({ ...prev, demoAccount: true }));
    } else {
      setAccountConfig(prev => ({ ...prev, demoAccount: false }));
    }
    
    // Save demo account selection to localStorage
    saveDemoAccountSelection(isDemoAccountSelected);
  }, [isDemoAccountSelected]);

  // Auto-set demo account selection when username is 'wangausx' (only on initial load)
  useEffect(() => {
    // Only auto-set demo account if we haven't loaded saved data yet
    if (!isLoadingSavedData && accountConfig.username === 'wangausx' && !isDemoAccountSelected) {
      setIsDemoAccountSelected(true);
    }
  }, [accountConfig.username, isDemoAccountSelected, isLoadingSavedData]);

  // Save username to localStorage when it changes
  useEffect(() => {
    if (accountConfig.username) {
      saveUsername(accountConfig.username);
    }
  }, [accountConfig.username]);

  // Save full account config to localStorage when it changes
  useEffect(() => {
    if (accountConfig.username) {
      saveAccountConfig(accountConfig);
    }
  }, [accountConfig]);

  // Handle manual demo account selection changes
  const handleDemoAccountSelectionChange = (isSelected: boolean) => {
    setIsDemoAccountSelected(isSelected);
    
    if (isSelected) {
      // Switching to demo account - set username to wangausx and load demo data
      setAccountConfig(prev => ({
        ...prev,
        username: 'wangausx',
        demoAccount: true
      }));
    } else {
      // Switching to personal account - clear demo account data
      localStorage.removeItem('algoTrading_demoAccountSelected');
      localStorage.removeItem('algoTrading_username');
      localStorage.removeItem('algoTrading_accountConfig');
      
      // Reset account config to empty personal account
      setAccountConfig({
        username: '',
        apiKey: '',
        secretKey: '',
        brokerageType: 'paper',
        modelType: 'intraday_reversal',
        riskLevel: 'moderate',
        balance: 0,
        demoAccount: false
      });
    }
  };

  // Get username validation from AccountSettings hook
  const { usernameValidation } = useAccountSettings(accountConfig.username);
  
  // Only use validated usernames for API calls
  // Additional check to ensure username can be used for API calls (exists in backend)
  const validatedUsername = (
    usernameValidation.canUseForApi && 
    accountConfig.username && 
    accountConfig.username.length >= 6 && 
    !usernameValidation.isChecking
  ) ? accountConfig.username : '';
  
  // Debug logging for username validation
  console.log('Username validation state:', {
    username: accountConfig.username,
    usernameLength: accountConfig.username?.length,
    isValid: usernameValidation.isValid,
    isChecking: usernameValidation.isChecking,
    exists: usernameValidation.exists,
    canUseForApi: usernameValidation.canUseForApi,
    error: usernameValidation.error,
    validatedUsername
  });

  const { tradingStatus, toggleTrading } = useTrading(validatedUsername);

  const { 
    accountBalance,
    dailyPnL,
    refreshAccountData 
  } = useAccount(validatedUsername);

  // Initialize hooks that need to be available app-wide
  const { 
    positions,
    closedPositions,
    handlePositionUpdate, 
    handlePositionDeletion,
    fetchClosedPositions,
    handleCancelPosition
  } = usePositions(validatedUsername, refreshAccountData);
  
  // Lift up orders state to app level
  const { 
    orders,
    handleOrderUpdate,
    fetchOrders 
  } = useOrders(validatedUsername);

  // WebSocket connection at app level
  const handleWebSocketReconnect = useCallback(() => {
    console.log('WebSocket reconnected, refreshing all data');
    // Refresh all data when WebSocket reconnects
    refreshAccountData();
    fetchClosedPositions();
    fetchOrders();
  }, [refreshAccountData, fetchClosedPositions, fetchOrders]);

  useWebSocket(
    validatedUsername,
    handlePositionUpdate,
    handleOrderUpdate,
    handlePositionDeletion,
    undefined, // onWarning
    handleWebSocketReconnect
  );

  // Load demo account data when demo account is selected
  useEffect(() => {
    if (accountConfig.demoAccount && accountConfig.username === 'wangausx') {
      // Demo account is selected, ensure all required data is loaded
      console.log('Demo account selected, ensuring all data is loaded');
      // The individual components will handle loading their respective demo data
    }
  }, [accountConfig.demoAccount, accountConfig.username]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-64 bg-white shadow-lg flex md:block">
        <div className="p-4 flex items-center justify-between md:block">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Quant Auto-Trading</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isLoadingSavedData ? (
                <span className="text-blue-600">Loading saved data...</span>
              ) : accountConfig.username.trim() === '' ? (
                'Please set up your account or select a demo account'
              ) : (
                accountConfig.username
              )}
            </p>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block mt-0 md:mt-4`}>
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('account-settings'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'account-settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <User className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Account Settings
          </button>
          <button
            onClick={() => { setActiveTab('trade-settings'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'trade-settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Trade Settings
          </button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            tradingStatus={tradingStatus}
            toggleTrading={toggleTrading}
            username={accountConfig.username}
            positions={positions}
            closedPositions={closedPositions}
            handleCancelPosition={handleCancelPosition}
            fetchClosedPositions={fetchClosedPositions}
            accountBalance={accountBalance}
            dailyPnL={dailyPnL}
            refreshAccountData={refreshAccountData}
            orders={orders}
            fetchOrders={fetchOrders}
            tradingMode={accountConfig.brokerageType}
            demoAccount={accountConfig.demoAccount}
            isLoadingSavedData={isLoadingSavedData}
            usernameValidation={usernameValidation}
          />
        )}

        {activeTab === 'account-settings' && (
          <AccountSettings
            accountConfig={accountConfig}
            setAccountConfig={setAccountConfig}
            isDemoAccountSelected={isDemoAccountSelected}
            setIsDemoAccountSelected={handleDemoAccountSelectionChange}
          />
        )}

        {activeTab === 'trade-settings' && (
          <TradeSettings
            username={validatedUsername}
            demoAccount={accountConfig.demoAccount}
          />
        )}
      </div>
    </div>
  );
};

export default AlgoTradingApp;