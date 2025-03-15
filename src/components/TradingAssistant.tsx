import React from 'react';
import { MessageCircleCodeIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import ReactMarkdown, { Components } from 'react-markdown';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  isError?: boolean;
}

interface TradingAssistantProps {
  messages: Message[];
  userInput: string;
  setUserInput: (input: string) => void;
  handleSendMessage: (event: React.FormEvent) => void;
  handleNewChat: () => void;
  isLoading: boolean;
}

const TradingAssistant: React.FC<TradingAssistantProps> = ({
  messages,
  userInput,
  setUserInput,
  handleSendMessage,
  handleNewChat,
  isLoading
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1 className="text-xl font-bold my-3" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-lg font-bold my-2" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-md font-bold my-2" {...props}>{children}</h3>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 my-2" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 my-2" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="my-1" {...props}>{children}</li>
    ),
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      // Check if it's a code block (has a language) rather than inline
      const isCodeBlock = !!match;
      
      return isCodeBlock ? (
        <div className="bg-gray-900 rounded-md my-2">
          <div className="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md">
            <span>{match && match[1] ? match[1] : 'code'}</span>
            <button 
              className="flex ml-auto gap-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
              onClick={() => {
                navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
              }}
            >
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-y-auto text-white text-sm">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="bg-gray-200 rounded px-1 py-0.5 text-sm" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children, ...props }) => (
      <p className="my-2" {...props}>{children}</p>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props}>
        {children}
      </blockquote>
    ),
  };

  return (
    <Card className="h-[calc(100vh-160px)] md:h-full flex flex-col">
      <CardHeader className="p-3 md:p-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm md:text-base">AI Chatbot</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Chat with your AI assistant
            </CardDescription>
          </div>
          <button
            onClick={handleNewChat}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="New Chat"
          >
            <MessageCircleCodeIcon className="w-12 h-12" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 md:p-4 flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-3 space-y-3">
          {messages && messages.map((msg) => (
            <div
              key={msg.id || Math.random().toString()}
              className={`p-2 md:p-3 text-sm rounded-lg ${
                msg.sender === 'user' ? 'bg-blue-100 ml-4' : 'bg-gray-100 mr-4'
              }`}
            >
              {msg.sender === 'assistant' ? (
                <div className="prose max-w-none">
                  <ReactMarkdown components={components}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-100 mr-4 p-2 md:p-3 text-sm rounded-lg animate-pulse">
              Thinking...
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="flex flex-col md:flex-row gap-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 p-2 text-sm md:text-base border rounded-lg"
              placeholder="Ask about anything here..."
              disabled={isLoading}
              rows={2}
            />
            <button
              onClick={(e) => handleSendMessage(e)}
              className={`px-4 py-2 text-sm md:text-base text-white rounded-lg ${
                isLoading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingAssistant;