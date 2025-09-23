import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface InlineAuthenticationProps {
  onAuthSuccess?: () => void;
  instanceKey?: number;
}

const InlineAuthentication: React.FC<InlineAuthenticationProps> = ({ onAuthSuccess, instanceKey }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, signup, isLoading, error, clearError } = useAuth();

  // Always start with empty fields on mount, and after instanceKey changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    // Double-clear on next tick to beat aggressive autofill
    const t = setTimeout(() => {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }, 0);
    return () => clearTimeout(t);
  }, [instanceKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    let success = false;
    if (mode === 'login') {
      success = await login(username, password);
    } else {
      success = await signup(username, password, confirmPassword);
    }
    
    if (success && onAuthSuccess) {
      onAuthSuccess();
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  // When switching modes, clear all inputs to avoid carrying values over
  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Password validation helpers for signup
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isUsernameValid = username.length >= 6 && /^[a-zA-Z0-9_]+$/.test(username);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {mode === 'login' ? 'Sign In to Personal Account' : 'Create Personal Account'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {mode === 'login' 
            ? 'Enter your credentials to access your personal trading account'
            : 'Create a new account to manage your personal trading settings'
          }
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Hidden dummy fields to absorb browser autofill */}
          <input type="text" name="fake-username" autoComplete="username" value="" onChange={()=>{}} className="hidden" aria-hidden="true" />
          <input type="password" name="fake-password" autoComplete="current-password" value="" onChange={()=>{}} className="hidden" aria-hidden="true" />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  handleInputChange();
                }}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  mode === 'signup' && username.length > 0
                    ? isUsernameValid
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder={mode === 'login' ? 'Enter your username' : 'Choose a username'}
                required
                disabled={isLoading}
                // Reduce autofill behavior
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                name={`auth-username-${instanceKey ?? 'default'}`}
                inputMode="text"
              />
              {mode === 'signup' && username.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isUsernameValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {mode === 'signup' && username.length > 0 && (
              <div className="text-xs">
                {username.length < 6 && (
                  <p className="text-red-600">Must be at least 6 characters</p>
                )}
                {username.length >= 6 && !/^[a-zA-Z0-9_]+$/.test(username) && (
                  <p className="text-red-600">Only letters, numbers, and underscores allowed</p>
                )}
                {isUsernameValid && (
                  <p className="text-green-600">✓ Valid username</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  mode === 'signup' && password.length > 0
                    ? isPasswordValid
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                required
                disabled={isLoading}
                // Reduce autofill behavior
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                name={`auth-password-${instanceKey ?? 'default'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <div className="text-xs">
                {password.length < 8 ? (
                  <p className="text-red-600">Must be at least 8 characters</p>
                ) : (
                  <p className="text-green-600">✓ Valid password</p>
                )}
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    handleInputChange();
                  }}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                    confirmPassword.length > 0
                      ? (password === confirmPassword)
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                  // Reduce autofill behavior
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  name={`auth-confirm-${instanceKey ?? 'default'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="text-xs">
                  {doPasswordsMatch ? (
                    <p className="text-green-600">✓ Passwords match</p>
                  ) : (
                    <p className="text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={
                isLoading || 
                !username.trim() || 
                !password.trim() ||
                (mode === 'signup' && (!isUsernameValid || !isPasswordValid || !doPasswordsMatch))
              }
              className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                isLoading || 
                !username.trim() || 
                !password.trim() ||
                (mode === 'signup' && (!isUsernameValid || !isPasswordValid || !doPasswordsMatch))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleSwitchMode}
              disabled={isLoading}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Your personal account will securely store your API credentials 
            and trading preferences. You can always switch back to the demo account later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineAuthentication;
