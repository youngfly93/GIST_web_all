import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MiniChatProps {
  placeholder?: string;
  height?: string;
}

const MiniChat: React.FC<MiniChatProps> = ({
  placeholder = "Enter your question, AI assistant will answer...",
  height = "400px"
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use container's scrollTop instead of scrollIntoView to avoid affecting the entire page
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Delayed scrolling to ensure DOM update is complete
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          stream: true
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // 添加一个空的AI消息用于流式更新
      let streamingMessageIndex = -1;
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant' as const, content: '' }];
        streamingMessageIndex = newMessages.length - 1;
        return newMessages;
      });

      if (reader) {
        let streamingContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          streamingContent += chunk;
          
          // Update streaming message content
          setMessages(prev => {
            const newMessages = [...prev];
            if (streamingMessageIndex >= 0 && streamingMessageIndex < newMessages.length) {
              newMessages[streamingMessageIndex] = {
                role: 'assistant',
                content: streamingContent
              };
            }
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = 'Sorry, an error occurred.';

      if (error.message?.includes('HTTP error')) {
        errorMessage = 'Failed to connect to server, please check your network connection.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server, please ensure the service is running.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mini-chat" style={{ height }}>
      <div className="mini-chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="mini-chat-welcome">
            <p>👋 Hello! I'm the GIST AI Assistant</p>
            <p>Feel free to ask me any questions</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`mini-message ${message.role}`}>
              <div className="mini-message-content">
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="mini-loading">AI is thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="mini-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="mini-send-button"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MiniChat;