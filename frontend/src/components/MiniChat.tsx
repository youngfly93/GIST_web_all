import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Brain, Wrench, Loader, CheckCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
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
  const [currentActivity, setCurrentActivity] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, currentActivity]);

  // SSE 流解析
  const parseSSEStream = async (
    url: string,
    body: object,
    onEvent: (event: { type: string; data: Record<string, unknown> }) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
            if (currentEvent && currentData) {
              try {
                const parsed = JSON.parse(currentData);
                onEvent({ type: currentEvent, data: parsed });
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
              currentEvent = '';
              currentData = '';
            }
          }
        }
      }

      onDone();
    } catch (error) {
      onError(error as Error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentActivity('');

    // 添加空的 AI 消息
    let messageIndex = -1;
    setMessages(prev => {
      const newMessages = [...prev, { role: 'assistant' as const, content: '' }];
      messageIndex = newMessages.length - 1;
      return newMessages;
    });

    let currentContent = '';
    let currentImages: string[] = [];

    await parseSSEStream(
      '/api/chat/stream',
      { message: currentInput },
      // onEvent
      (event) => {
        // 实时更新活动状态
        if (event.type === 'thinking') {
          setCurrentActivity(`🧠 ${event.data.content || '正在分析...'}`);
        } else if (event.type === 'tool_call') {
          setCurrentActivity(`🔧 调用工具: ${event.data.tool}`);
        } else if (event.type === 'tool_executing') {
          setCurrentActivity(`⏳ ${event.data.message || '执行中...'}`);
        } else if (event.type === 'tool_result') {
          setCurrentActivity(`✅ ${event.data.message || '完成'}`);
          if (event.data.image) {
            currentImages.push(event.data.image as string);
          }
        } else if (event.type === 'text') {
          setCurrentActivity('📝 生成回复中...');
          if (event.data.content) {
            currentContent = event.data.content as string;
          }
        }

        // 更新消息内容
        setMessages(prev => {
          const newMessages = [...prev];
          if (messageIndex >= 0 && messageIndex < newMessages.length) {
            newMessages[messageIndex] = {
              role: 'assistant',
              content: currentContent,
              images: [...currentImages]
            };
          }
          return newMessages;
        });
      },
      // onDone
      () => {
        setIsLoading(false);
        setCurrentActivity('');
      },
      // onError
      (error) => {
        console.error('SSE stream error:', error);
        setCurrentActivity('');
        setMessages(prev => {
          const newMessages = [...prev];
          if (messageIndex >= 0 && messageIndex < newMessages.length) {
            newMessages[messageIndex] = {
              role: 'assistant',
              content: 'Sorry, an error occurred. Please try again.'
            };
          }
          return newMessages;
        });
        setIsLoading(false);
      }
    );
  };

  // 获取活动图标
  const getActivityIcon = () => {
    if (currentActivity.startsWith('🧠')) return <Brain size={14} className="activity-icon thinking" />;
    if (currentActivity.startsWith('🔧')) return <Wrench size={14} className="activity-icon tool" />;
    if (currentActivity.startsWith('⏳')) return <Loader size={14} className="activity-icon executing" style={{ animation: 'spin 1s linear infinite' }} />;
    if (currentActivity.startsWith('✅')) return <CheckCircle size={14} className="activity-icon success" />;
    return <Loader size={14} className="activity-icon" style={{ animation: 'spin 1s linear infinite' }} />;
  };

  return (
    <div className="mini-chat" style={{ height }}>
      <div className="mini-chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="mini-chat-welcome">
            <p>👋 Hello! I'm the dbGIST Assistant</p>
            <p>Feel free to ask me any questions</p>
          </div>
        ) : (
          messages.map((message, index) => {
            // 跳过空的 assistant 消息（加载中的占位消息）
            if (message.role === 'assistant' && !message.content && (!message.images || message.images.length === 0)) {
              return null;
            }
            return (
              <div key={index} className={`mini-message ${message.role}`}>
                <div className="mini-message-content">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )}
                  {message.images && message.images.length > 0 && (
                    <div className="mini-message-images" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '8px',
                      marginTop: '8px'
                    }}>
                      {message.images.map((img, idx) => (
                        <div key={idx} className="mini-message-image">
                          <img
                            src={img}
                            alt={`分析结果${idx + 1}`}
                            onClick={() => window.open(img, '_blank')}
                            title="点击查看大图"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="mini-loading" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666'
          }}>
            {getActivityIcon()}
            <span>{currentActivity || 'AI 正在处理...'}</span>
          </div>
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
