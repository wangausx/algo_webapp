import React, { useState, useEffect } from 'react';
import { Menu, Settings, MessageCircle, TrendingUp, PlayCircle, History } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

// Main App Component
const AlgoTradingApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [accountConfig, setAccountConfig] = useState({
    apiKey: '',
    secretKey: '',
    brokerageType: 'paper',
    modelType: 'intraday_reversal',
    riskLevel: 'moderate'
  });

  // Simulated trading state
  const [tradingStatus, setTradingStatus] = useState('stopped');
  const [positions, setPositions] = useState([]);

  // Chat message handler
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');

    // Here you would integrate with Anthropic's API
    // const response = await fetch('your-backend-endpoint/chat', ...);
    // Add assistant response
    setMessages([...newMessages, { 
      role: 'assistant', 
      content: 'This is a placeholder response. Implement actual LLM API integration.'
    }]);
  };

  // Trading controls
  const toggleTrading = () => {
    setTradingStatus(prev => prev === 'running' ? 'stopped' : 'running');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Fixed Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white shadow-lg flex md:block">
        <div className="p-4 flex items-center justify-between md:block">
          <h1 className="text-lg md:text-xl font-bold text-gray-800">Algo Trading Hub</h1>
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
          {/* Added missing navigation buttons */}
          <button
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Trading Assistant
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm md:text-base ${
              activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content Area - Fixed missing connections */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        {/* Dashboard Tab - Added missing content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card className="w-full">
                <CardHeader className="p-3 md:p-4">
                  <CardTitle className="text-sm md:text-base">Trading Status</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between space-x-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      tradingStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tradingStatus.charAt(0).toUpperCase() + tradingStatus.slice(1)}
                    </span>
                    <button
                      onClick={toggleTrading}
                      className={`px-3 py-2 md:px-4 md:py-2 text-sm rounded-lg text-white ${
                        tradingStatus === 'running' 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {tradingStatus === 'running' ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Added missing cards */}
              <Card>
                <CardHeader className="p-3 md:p-4">
                  <CardTitle className="text-sm md:text-base">Account Balance</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <div className="text-xl md:text-2xl font-bold">$10,000.00</div>
                  <div className="text-xs md:text-sm text-gray-500">Demo Account</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 md:p-4">
                  <CardTitle className="text-sm md:text-base">Today's P/L</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  <div className="text-xl md:text-2xl font-bold text-green-600">+$250.00</div>
                  <div className="text-xs md:text-sm text-gray-500">+2.5%</div>
                </CardContent>
              </Card>
            </div>

            {/* Fixed Positions Table */}
            <Card>
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-sm md:text-base">Open Positions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-xs md:text-sm bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Symbol</th>
                        <th className="p-2 text-left">Position</th>
                        <th className="p-2 text-left">Entry Price</th>
                        <th className="p-2 text-left">Current Price</th>
                        <th className="p-2 text-left">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs md:text-sm">
                      <tr className="border-t">
                        <td className="p-2">AAPL</td>
                        <td className="p-2">100</td>
                        <td className="p-2">$150.00</td>
                        <td className="p-2">$152.50</td>
                        <td className="p-2 text-green-600">+$250.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fixed Chat Section */}
        {activeTab === 'chat' && (
          <Card className="h-[calc(100vh-160px)] md:h-full">
            <CardHeader className="p-3 md:p-4">
              <CardTitle className="text-sm md:text-base">Trading Assistant</CardTitle>
              <CardDescription className="text-xs md:text-sm">Chat with your AI trading assistant</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="h-[calc(100vh-260px)] md:h-96 overflow-y-auto mb-3 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 md:p-3 text-sm rounded-lg ${
                      msg.role === 'user' ? 'bg-blue-100 ml-4' : 'bg-gray-100 mr-4'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 p-2 text-sm md:text-base border rounded-lg"
                  placeholder="Ask about your trading strategy..."
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fixed Settings Form */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader className="p-3 md:p-4">
              <CardTitle className="text-sm md:text-base">Account Settings</CardTitle>
              <CardDescription className="text-xs md:text-sm">Configure your trading parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <form className="space-y-3 md:space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium">API Key</label>
                  <input
                    type="password"
                    value={accountConfig.apiKey}
                    onChange={(e) => setAccountConfig({...accountConfig, apiKey: e.target.value})}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium">Secret Key</label>
                  <input
                    type="password"
                    value={accountConfig.secretKey}
                    onChange={(e) => setAccountConfig({...accountConfig, secretKey: e.target.value})}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium">Trading Mode</label>
                  <select
                    value={accountConfig.brokerageType}
                    onChange={(e) => setAccountConfig({...accountConfig, brokerageType: e.target.value})}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                  >
                    <option value="paper">Paper Trading</option>
                    <option value="live">Live Trading</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-medium">Trading Model</label>
                  <select
                    value={accountConfig.modelType}
                    onChange={(e) => setAccountConfig({...accountConfig, modelType: e.target.value})}
                    className="w-full p-2 text-sm md:text-base border rounded-lg"
                  >
                    <option value="intraday_reversal">Intraday Reversal</option>
                    <option value="trend_following">Trend Following</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Settings
                </button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AlgoTradingApp;