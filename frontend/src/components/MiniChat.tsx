import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, RotateCw, Brain, Wrench, Loader, CheckCircle, AlertCircle, Activity as ActivityIcon, ChevronDown } from 'lucide-react';

// Example prompts shown in the empty state (clickable → directly send).
const EXAMPLE_PROMPTS = [
  'What does a KIT mutation mean for GIST prognosis?',
  'Compare imatinib vs sunitinib resistance mechanisms',
  'Top 10 GIST-related genes by literature count',
  'Explain CD117 staining in plain English',
];

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
  hadError?: boolean;  // assistant message: true if generation failed
}

interface MiniChatProps {
  placeholder?: string;
  height?: string;
}

const assistantMarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: '0.25rem 0', lineHeight: 1.45 }}>{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 style={{ margin: '0.3rem 0', fontSize: '0.95rem', fontWeight: 700 }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 style={{ margin: '0.3rem 0', fontSize: '0.92rem', fontWeight: 700 }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ margin: '0.25rem 0', fontSize: '0.9rem', fontWeight: 600 }}>{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ margin: '0.25rem 0', paddingLeft: '1.1rem' }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ margin: '0.25rem 0', paddingLeft: '1.1rem' }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ margin: '0.12rem 0', lineHeight: 1.4 }}>{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code style={{
      backgroundColor: 'rgba(15, 23, 42, 0.08)',
      padding: '0.08rem 0.25rem',
      borderRadius: '0.2rem',
      fontSize: '0.82rem'
    }}>
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre style={{
      margin: '0.35rem 0',
      padding: '0.55rem',
      backgroundColor: 'rgba(15, 23, 42, 0.06)',
      borderRadius: '0.35rem',
      overflowX: 'auto'
    }}>
      {children}
    </pre>
  )
};

const normalizeAssistantContent = (content: string) =>
  content.replace(/\r\n/g, '\n').replace(/\u0000/g, '').replace(/\n{3,}/g, '\n\n');

const MiniChat: React.FC<MiniChatProps> = ({
  placeholder = "Ask anything about GIST genes, mutations, or analysis... (Shift+Enter for new line)",
  height = "400px"
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserInputRef = useRef<string>('');

  const autosizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const updateAssistantMessage = (
    messageIndex: number,
    patch: Partial<Message>
  ) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (messageIndex >= 0 && messageIndex < newMessages.length) {
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          role: 'assistant',
          ...patch
        };
      }
      return newMessages;
    });
  };

  const sendNonStreamingFallback = async (
    currentInput: string,
    messageIndex: number,
    activities: AgentActivity[]
  ) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: currentInput, stream: false }),
    });

    const data = await response.json().catch(() => ({} as Record<string, unknown>));

    if (!response.ok) {
      const fallbackMessage =
        typeof data.error === 'string'
          ? data.error
          : `HTTP error! status: ${response.status}`;
      throw new Error(fallbackMessage);
    }

    updateAssistantMessage(messageIndex, {
      content: typeof data.reply === 'string' ? data.reply : '',
      image: typeof data.image === 'string' ? data.image : undefined,
      activities: [...activities],
      isStreaming: false
    });
  };

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
    signal: AbortSignal,
    onEvent: (event: { type: string; data: Record<string, unknown> }) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const contentType = response.headers.get('content-type') || '';
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      if (!contentType.includes('text/event-stream')) {
        let rawContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawContent += decoder.decode(value, { stream: true });
          onEvent({ type: 'text', data: { content: rawContent } });
        }
        onDone();
        return;
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
      // User-initiated abort → treat as graceful end, not as error.
      if ((error as Error).name === 'AbortError') {
        onDone();
        return;
      }
      onError(error as Error);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleRetry = () => {
    const last = lastUserInputRef.current;
    if (!last || isLoading) return;
    // Remove the failed assistant message (always the last entry in messages).
    setMessages(prev => prev.slice(0, -1));
    void handleSend(last);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    lastUserInputRef.current = text;
    const userMessage = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMessage]);
    if (overrideText === undefined) {
      setInput('');
      // Reset textarea height after clearing input.
      requestAnimationFrame(autosizeTextarea);
    }
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
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await parseSSEStream(
      '/api/chat/stream',
      { message: text },
      controller.signal,
      // onEvent
      (event) => {
        const timestamp = Date.now();
        const pushActivity = (activity: AgentActivity) => {
          activities.push(activity);
        };

        // Realtime activity status (English-only for UI consistency).
        if (event.type === 'thinking') {
          setCurrentActivity(`🧠 ${event.data.content || 'Thinking...'}`);
          pushActivity({
            type: 'thinking',
            timestamp,
            data: { content: String(event.data.content || '') }
          });
        } else if (event.type === 'tool_call') {
          setCurrentActivity(`🔧 Calling tool: ${event.data.tool}`);
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
          setCurrentActivity(`⏳ ${event.data.message || 'Running...'}`);
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
          setCurrentActivity(`${success ? '✅' : '❌'} ${event.data.message || (success ? 'Done' : 'Failed')}`);
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
          setCurrentActivity('📝 Generating reply...');
          if (event.data.content) {
            currentContent = event.data.content as string;
          }
        } else if (event.type === 'error') {
          setCurrentActivity(`❌ ${event.data.message || 'An error occurred'}`);
          pushActivity({
            type: 'error',
            timestamp,
            data: { message: String(event.data.message || 'An error occurred') }
          });
        }

        // 更新消息内容
        updateAssistantMessage(messageIndex, {
          content: currentContent,
          image: currentImage,
          activities: [...activities],
          isStreaming: true
        });
      },
      // onDone
      () => {
        abortControllerRef.current = null;
        setIsLoading(false);
        setCurrentActivity('');
        updateAssistantMessage(messageIndex, {
          isStreaming: false,
          activities: [...activities]
        });
      },
      // onError
      (error) => {
        console.error('SSE stream error:', error);
        setCurrentActivity('');
        abortControllerRef.current = null;

        void (async () => {
          if (!currentContent) {
            try {
              await sendNonStreamingFallback(text, messageIndex, activities);
              setIsLoading(false);
              return;
            } catch (fallbackError) {
              console.error('MiniChat fallback error:', fallbackError);
            }
          }

          updateAssistantMessage(messageIndex, {
            content: 'Sorry, an error occurred. Please try again.',
            isStreaming: false,
            hadError: true,
            activities: [...activities, {
              type: 'error',
              timestamp: Date.now(),
              data: { message: error.message }
            }]
          });
          setIsLoading(false);
        })();
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
            <p style={{ fontWeight: 600, color: 'var(--clr-gray-700)' }}>👋 Hi, I'm dbGIST Assistant.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Ask anything — gene panels, mutation impact, drug response, plot interpretation.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-gray-500)', marginTop: '0.75rem' }}>
              Try one of these:
            </p>
            <div className="mini-chat-suggestions">
              {EXAMPLE_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  className="mini-chat-suggestion"
                  onClick={() => void handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
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
                    message.isStreaming ? (
                      <div className="mini-streaming-text">
                        {normalizeAssistantContent(message.content)}
                      </div>
                    ) : (
                      <ReactMarkdown components={assistantMarkdownComponents}>
                        {normalizeAssistantContent(message.content)}
                      </ReactMarkdown>
                    )
                  ) : (
                    message.content
                  )}
                  {message.image && (
                    <div className="mini-message-image">
                      <img
                        src={message.image}
                        alt="Analysis figure"
                        onClick={() => window.open(message.image, '_blank')}
                        title="Click to enlarge"
                      />
                    </div>
                  )}
                  {message.role === 'assistant' && message.hadError && !isLoading && (
                    <button
                      type="button"
                      className="mini-retry-button"
                      onClick={handleRetry}
                      title="Retry the last question"
                    >
                      <RotateCw size={12} /> Retry
                    </button>
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
            <span>{currentActivity || 'Working...'}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mini-chat-input">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autosizeTextarea(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
        />
        {isLoading ? (
          <button
            onClick={handleStop}
            className="mini-send-button mini-stop-button"
            title="Stop generating"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim()}
            className="mini-send-button"
            title="Send (Enter)"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MiniChat;
