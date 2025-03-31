import { useState, useEffect, useCallback } from 'react';

export const useChatbot = (conversationId: string | null = null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (conversationId) {
      const savedMessages = localStorage.getItem(`chat_${conversationId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem(`chat_${conversationId}`, JSON.stringify(messages));
    }
  }, [messages, conversationId]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setUserInput('');
  }, []);


  // Types for messages
  interface Message {
    id: number;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    isError?: boolean; // Added this optional property
  }

  // Function to format messages for the Anthropic Messages API
  const formatMessagesForAPI = (messages: Message[]) => {
    return messages.map(msg => ({
      role: msg.sender,
      content: msg.content
    }));
  };

  // Function to send messages to Anthropic API via our server proxy
  const sendMessageToAnthropic = async (messageContent: string, previousMessages: Message[]) => {
    try {
      // Create the request to our server-side proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            ...formatMessagesForAPI(previousMessages),
            { role: 'user', content: messageContent }
          ],
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 2048,
          response_format: { type: 'markdown' },
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Create an empty assistant message that we'll update as chunks arrive
      const assistantMessage: Message = {
        id: Date.now() + 1,
        content: '',
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };

      // Add the empty assistant message to the UI
      setMessages(prev => [...prev, assistantMessage]);

      // Set up SSE handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
    
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
    
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim(); // e.g., "content_block_delta"
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;
    
            try {
              const parsed = JSON.parse(data);
              console.log('Received chunk:', currentEvent, parsed);

              if (currentEvent === 'content_block_delta' && parsed.delta?.text) {
                const contentDelta = parsed.delta.text;
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: lastMessage.content + contentDelta }
                  ];
                });
              } else if (currentEvent === 'message_start') {
                console.log('Message started:', parsed.message.id);
              } else if (currentEvent === 'message_stop') {
                console.log('Message completed');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, data);
            }
          }
        }
      }

      // Get the final message for return value
      let finalContent = '';
      setMessages(prev => {
        finalContent = prev[prev.length - 1].content;
        return prev;
      });

      return finalContent;
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!userInput.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now(),
      content: userInput,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      console.log('About to call sendMessageToAnthropic');
      await sendMessageToAnthropic(userInput, messages);
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: "I apologize, but I encountered an error. Please try again.",
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    startNewChat,
    isLoading
  };
};