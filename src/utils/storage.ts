// Storage keys
const STORAGE_KEYS = {
  USERNAME: 'algoTrading_username',
  DEMO_ACCOUNT_SELECTED: 'algoTrading_demoAccountSelected',
  ACCOUNT_CONFIG: 'algoTrading_accountConfig'
} as const;

// Username persistence
export const saveUsername = (username: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
  } catch (error) {
    console.warn('Failed to save username to localStorage:', error);
  }
};

export const loadUsername = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || '';
  } catch (error) {
    console.warn('Failed to load username from localStorage:', error);
    return '';
  }
};

// Demo account selection persistence
export const saveDemoAccountSelection = (isSelected: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEMO_ACCOUNT_SELECTED, JSON.stringify(isSelected));
  } catch (error) {
    console.warn('Failed to save demo account selection to localStorage:', error);
  }
};

export const loadDemoAccountSelection = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEMO_ACCOUNT_SELECTED);
    return saved ? JSON.parse(saved) : false;
  } catch (error) {
    console.warn('Failed to load demo account selection from localStorage:', error);
    return false;
  }
};

// Full account config persistence
export const saveAccountConfig = (config: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save account config to localStorage:', error);
  }
};

export const loadAccountConfig = (): any => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT_CONFIG);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load account config from localStorage:', error);
    return null;
  }
};

// Clear all stored data (useful for logout/reset)
export const clearStoredData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

// Clear only user data, preserve demo account settings
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNT_CONFIG);
    // Note: We don't clear DEMO_ACCOUNT_SELECTED to preserve demo account choice
  } catch (error) {
    console.warn('Failed to clear user data from localStorage:', error);
  }
};
