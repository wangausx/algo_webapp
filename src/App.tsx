import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Settings as SettingsIcon, TrendingUp, User, Shield, LogOut } from 'lucide-react';
import AccountSettings, { AccountConfig } from './components/AccountSettings';
import TradeSettings from './components/TradeSettings';
import Dashboard from './components/Dashboard'; 
import AuthenticationFlow from './components/AuthenticationFlow';
import { useTrading } from './hooks/useTrading';
import { useWebSocket } from './hooks/useWebSocket';
import { usePositions } from './hooks/usePositions';
import { useOrders } from './hooks/useOrders';
import { useAccount } from './hooks/useAccount';
import { useAccountSettings } from './hooks/useAccountSettings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  loadUsername, 
  saveUsername, 
  loadDemoAccountSelection, 
  saveDemoAccountSelection,
  saveAccountConfig
} from './utils/storage';
import { isDemoAccountEditable, buildApiUrl } from './config/api';

// Main authenticated app component
const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoAccountSelected, setIsDemoAccountSelected] = useState(false);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const [demoEditLocked, setDemoEditLocked] = useState(false);
  const { user, logout } = useAuth();
  const effectiveDemoEditable = isDemoAccountEditable && !demoEditLocked;

  // Fetch demo edit lock from server (source of truth; shared across all browsers)
  const fetchDemoEditLock = useCallback(() => {
    fetch(buildApiUrl('/router/demo-edit-locked'), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { demoEditLocked: false }))
      .then((data) => {
        if (data && typeof data.demoEditLocked === 'boolean') {
          setDemoEditLocked(data.demoEditLocked);
        }
      })
      .catch(() => setDemoEditLocked(false));
  }, []);

  useEffect(() => {
    if (!isDemoAccountSelected) return;
    let cancelled = false;
    fetch(buildApiUrl('/router/demo-edit-locked'), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { demoEditLocked: false }))
      .then((data) => {
        if (!cancelled && data && typeof data.demoEditLocked === 'boolean') {
          setDemoEditLocked(data.demoEditLocked);
        }
      })
      .catch(() => { if (!cancelled) setDemoEditLocked(false); });
    return () => { cancelled = true; };
  }, [isDemoAccountSelected]);

  // Refetch demo lock when tab becomes visible (e.g. after a new deploy that restarted backend)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isDemoAccountSelected) {
        fetchDemoEditLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isDemoAccountSelected, fetchDemoEditLock]);

  const [accountConfig, setAccountConfig] = useState<AccountConfig>({
    username: user?.username || '',
    apiKey: '',
    secretKey: '',
    brokerageType: 'paper',
    modelType: 'intraday_reversal',
    riskLevel: 'moderate',
    balance: 0,
    demoAccount: false
  });

  // Load saved data from localStorage on startup and when user changes
  useEffect(() => {
    const savedUsername = loadUsername();
    const savedDemoSelection = loadDemoAccountSelection();
    
    if (user?.username) {
      // Authenticated user - use their username
      setAccountConfig(prev => ({ ...prev, username: user.username }));
      setIsDemoAccountSelected(false); // Personal account
    } else if (savedUsername && savedUsername !== 'dr_wang') {
      // Returning user with saved personal account but no authentication
      // This means they need to re-authenticate
      console.log('Found saved personal account without authentication, switching to demo account');
      setIsDemoAccountSelected(true);
      setAccountConfig(prev => ({ ...prev, username: 'dr_wang', demoAccount: true }));
    } else if (savedUsername === 'dr_wang' || savedDemoSelection) {
      // Demo account user
      setIsDemoAccountSelected(true);
      setAccountConfig(prev => ({ ...prev, username: 'dr_wang', demoAccount: true }));
    } else {
      // First-time user - default to demo account
      setIsDemoAccountSelected(true);
      setAccountConfig(prev => ({ ...prev, username: 'dr_wang', demoAccount: true }));
    }
    
    // Mark loading as complete
    setIsLoadingSavedData(false);
  }, [user]);

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

  // Auto-set demo account selection when username is 'dr_wang' (only on initial load)
  useEffect(() => {
    // Only auto-set demo account if we haven't loaded saved data yet
    if (!isLoadingSavedData && accountConfig.username === 'dr_wang' && !isDemoAccountSelected) {
      setIsDemoAccountSelected(true);
    }
  }, [accountConfig.username, isDemoAccountSelected, isLoadingSavedData]);

  // Handle authenticated user changes
  useEffect(() => {
    if (user?.username && !isDemoAccountSelected) {
      // Authenticated user - make sure their username is set
      setAccountConfig(prev => ({ ...prev, username: user.username }));
    }
  }, [user, isDemoAccountSelected]);

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
      // Switching to demo account - set username to dr_wang and load demo data
      setAccountConfig(prev => ({
        ...prev,
        username: 'dr_wang',
        demoAccount: true
      }));
    } else {
      // Switching to personal account
      if (user?.username) {
        // User is already authenticated - use their data
        setAccountConfig(prev => ({
          ...prev,
          username: user.username,
          demoAccount: false
        }));
      } else {
        // User not authenticated - this will trigger login/signup in AccountSettings
        setAccountConfig(prev => ({
          ...prev,
          username: '',
          apiKey: '',
          secretKey: '',
          brokerageType: 'paper',
          modelType: 'intraday_reversal',
          riskLevel: 'moderate',
          balance: 0,
          demoAccount: false
        }));
      }
    }
  };

  // Get username validation from AccountSettings hook
  const { usernameValidation } = useAccountSettings(accountConfig.username, user?.isAuthenticated);
  
  // Only use validated usernames for API calls
  // Additional check to ensure username can be used for API calls (exists in backend)
  const validatedUsername = (
    usernameValidation.canUseForApi && 
    accountConfig.username && 
    accountConfig.username.length >= 6 && 
    !usernameValidation.isChecking
  ) ? accountConfig.username : '';
  
  // Debug logging for username validation
  // console.log('Username validation state:', {
  //   username: accountConfig.username,
  //   usernameLength: accountConfig.username?.length,
  //   isValid: usernameValidation.isValid,
  //   isChecking: usernameValidation.isChecking,
  //   exists: usernameValidation.exists,
  //   canUseForApi: usernameValidation.canUseForApi,
  //   error: usernameValidation.error,
  //   validatedUsername
  // });

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleWebSocketReconnect = useCallback(() => {
    console.log('WebSocket reconnected, scheduling data refresh');
    
    // Debounce the refresh to prevent multiple rapid calls
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Executing WebSocket reconnection data refresh');
      refreshAccountData();
      fetchClosedPositions();
      fetchOrders();
    }, 2000); // 2 second debounce
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
    if (accountConfig.demoAccount && accountConfig.username === 'dr_wang') {
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
                <span>Welcome, {accountConfig.username}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={logout}
              className="md:hidden p-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
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
          
          {/* Desktop Logout Button */}
          <div className="hidden md:block mt-auto p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            effectiveDemoEditable={effectiveDemoEditable}
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
            effectiveDemoEditable={effectiveDemoEditable}
            onDemoAccountSaved={() => setDemoEditLocked(true)}
          />
        )}

        {activeTab === 'trade-settings' && (
          <TradeSettings
            username={validatedUsername}
            demoAccount={accountConfig.demoAccount}
            effectiveDemoEditable={effectiveDemoEditable}
          />
        )}
      </div>
    </div>
  );
};

// Main App component that handles authentication flow
const AlgoTradingApp: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Content component that always shows the main app
const AppContent: React.FC = () => {
  // Always show the main app - authentication is handled within Account Settings
  return <AuthenticatedApp />;
};

export default AlgoTradingApp;