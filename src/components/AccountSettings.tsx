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
import { useAuth } from '../contexts/AuthContext';
import InlineAuthentication from './InlineAuthentication';

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
  effectiveDemoEditable: boolean;
  onDemoAccountSaved?: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  accountConfig,
  setAccountConfig,
  isDemoAccountSelected,
  setIsDemoAccountSelected,
  effectiveDemoEditable,
  onDemoAccountSaved
}) => {
  /*
   * Account Logic Flow:
   * 1. Username input: When user types username >= 6 characters, query existing account data
   * 2. Account creation: Only happens when "Save Settings" button is pressed
   * 3. Demo account: Loads predefined demo data, no creation/editing allowed
   * 4. Personal account: Can query existing data, create new accounts, or update existing ones
   */
  const [showRestrictionPopup, setShowRestrictionPopup] = React.useState(false);
  const [showAuthForm, setShowAuthForm] = React.useState(false);
  const [authFormInstance, setAuthFormInstance] = React.useState(0);
  const demoDataLoadedRef = React.useRef(false);
  const personalDataLoadedRef = React.useRef(false);
  const { user, logout } = useAuth();
  
  const {
    accountConfig: currentAccountConfig,
    setAccountConfig: setCurrentAccountConfig,
    isLoading,
    saveAccountSettings,
    loadDemoAccountData,
    loadAccountSettings,
    usernameValidation
  } = useAccountSettings(accountConfig.username, user?.isAuthenticated);

  const isDemoRestricted = (currentAccountConfig.demoAccount || isDemoAccountSelected) && !effectiveDemoEditable;

  // Load demo account data when demo account is selected
  React.useEffect(() => {
    if (isDemoAccountSelected && !demoDataLoadedRef.current) {
      // Load demo account data when demo account is selected (only once)
      console.log('Loading demo account data...');
      demoDataLoadedRef.current = true;
      personalDataLoadedRef.current = false; // Reset personal data loaded flag
      loadDemoAccountData();
    } else if (!isDemoAccountSelected && !personalDataLoadedRef.current) {
      // Load personal account data when personal account is selected (only once)
      console.log('Loading personal account data...');
      personalDataLoadedRef.current = true;
      demoDataLoadedRef.current = false; // Reset demo data loaded flag
      // Only query existing account settings if username is at least 6 characters long
      if (currentAccountConfig.username && currentAccountConfig.username.length >= 6) {
        loadAccountSettings();
      }
    }
  }, [isDemoAccountSelected, loadDemoAccountData, loadAccountSettings, currentAccountConfig.username]);

  // Synchronize parent state with hook state when hook state changes
  React.useEffect(() => {
    if (currentAccountConfig.username && !isDemoAccountSelected) {
      setAccountConfig(currentAccountConfig);
    }
  }, [currentAccountConfig, setAccountConfig, isDemoAccountSelected]);

  // Load account data when username changes (for personal accounts)
  React.useEffect(() => {
    // Only query existing account data if username is at least 6 characters long and not empty
    if (currentAccountConfig.username && 
        currentAccountConfig.username.length >= 6 && 
        !isDemoAccountSelected && 
        !personalDataLoadedRef.current) {
      
      // Add a small delay to prevent API calls while user is still typing
      const timer = setTimeout(() => {
        console.log('Username changed, querying existing account data for:', currentAccountConfig.username);
        personalDataLoadedRef.current = true;
        // This will query existing account data, not create a new account
        loadAccountSettings();
      }, 500); // 500ms delay
      
      return () => clearTimeout(timer);
    }
  }, [currentAccountConfig.username, isDemoAccountSelected, loadAccountSettings]);

  // Handle switching between account types
  const handleDemoAccountSelectionChange = (isSelected: boolean) => {
    if (isSelected) {
      // Switching to demo account
      setIsDemoAccountSelected(true);
      setShowAuthForm(false); // Hide auth form
    } else {
      // Switching to personal account
      if (user?.username) {
        // User is already authenticated
        setIsDemoAccountSelected(false);
        setShowAuthForm(false);
        
        // Update account config with authenticated user data
        const personalConfig: AccountConfig = {
          username: user.username,
          apiKey: '',
          secretKey: '',
          brokerageType: 'paper' as const,
          modelType: 'intraday_reversal' as const,
          riskLevel: 'moderate' as const,
          balance: 0,
          demoAccount: false
        };
        
        setCurrentAccountConfig(personalConfig);
        setAccountConfig(personalConfig);
        
        // Reset demo data loaded flag
        demoDataLoadedRef.current = false;
        personalDataLoadedRef.current = false;
      } else {
        // User not authenticated - show authentication form
        setShowAuthForm(true);
        setAuthFormInstance(prev => prev + 1); // force fresh mount with empty fields
        setIsDemoAccountSelected(false);
        
        // Update both parent and local state with empty config
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
        personalDataLoadedRef.current = false;
      }
    }
  };

  // Handle reset - clear stored data and reset form
  const handleReset = () => {
    if (isDemoRestricted) {
      alert('Reset is not available for demo accounts. Demo account settings are preserved for system use.');
      return;
    }

    if (window.confirm('Are you sure you want to reset your personal account data? This will log you out and switch to demo account.')) {
      // Clear local storage data
      clearUserData();
      
      // Log out the user to clear authentication state
      if (user?.username) {
        console.log('Logging out user due to reset');
        logout();
      }
      
      // Switch to demo account
      setIsDemoAccountSelected(true);
      
      // Set demo account config
      const demoConfig: AccountConfig = {
        username: 'dr_wang',
        apiKey: '',
        secretKey: '',
        brokerageType: 'paper' as const,
        modelType: 'intraday_reversal' as const,
        riskLevel: 'moderate' as const,
        balance: 0,
        demoAccount: true
      };
      
      setCurrentAccountConfig(demoConfig);
      setAccountConfig(demoConfig);
      
      // Reset flags
      demoDataLoadedRef.current = false;
      personalDataLoadedRef.current = false;
      setShowAuthForm(false);
    }
  };

  // Handle form submission with demo account restriction
  const handleSubmit = async (e: React.FormEvent) => {
    if (isDemoRestricted) {
      e.preventDefault();
      setShowRestrictionPopup(true);
      return;
    }
    
    // Validate username using the new validation system
    if (!usernameValidation.isValid) {
      if (usernameValidation.error) {
        alert(`Username validation failed: ${usernameValidation.error}`);
      } else {
        alert('Please enter a valid username before saving');
      }
      return;
    }
    
    try {
      // This will create a new account if it doesn't exist, or update existing account
      const success = await saveAccountSettings(e);
      if (success) {
        if (currentAccountConfig.demoAccount && onDemoAccountSaved) {
          onDemoAccountSaved();
        }
        // After successful save, reload the data from backend to confirm persistence
        if (currentAccountConfig.username && !isDemoAccountSelected) {
          console.log('Reloading account data after save to confirm persistence...');
          await loadAccountSettings();
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  // Handle input changes with demo account restriction
  const handleInputChange = (field: keyof AccountConfig, value: any) => {
    if (isDemoRestricted) {
      setShowRestrictionPopup(true);
      return;
    }
    
    // Update both hook state and parent state to keep them synchronized
    const updatedConfig = { ...currentAccountConfig, [field]: value };
    setCurrentAccountConfig(updatedConfig);
    setAccountConfig(updatedConfig);
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthForm(false);
    // The user authentication effect will handle loading account data
    // No need to manually trigger here as the effect will run when user state updates
  };

  // Effect to handle when user becomes authenticated
  React.useEffect(() => {
    if (user?.username && !isDemoAccountSelected) {
      // User is authenticated and using personal account
      setShowAuthForm(false);
      
      // Only update if the username doesn't match (to avoid overwriting API credentials)
      if (currentAccountConfig.username !== user.username) {
        console.log('Setting authenticated user username:', user.username);
        
        // Update account config with authenticated user data, preserving existing data
        const personalConfig: AccountConfig = {
          ...currentAccountConfig, // Preserve existing API credentials and settings
          username: user.username,
          demoAccount: false
        };
        
        setCurrentAccountConfig(personalConfig);
        setAccountConfig(personalConfig);
        
        // Reset flags when user changes
        demoDataLoadedRef.current = false;
        personalDataLoadedRef.current = false;
        
        // Automatically load existing account data for the authenticated user
        console.log('User authenticated, loading existing account data for:', user.username);
        loadAccountSettings();
      }
    }
  }, [user, isDemoAccountSelected, setAccountConfig, currentAccountConfig, loadAccountSettings]);

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
                {effectiveDemoEditable
                  ? 'This is a demo account. Editing is enabled until you save; then it will be locked again. You can switch to a personal account at any time.'
                  : 'This is a demo account. Changes are not allowed, and demo account settings are preserved for system use. You can switch back to a personal account at any time.'}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          {showAuthForm ? (
            <div className="space-y-4">
              <InlineAuthentication key={authFormInstance} instanceKey={authFormInstance} onAuthSuccess={handleAuthSuccess} />
            </div>
          ) : (
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
                  <span className="text-sm">Personal Account {user?.username ? `(${user.username})` : '(Sign In Required)'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="accountType"
                    checked={isDemoAccountSelected}
                    onChange={() => handleDemoAccountSelectionChange(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm" title="Click to switch back to personal account">Demo Account (dr_wang)</span>
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
                  isDemoRestricted || !isDemoAccountSelected ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  !isDemoAccountSelected && currentAccountConfig.username && usernameValidation.isValid
                    ? usernameValidation.exists 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-blue-500 bg-blue-50'
                    : !isDemoAccountSelected && currentAccountConfig.username && !usernameValidation.isValid && !usernameValidation.isChecking
                      ? 'border-red-500 bg-red-50'
                      : ''
                }`}
                disabled={isDemoRestricted || !isDemoAccountSelected}
                placeholder={isDemoAccountSelected ? 'dr_wang (Demo Account)' : user?.username || 'Authenticated User'}
              />
              
              {/* Username validation feedback */}
              {!isDemoAccountSelected && currentAccountConfig.username && (
                <div className="text-xs">
                  <p className="text-blue-600">✓ authenticated user</p>
                  {usernameValidation.isChecking && (
                    <p className="text-blue-600">Checking account data...</p>
                  )}
                  {!usernameValidation.isChecking && usernameValidation.isValid && !usernameValidation.canUseForApi && (
                    <p className="text-blue-600">✓ Ready to configure account (press Save to create)</p>
                  )}
                  {!usernameValidation.isChecking && !usernameValidation.isValid && usernameValidation.error && (
                    <p className="text-red-600">✗ {usernameValidation.error}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">API Key</label>
              <input
                type="password"
                value={currentAccountConfig.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  isDemoRestricted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isDemoRestricted}
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
                  isDemoRestricted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isDemoRestricted}
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
                  isDemoRestricted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isDemoRestricted}
                placeholder={isDemoAccountSelected ? 'Demo account - not required' : 'Will be retrieved from Alpaca platform'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium">Trading Mode</label>
              <select
                value={currentAccountConfig.brokerageType}
                onChange={(e) => handleInputChange('brokerageType', e.target.value)}
                className={`w-full p-2 text-sm md:text-base border rounded-lg ${
                  isDemoRestricted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isDemoRestricted}
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
                  isDemoRestricted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isDemoRestricted}
              >
                <option value="intraday_reversal">Intraday Reversal</option>
                <option value="trend_following">Trend Following</option>
              </select>
            </div>

            <button
              type="submit"
              className={`md:col-span-2 w-full px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                isDemoRestricted 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isDemoRestricted || isLoading}
            >
              {isDemoRestricted 
                ? 'Changes Not Allowed (Demo Account)' 
                : isLoading 
                  ? 'Loading...' 
                  : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isDemoRestricted}
              className={`md:col-span-2 w-full px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                isDemoRestricted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isDemoRestricted ? 'Reset not available for demo accounts' : 'Clear all stored user data'}
            >
              {isDemoRestricted ? 'Reset Not Available (Demo Account)' : 'Reset Personal Data'}
            </button>
          </form>
          )}
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
