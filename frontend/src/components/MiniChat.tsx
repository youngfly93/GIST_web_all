import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Brain, Wrench, Loader, CheckCircle, AlertCircle, Activity as ActivityIcon, ChevronDown } from 'lucide-react';

// Agent 活动追踪类型
interface AgentActivity {
  type: 'thinking' | 'tool_call' | 'tool_executing' | 'tool_result' | 'text' | 'error';
  timestamp: number;
  data: {
    content?: string;
    tool?: string;
    args?: Record<string, unknown>;
    message?: string;
    image?: string;
    success?: boolean;
    delta?: string;
    id?: string;
  };
}

// ActivityPanel 组件 - 显示 Agent 活动日志
const ActivityPanel: React.FC<{ activities: AgentActivity[]; isStreaming: boolean }> = ({
  activities,
  isStreaming
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!activities || activities.length === 0) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'thinking': return <Brain size={14} />;
      case 'tool_call': return <Wrench size={14} />;
      case 'tool_executing': return <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />;
      case 'tool_result': return <CheckCircle size={14} />;
      case 'error': return <AlertCircle size={14} />;
      default: return <ActivityIcon size={14} />;
    }
  };

  const getActivityColor = (type: string, success?: boolean) => {
    switch (type) {
      case 'thinking': return '#8B5CF6';
      case 'tool_call': return '#3B82F6';
      case 'tool_executing': return '#F59E0B';
      case 'tool_result': return success !== false ? '#10B981' : '#EF4444';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getActivityLabel = (activity: AgentActivity) => {
    switch (activity.type) {
      case 'thinking':
        return activity.data.content || '正在思考...';
      case 'tool_call':
        return `调用工具: ${activity.data.tool}`;
      case 'tool_executing':
        return activity.data.message || '执行中...';
      case 'tool_result':
        return activity.data.success !== false
          ? (activity.data.message || '执行完成')
          : `失败: ${activity.data.message}`;
      case 'error':
        return `错误: ${activity.data.message}`;
      default:
        return '';
    }
  };

  // 过滤掉 text 类型的活动，只显示有意义的活动
  const displayActivities = activities.filter(a => a.type !== 'text');
  if (displayActivities.length === 0) return null;

  return (
    <div style={{
      marginBottom: '8px',
      borderRadius: '8px',
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      fontSize: '12px'
    }}>
      {/* 可折叠头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: '#6B7280'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ActivityIcon size={14} />
          Agent 活动 ({displayActivities.length})
          {isStreaming && <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />}
        </span>
        <ChevronDown
          size={14}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {/* 活动列表 */}
      {isExpanded && (
        <div style={{
          padding: '0 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {displayActivities.map((activity, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '6px 8px',
                backgroundColor: 'white',
                borderRadius: '6px',
                borderLeft: `3px solid ${getActivityColor(activity.type, activity.data.success)}`,
                fontSize: '11px'
              }}
            >
              <span style={{
                color: getActivityColor(activity.type, activity.data.success),
                marginTop: '2px',
                flexShrink: 0
              }}>
                {getActivityIcon(activity.type)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#374151', marginBottom: '2px', wordBreak: 'break-word' }}>
                  {getActivityLabel(activity)}
                </div>
                {/* 工具调用参数 */}
                {activity.type === 'tool_call' && activity.data.args && (
                  <pre style={{
                    margin: 0,
                    padding: '4px 6px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px',
                    fontSize: '10px',
                    overflow: 'auto',
                    maxHeight: '80px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {JSON.stringify(activity.data.args, null, 2)}
                  </pre>
                )}
                {/* 工具结果图片缩略图 */}
                {activity.type === 'tool_result' && activity.data.image && (
                  <div style={{ marginTop: '4px' }}>
                    <img
                      src={activity.data.image as string}
                      alt="分析结果"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '80px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(activity.data.image as string, '_blank')}
                    />
                  </div>
                )}
              </div>
              <span style={{
                color: '#9CA3AF',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {new Date(activity.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  activities?: AgentActivity[];
  isStreaming?: boolean;
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
      const newMessages = [...prev, {
        role: 'assistant' as const,
        content: '',
        activities: [],
        isStreaming: true
      }];
      messageIndex = newMessages.length - 1;
      return newMessages;
    });

    let currentContent = '';
    let currentImage: string | undefined;
    const activities: AgentActivity[] = [];

    await parseSSEStream(
      '/api/chat/stream',
      { message: currentInput },
      // onEvent
      (event) => {
        const timestamp = Date.now();
        const pushActivity = (activity: AgentActivity) => {
          activities.push(activity);
        };

        // 实时更新活动状态
        if (event.type === 'thinking') {
          setCurrentActivity(`🧠 ${event.data.content || '正在分析...'}`);
          pushActivity({
            type: 'thinking',
            timestamp,
            data: { content: String(event.data.content || '') }
          });
        } else if (event.type === 'tool_call') {
          setCurrentActivity(`🔧 调用工具: ${event.data.tool}`);
          pushActivity({
            type: 'tool_call',
            timestamp,
            data: {
              tool: String(event.data.tool || ''),
              args: (event.data.args as Record<string, unknown>) || undefined,
              id: event.data.id ? String(event.data.id) : undefined
            }
          });
        } else if (event.type === 'tool_executing') {
          setCurrentActivity(`⏳ ${event.data.message || '执行中...'}`);
          pushActivity({
            type: 'tool_executing',
            timestamp,
            data: {
              message: String(event.data.message || ''),
              tool: event.data.tool ? String(event.data.tool) : undefined
            }
          });
        } else if (event.type === 'tool_result') {
          const success = event.data.success !== false;
          setCurrentActivity(`${success ? '✅' : '❌'} ${event.data.message || (success ? '完成' : '失败')}`);
          currentImage = event.data.image ? (event.data.image as string) : currentImage;
          pushActivity({
            type: 'tool_result',
            timestamp,
            data: {
              message: String(event.data.message || ''),
              image: event.data.image ? String(event.data.image) : undefined,
              success
            }
          });
        } else if (event.type === 'text') {
          setCurrentActivity('📝 生成回复中...');
          if (event.data.content) {
            currentContent = event.data.content as string;
          }
        } else if (event.type === 'error') {
          setCurrentActivity(`❌ ${event.data.message || '发生错误'}`);
          pushActivity({
            type: 'error',
            timestamp,
            data: { message: String(event.data.message || '发生错误') }
          });
        }

        // 更新消息内容
        setMessages(prev => {
          const newMessages = [...prev];
          if (messageIndex >= 0 && messageIndex < newMessages.length) {
            newMessages[messageIndex] = {
              role: 'assistant',
              content: currentContent,
              image: currentImage,
              activities: [...activities],
              isStreaming: true
            };
          }
          return newMessages;
        });
      },
      // onDone
      () => {
        setIsLoading(false);
        setCurrentActivity('');
        setMessages(prev => {
          const newMessages = [...prev];
          if (messageIndex >= 0 && messageIndex < newMessages.length) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              isStreaming: false,
              activities: [...activities]
            };
          }
          return newMessages;
        });
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
              content: 'Sorry, an error occurred. Please try again.',
              isStreaming: false,
              activities: [...activities, {
                type: 'error',
                timestamp: Date.now(),
                data: { message: error.message }
              }]
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
    if (currentActivity.startsWith('❌')) return <AlertCircle size={14} className="activity-icon error" />;
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
            // 跳过正在加载时的空消息气泡
            const isLastMessage = index === messages.length - 1;
            const isEmptyAssistant = message.role === 'assistant'
              && !message.content
              && !message.image
              && (!message.activities || message.activities.length === 0);
            if (isLoading && isLastMessage && isEmptyAssistant) {
              return null;
            }

            return (
              <div key={index} className={`mini-message ${message.role}`}>
                <div className="mini-message-content">
                  {message.role === 'assistant' && message.activities && message.activities.length > 0 && (
                    <ActivityPanel
                      activities={message.activities}
                      isStreaming={message.isStreaming || false}
                    />
                  )}
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )}
                  {message.image && (
                    <div className="mini-message-image">
                      <img
                        src={message.image}
                        alt="分析结果"
                        onClick={() => window.open(message.image, '_blank')}
                        title="点击查看大图"
                      />
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
