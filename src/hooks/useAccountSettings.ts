import { useEffect, useState, useCallback } from 'react';
import { AccountConfig } from '../components/AccountSettings';
import { buildApiUrl } from '../config/api';
import { loadUsername } from '../utils/storage';

export const useAccountSettings = (username: string, isAuthenticated?: boolean) => {
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
      demoAccount: initialUsername === 'dr_wang'
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

    // Short-circuit validation for demo user
    if (usernameToValidate === 'dr_wang') {
      setUsernameValidation({
        isValid: true,
        isChecking: false,
        exists: true,
        canUseForApi: true,
        error: null
      });
      return true;
    }
    
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
      
      // First check if username exists using the auth endpoint
      const authCheckResponse = await fetch(buildApiUrl(`/api/auth/check-username/${usernameToValidate}`));
      
      if (authCheckResponse.ok) {
        const authData = await authCheckResponse.json();
        console.log('Auth check response:', authData);
        
        if (authData.exists && authData.hasPassword) {
          // User exists and has authentication set up
          console.log('Username exists with authentication:', usernameToValidate);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            exists: true,
            canUseForApi: true, // Can use for API calls since it exists with auth
            error: null
          });
          return true;
        } else if (authData.exists && !authData.hasPassword) {
          // User exists but no password set - this might be a data sync issue
          // If user is authenticated in the frontend, trust that and allow API calls
          console.log('Username exists but needs authentication setup:', usernameToValidate);
          console.log('isAuthenticated parameter:', isAuthenticated);
          
          if (isAuthenticated) {
            // User is authenticated in frontend, allow API calls despite backend mismatch
            console.log('User is authenticated in frontend, allowing API calls despite backend auth mismatch');
            setUsernameValidation({
              isValid: true,
              isChecking: false,
              exists: true,
              canUseForApi: true, // Allow API calls for authenticated users
              error: null
            });
            return true;
          } else {
            // User not authenticated, cannot use for API calls
            setUsernameValidation({
              isValid: true,
              isChecking: false,
              exists: true,
              canUseForApi: false, // Cannot use for API calls until auth is set up
              error: null
            });
            return true;
          }
          
        } else {
          // Username doesn't exist yet - available for registration
          console.log('Username available for new account:', usernameToValidate);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            exists: false,
            canUseForApi: false, // Cannot use for API calls until account is created
            error: null
          });
          return true;
        }
      } else {
        // Fallback to old account check method
        const response = await fetch(buildApiUrl(`/router/account/${usernameToValidate}`));
        console.log('Fallback account check response:', response.status, response.ok);
        
        if (response.ok) {
          // Username exists in account settings
          console.log('Username exists in account settings:', usernameToValidate);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            exists: true,
            canUseForApi: true, // Can use for API calls since it exists
            error: null
          });
          return true;
        } else if (response.status === 404) {
          // Username doesn't exist
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
            error: `Error (${response.status}) - unable to validate username`
          });
          return false;
        }
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
      currentValidation: usernameValidation,
      isAuthenticated
    });
    
    if (effectiveUsername) {
      // Bypass validation completely for demo account
      if (effectiveUsername === 'dr_wang') {
        setUsernameValidation({
          isValid: true,
          isChecking: false,
          exists: true,
          canUseForApi: true,
          error: null
        });
        return;
      }

      // If user is authenticated, skip validation and mark as valid for API use
      if (isAuthenticated) {
        console.log('User is authenticated, skipping validation for:', effectiveUsername);
        setUsernameValidation({
          isValid: true,
          isChecking: false,
          exists: true,
          canUseForApi: true, // Authenticated users can use API
          error: null
        });
        return;
      }
      
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
  }, [effectiveUsername, validateUsername, isAuthenticated]);

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
      const response = await fetch(buildApiUrl('/router/account/dr_wang'));
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded demo account data:', data);
        if (data) {
          setAccountConfig(prev => ({ 
            ...prev, 
            ...data,
            username: 'dr_wang',
            demoAccount: true
          }));
        }
      } else if (response.status === 404) {
        console.warn('Demo account not found, using defaults');
        // Set default demo account values if API fails
        setAccountConfig(prev => ({
          ...prev,
          username: 'dr_wang',
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
          username: 'dr_wang',
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
        username: 'dr_wang',
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
    // For authenticated users, load data even if validation hasn't completed
    // For non-authenticated users, require valid username and validation
    if (!effectiveUsername || (!isAuthenticated && !usernameValidation.isValid)) return;
    
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
  }, [effectiveUsername, usernameValidation.isValid, isAuthenticated]);

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
