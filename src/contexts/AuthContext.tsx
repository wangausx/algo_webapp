import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { buildApiUrl } from '../config/api';

interface User {
  username: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, confirmPassword: string, apiKey?: string, secretKey?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys for authentication
const AUTH_STORAGE_KEYS = {
  USER: 'algoTrading_authenticatedUser',
  SESSION_TOKEN: 'algoTrading_sessionToken',
} as const;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on app load and verify token
  useEffect(() => {
    const verifySession = async () => {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const sessionToken = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      
      if (savedUser && sessionToken) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Verify token with backend
          const response = await fetch(buildApiUrl('/api/auth/verify'), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.valid) {
              // Token is valid, restore user session
              setUser({
                username: data.user.username,
                isAuthenticated: true,
              });
              return;
            }
          }
          
          // Token is invalid, clear stored data
          console.warn('Invalid session token, clearing stored data');
          localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
          localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
          
        } catch (error) {
          console.warn('Failed to verify session:', error);
          // Clear corrupted data
          localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
          localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
        }
      }
    };

    verifySession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return false;
    }

    if (username.length < 6) {
      setError('Username must be at least 6 characters long');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData: User = {
          username: data.user.username,
          isAuthenticated: true,
        };

        setUser(userData);
        
        // Store session data with JWT token
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
        
        return true;
      } else {
        // Handle different error codes
        if (data.code === 'INVALID_CREDENTIALS') {
          setError('Invalid username or password. Please try again.');
        } else if (data.code === 'INVALID_USERNAME') {
          setError(data.error || 'Invalid username format.');
        } else if (data.code === 'INVALID_PASSWORD') {
          setError(data.error || 'Invalid password format.');
        } else {
          setError(data.error || 'Login failed. Please try again.');
        }
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string, confirmPassword: string, apiKey?: string, secretKey?: string): Promise<boolean> => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return false;
    }

    if (username.length < 6) {
      setError('Username must be at least 6 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if username is available
      const checkResponse = await fetch(buildApiUrl(`/api/auth/check-username/${username}`));
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (!checkData.canRegister) {
          setError('Username already exists. Please choose a different username or try logging in.');
          return false;
        }
      }

      // Create account with placeholder API credentials if not provided
      const registrationData = {
        username,
        password,
        apiKey: apiKey || 'placeholder_api_key',
        secretKey: secretKey || 'placeholder_secret_key',
      };

      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData: User = {
          username: data.user.username,
          isAuthenticated: true,
        };

        setUser(userData);
        
        // Store session data with JWT token
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
        
        return true;
      } else {
        // Handle different error codes
        if (data.code === 'USERNAME_EXISTS') {
          setError('Username already exists. Please choose a different username or try logging in.');
        } else if (data.code === 'INVALID_USERNAME') {
          setError(data.error || 'Invalid username format.');
        } else if (data.code === 'INVALID_PASSWORD') {
          setError(data.error || 'Invalid password format.');
        } else if (data.code === 'MISSING_REQUIRED_FIELDS') {
          setError(data.error || 'All required fields must be provided.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error. Please check your connection and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
    
    if (sessionToken) {
      try {
        // Call backend logout endpoint
        await fetch(buildApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      } catch (error) {
        console.warn('Failed to logout from backend:', error);
        // Continue with local logout even if backend call fails
      }
    }

    setUser(null);
    setError(null);
    
    // Clear session data
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
    
    // Clear other app data
    localStorage.removeItem('algoTrading_username');
    localStorage.removeItem('algoTrading_accountConfig');
    localStorage.removeItem('algoTrading_demoAccountSelected');
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
