import React, { useState, useEffect } from 'react';
import { Menu, Settings as SettingsIcon, MessageCircle, TrendingUp } from 'lucide-react';
import Chatbot from './components/Chatbot';
import Settings, { AccountConfig } from './components/Settings'; 
import Dashboard from './components/Dashboard'; 
import { useChatbot } from './hooks/useChatbot';
import { useTrading } from './hooks/useTrading';

const AlgoTradingApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  const {
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    startNewChat,
    isLoading
  } = useChatbot(currentConversationId);

  const [accountConfig, setAccountConfig] = useState<AccountConfig>({
    username: 'wangausx',
    apiKey: '',
    secretKey: '',
    brokerageType: 'paper',
    modelType: 'intraday_reversal',
    riskLevel: 'moderate',
    balance: 0
  });

  const { tradingStatus, toggleTrading } = useTrading(accountConfig.username);

  const handleNewChat = () => {
    setCurrentConversationId(null);
    startNewChat();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-64 bg-white shadow-lg flex md:block">
        <div className="p-4 flex items-center justify-between md:block">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Quant Auto-Trading</h1>
            <p className="text-sm text-gray-600 mt-1">
              {accountConfig.username.trim() === '' ? 'No account set yet' : accountConfig.username}
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
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            AI Chatbot
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Configuration
          </button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <Dashboard 
            tradingStatus={tradingStatus}
            toggleTrading={toggleTrading}
            username={accountConfig.username} // Pass username prop here
          />
        )}

        {activeTab === 'chat' && (
          <Chatbot
            messages={messages}
            userInput={userInput}
            setUserInput={setUserInput}
            handleSendMessage={handleSendMessage}
            handleNewChat={handleNewChat}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            accountConfig={accountConfig}
            setAccountConfig={setAccountConfig}
            setParentAccountConfig={setAccountConfig}
          />
        )}
      </div>
    </div>
  );
};

export default AlgoTradingApp;