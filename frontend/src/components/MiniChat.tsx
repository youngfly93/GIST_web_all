import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, RotateCw } from 'lucide-react';

// Example prompts shown in the empty state (clickable → directly send).
const EXAMPLE_PROMPTS = [
  'What does a KIT mutation mean for GIST prognosis?',
  'Compare imatinib vs sunitinib resistance mechanisms',
  'Top 10 GIST-related genes by literature count',
  'Explain CD117 staining in plain English',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isStreaming?: boolean;
  hadError?: boolean;
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
    messageIndex: number
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
  }, [messages]);

  // Stream plain text from the backend SSE/chunked endpoint.
  // Backend emits either raw text chunks or `event: text` SSE events; both
  // end up as a single growing string we pipe into the assistant message.
  const streamReply = async (
    url: string,
    body: object,
    signal: AbortSignal,
    onChunk: (fullText: string) => void,
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

      // Plain chunked response — concatenate as we go.
      if (!contentType.includes('text/event-stream')) {
        let raw = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          onChunk(raw);
        }
        onDone();
        return;
      }

      // Server-Sent Events — only `event: text` carries content; others ignored.
      let buffer = '';
      let textContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (currentEvent === 'text') {
              try {
                const parsed = JSON.parse(dataStr);
                if (typeof parsed.content === 'string') {
                  textContent = parsed.content;
                  onChunk(textContent);
                }
              } catch {
                /* ignore malformed event */
              }
            } else if (currentEvent === 'error') {
              try {
                const parsed = JSON.parse(dataStr);
                throw new Error(String(parsed.message || 'Stream error'));
              } catch (e) {
                throw e instanceof Error ? e : new Error('Stream error');
              }
            }
            currentEvent = '';
          }
        }
      }

      onDone();
    } catch (error) {
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
      requestAnimationFrame(autosizeTextarea);
    }
    setIsLoading(true);

    let messageIndex = -1;
    setMessages(prev => {
      const newMessages = [...prev, {
        role: 'assistant' as const,
        content: '',
        isStreaming: true
      }];
      messageIndex = newMessages.length - 1;
      return newMessages;
    });

    let currentContent = '';
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamReply(
      '/api/chat/stream',
      { message: text },
      controller.signal,
      // onChunk
      (fullText) => {
        currentContent = fullText;
        updateAssistantMessage(messageIndex, {
          content: fullText,
          isStreaming: true
        });
      },
      // onDone
      () => {
        abortControllerRef.current = null;
        setIsLoading(false);
        updateAssistantMessage(messageIndex, { isStreaming: false });
      },
      // onError
      (error) => {
        console.error('Stream error:', error);
        abortControllerRef.current = null;

        void (async () => {
          if (!currentContent) {
            try {
              await sendNonStreamingFallback(text, messageIndex);
              setIsLoading(false);
              return;
            } catch (fallbackError) {
              console.error('MiniChat fallback error:', fallbackError);
            }
          }

          updateAssistantMessage(messageIndex, {
            content: 'Sorry, an error occurred. Please try again.',
            isStreaming: false,
            hadError: true
          });
          setIsLoading(false);
        })();
      }
    );
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
            const isLastMessage = index === messages.length - 1;
            const isEmptyAssistant = message.role === 'assistant'
              && !message.content
              && !message.image;
            if (isLoading && isLastMessage && isEmptyAssistant) {
              return null;
            }

            return (
              <div key={index} className={`mini-message ${message.role}`}>
                <div className="mini-message-content">
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
            <span className="mini-loading-dot" />
            <span>Working...</span>
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
