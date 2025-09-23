import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthenticationFlow: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');

  const switchToLogin = () => setCurrentView('login');
  const switchToSignup = () => setCurrentView('signup');

  if (currentView === 'login') {
    return <Login onSwitchToSignup={switchToSignup} />;
  }

  return <Signup onSwitchToLogin={switchToLogin} />;
};

export default AuthenticationFlow;
