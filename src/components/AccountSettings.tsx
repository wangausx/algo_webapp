import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import React from 'react';
import { useAccountSettings } from '../hooks/useAccountSettings';
import DemoAccountRestrictionPopup from './DemoAccountRestrictionPopup';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { clearUserData, clearStoredData } from '../utils/storage';

export interface AccountConfig {
  username: string;
  apiKey: string;
  secretKey: string;
  brokerageType: 'paper' | 'live';
  modelType: 'intraday_reversal' | 'trend_following';
  riskLevel: 'moderate' | 'conservative' | 'aggressive';
  balance: number;
  demoAccount: boolean;
}

interface AccountSettingsProps {
  accountConfig: AccountConfig;
  setAccountConfig: React.Dispatch<React.SetStateAction<AccountConfig>>;
  isDemoAccountSelected: boolean;
  setIsDemoAccountSelected: (isSelected: boolean) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  accountConfig,
  setAccountConfig,
  isDemoAccountSelected,
  setIsDemoAccountSelected
}) => {
  const [showRestrictionPopup, setShowRestrictionPopup] = React.useState(false);
  const demoDataLoadedRef = React.useRef(false);
  
  const {
    accountConfig: currentAccountConfig,
    setAccountConfig: setCurrentAccountConfig,
    isLoading,
    saveAccountSettings,
    loadDemoAccountData
  } = useAccountSettings(accountConfig.username);

  // Load demo account data when demo account is selected
  React.useEffect(() => {
    if (isDemoAccountSelected && !demoDataLoadedRef.current) {
      // Load demo account data when demo account is selected (only once)
      console.log('Loading demo account data...');
      demoDataLoadedRef.current = true;
      loadDemoAccountData();
    } else if (!isDemoAccountSelected) {
      // Reset demo data loaded flag when switching away from demo account
      demoDataLoadedRef.current = false;
    }
  }, [isDemoAccountSelected, loadDemoAccountData]);

  // Handle switching between account types
  const handleDemoAccountSelectionChange = (isSelected: boolean) => {
    if (isSelected) {
      // Switching to demo account
      setIsDemoAccountSelected(true);
    } else {
      // Switching to personal account
      if (window.confirm('Switch to personal account? This will clear demo account data and allow you to enter your own credentials.')) {
        // Clear all demo account data
        clearStoredData();
        setIsDemoAccountSelected(false);
        
        // Update both parent and local state
        const emptyPersonalConfig: AccountConfig = {
          username: '',
          apiKey: '',
          secretKey: '',
          brokerageType: 'paper' as const,
          modelType: 'intraday_reversal' as const,
          riskLevel: 'moderate' as const,
          balance: 0,
          demoAccount: false
        };
        
        setCurrentAccountConfig(emptyPersonalConfig);
        
        // Reset demo data loaded flag
        demoDataLoadedRef.current = false;
      }
    }
  };

  // Handle reset - clear stored data and reset form
  const handleReset = () => {
    // Don't allow reset if demo account is selected
    if (isDemoAccountSelected) {
      alert('Reset is not available for demo accounts. Demo account settings are preserved for system use.');
      return;
    }

    if (window.confirm('Are you sure you want to reset your personal account data? This will clear your username and preferences, but you can still switch back to demo accounts.')) {
      clearUserData();
      setIsDemoAccountSelected(false);
      
      // Update both parent and local state
      const emptyPersonalConfig: AccountConfig = {
        username: '',
        apiKey: '',
        secretKey: '',
        brokerageType: 'paper' as const,
        modelType: 'intraday_reversal' as const,
        riskLevel: 'moderate' as const,
        balance: 0,
        demoAccount: false
      };
      
      setCurrentAccountConfig(emptyPersonalConfig);
      setAccountConfig(emptyPersonalConfig);
      
      // Reset demo data loaded flag
      demoDataLoadedRef.current = false;
    }
  };

  // Handle form submission with demo account restriction
  const handleSubmit = (e: React.FormEvent) => {
    if (currentAccountConfig.demoAccount) {
      e.preventDefault();
      setShowRestrictionPopup(true);
      return;
    }
    saveAccountSettings(e);
  };

  // Handle input changes with demo account restriction
  const handleInputChange = (field: keyof AccountConfig, value: any) => {
    // Check both local state and prop to ensure proper demo account detection
    const isDemoAccount = currentAccountConfig.demoAccount || isDemoAccountSelected;
    
    if (isDemoAccount) {
      setShowRestrictionPopup(true);
      return;
    }
    
    // Update only the hook's state to avoid conflicts
    setCurrentAccountConfig(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            {isDemoAccountSelected ? 'Loading demo account data...' : 'Loading account settings...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="text-sm md:text-base">Account Settings</CardTitle>
          <CardDescription className="text-xs md:text-sm">Configure your account parameters</CardDescription>
          {currentAccountConfig.demoAccount && (
            <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Demo Account Active</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                This is a demo account. Changes are not allowed, and demo account settings are preserved for system use. 
                You can switch back to a personal account at any time.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          <form className="space-y-3 md:space-y-4 grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            {/* Demo Account Selection */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs md:text-sm font-medium">Account Type</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="accountType"
                    checked={!isDemoAccountSelected}
                    onChange={() => handleDemoAccountSelectionChange(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Personal Account</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="accountType"
                    checked={isDemoAccountSelected}
                    onChange={() => handleDemoAccountSelectionChange(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm" title="Click to switch back to personal account">Demo Account (wangausx)</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Username</label>
              <input
                type="text"
                value={currentAccountConfig.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
                placeholder={isDemoAccountSelected ? 'wangausx (Demo Account)' : 'Enter your username'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">API Key</label>
              <input
                type="password"
                value={currentAccountConfig.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
                placeholder={isDemoAccountSelected ? 'Demo account - not required' : 'Enter your API key'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Secret Key</label>
              <input
                type="password"
                value={currentAccountConfig.secretKey}
                onChange={(e) => handleInputChange('secretKey', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
                placeholder={isDemoAccountSelected ? 'Demo account - not required' : 'Enter your secret key'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Account Balance ($)</label>
              <input
                type="number"
                value={currentAccountConfig.balance === 0 ? '' : currentAccountConfig.balance}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
                placeholder={isDemoAccountSelected ? 'Demo account - not required' : 'Enter account balance'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Trading Mode</label>
              <select
                value={currentAccountConfig.brokerageType}
                onChange={(e) => handleInputChange('brokerageType', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
              >
                <option value="paper">Paper Trading</option>
                <option value="live">Live Trading</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Trading Model</label>
              <select
                value={currentAccountConfig.modelType}
                onChange={(e) => handleInputChange('modelType', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  currentAccountConfig.demoAccount ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={currentAccountConfig.demoAccount}
              >
                <option value="intraday_reversal">Intraday Reversal</option>
                <option value="trend_following">Trend Following</option>
              </select>
            </div>

            <button
              type="submit"
              className={`md:col-span-2 w-full px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                currentAccountConfig.demoAccount 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={currentAccountConfig.demoAccount}
            >
              {currentAccountConfig.demoAccount ? 'Changes Not Allowed (Demo Account)' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isDemoAccountSelected}
              className={`md:col-span-2 w-full px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                isDemoAccountSelected
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isDemoAccountSelected ? 'Reset not available for demo accounts' : 'Clear all stored user data'}
            >
              {isDemoAccountSelected ? 'Reset Not Available (Demo Account)' : 'Reset Personal Data'}
            </button>
          </form>
        </CardContent>
      </Card>

      <DemoAccountRestrictionPopup
        isOpen={showRestrictionPopup}
        onClose={() => setShowRestrictionPopup(false)}
      />
    </>
  );
};

export default AccountSettings;
