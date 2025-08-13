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
  
  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    exists: boolean;
    canUseForApi: boolean; // New field: can this username be used for API calls?
    error: string | null;
  }>({
    isValid: false,
    isChecking: false,
    exists: false,
    canUseForApi: false,
    error: null
  });
  
  // Don't make API calls for usernames that are too short
  const effectiveUsername = username && username.length >= 6 ? username : '';
  
  const [isLoading, setIsLoading] = useState(false);

  // Validate username format and check if it exists in backend
  const validateUsername = useCallback(async (usernameToValidate: string) => {
    console.log('validateUsername called with:', usernameToValidate);
    
    if (!usernameToValidate || usernameToValidate.length < 6) {
      console.log('Username validation failed - too short:', usernameToValidate);
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        exists: false,
        canUseForApi: false,
        error: 'Username must be at least 6 characters long'
      });
      return false;
    }

    // Basic format validation
    if (!/^[a-zA-Z0-9_]+$/.test(usernameToValidate)) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        exists: false,
        canUseForApi: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
      return false;
    }

    setUsernameValidation(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      console.log('Checking username existence in backend for:', usernameToValidate);
      // Check if username exists in backend
      const response = await fetch(buildApiUrl(`/router/account/${usernameToValidate}`));
      console.log('Backend validation response:', response.status, response.ok);
      
      if (response.ok) {
        // Username exists
        console.log('Username exists in backend:', usernameToValidate);
        setUsernameValidation({
          isValid: true,
          isChecking: false,
          exists: true,
          canUseForApi: true, // Can use for API calls since it exists
          error: null
        });
        return true;
      } else if (response.status === 404) {
        // Username doesn't exist yet - this is valid for new accounts but not for existing data
        console.log('Username available for new account:', usernameToValidate);
        setUsernameValidation({
          isValid: true,
          isChecking: false,
          exists: false,
          canUseForApi: false, // Cannot use for API calls until account is created
          error: null
        });
        return true;
      } else {
        // Other error statuses
        console.log('Backend validation error:', response.status);
        setUsernameValidation({
          isValid: false,
          isChecking: false,
          exists: false,
          canUseForApi: false,
          error: `Error (${response.status}) - missing or invalid API credentials`
        });
        return false;
      }
    } catch (error) {
      console.error('Error validating username:', error);
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        exists: false,
        canUseForApi: false,
        error: 'Network error while validating username'
      });
      return false;
    }
  }, []);

  // Validate username when it changes - with debouncing to prevent premature validation
  useEffect(() => {
    console.log('Username validation effect triggered:', {
      effectiveUsername,
      usernameLength: effectiveUsername?.length,
      currentValidation: usernameValidation
    });
    
    if (effectiveUsername) {
      // Add a small delay to prevent validation while user is still typing
      const timer = setTimeout(() => {
        console.log('Starting username validation for:', effectiveUsername);
        validateUsername(effectiveUsername);
      }, 500); // 500ms delay
      
      return () => clearTimeout(timer);
    } else {
      console.log('No effective username, resetting validation state');
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        exists: false,
        canUseForApi: false,
        error: null
      });
    }
  }, [effectiveUsername, validateUsername]);

  // Save account settings - creates new account if it doesn't exist, or updates existing account
  const saveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username before saving
    if (!usernameValidation.isValid) {
      alert('Please enter a valid username before saving');
      return false;
    }
    
    // Filter out frontend-only fields before sending to backend
    const { demoAccount, ...backendPayload } = accountConfig;
    
    console.log('Payload being sent to backend:', JSON.stringify(backendPayload));
    console.log('Frontend-only demoAccount flag:', demoAccount);
    
    try {
      // POST to /router/account will create a new account if username doesn't exist,
      // or update the existing account if username already exists
      const response = await fetch(buildApiUrl('/router/account'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save account settings: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Account settings saved successfully:', result);
      
      // Update validation state to reflect that account now exists
      if (response.ok) {
        setUsernameValidation(prev => ({ 
          ...prev, 
          exists: true,
          canUseForApi: true // Now can be used for API calls
        }));
      }
      
      alert('Account settings saved successfully');
      return true; // Return success indicator
    } catch (error) {
      console.error('Error saving account settings:', error);
      alert('Failed to save account settings');
      throw error; // Re-throw error for handling in component
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
      } else if (response.status === 404) {
        console.warn('Demo account not found, using defaults');
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

  // Query existing account settings data - memoized with useCallback
  // This function only queries existing accounts, it does NOT create new accounts
  const loadAccountSettings = useCallback(async () => {
    if (!effectiveUsername || !usernameValidation.isValid) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/router/account/${effectiveUsername}`));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded existing account data:', data);
        if (data) {
          setAccountConfig(prev => ({ ...prev, ...data }));
        }
      } else if (response.status === 404) {
        // User doesn't exist yet - this is normal for new users
        // 404 response means no existing account found, which is expected for new users
        console.log('No existing account found for username:', effectiveUsername);
        // Don't show error for 404 - just use default values
        // New account creation will happen when saveAccountSettings is called
      } else {
        console.warn('Failed to fetch account settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading account settings:', error);
      // Don't show error alert for network issues - just use defaults
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUsername, usernameValidation.isValid]);

  return {
    accountConfig,
    setAccountConfig,
    isLoading,
    saveAccountSettings,
    loadAccountSettings,
    loadDemoAccountData,
    usernameValidation
  };
};
