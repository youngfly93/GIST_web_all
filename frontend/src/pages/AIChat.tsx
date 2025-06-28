import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Bot, Dna, Microscope, Hospital, Pill, BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamMode, setStreamMode] = useState(true);

  const sendMessage = async (useStream: boolean = true) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (useStream) {
      // Streaming processing
      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            stream: true
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        // Add an empty AI message for streaming updates
        let streamingMessageIndex = -1;
        setMessages(prev => {
          const newMessages = [...prev, { role: 'assistant', content: '' }];
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
            
            // 更新流式消息内容
            setMessages(prev => {
              const newMessages = [...prev];
              if (streamingMessageIndex >= 0) {
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
        console.error('Stream chat error:', error);
        const errorMessage: Message = { 
          role: 'assistant', 
          content: '抱歉，流式服务暂时不可用，请稍后重试。'
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    } else {
      // 非流式处理（原有逻辑）
      try {
        const response = await axios.post('http://localhost:8000/api/chat', {
          message: currentInput,
          stream: false
        });
        
        const aiMessage: Message = { 
          role: 'assistant', 
          content: response.data.reply 
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorContent = error.response?.data?.error || '抱歉，服务暂时不可用，请稍后重试。';
        const errorDetails = error.response?.data?.details;
        
        const errorMessage: Message = { 
          role: 'assistant', 
          content: errorDetails ? `${errorContent} (${errorDetails})` : errorContent
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <h1>GIST辅助智能助手</h1>
      <p className="page-description">协助了解胃肠道间质瘤（GIST）相关知识</p>
      
      <div className="stream-toggle" style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="checkbox"
            checked={streamMode}
            onChange={(e) => setStreamMode(e.target.checked)}
            style={{ margin: 0 }}
          />
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            流式输出
          </span>
          {streamMode ? (
            <CheckCircle size={18} color="#10B981" />
          ) : (
            <XCircle size={18} color="#EF4444" />
          )}
        </label>
      </div>
      
      <div className="chat-box">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
                <Bot size={28} color="#3B82F6" />
                <span style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1F2937'
                }}>
                  Hello! I'm the GIST AI Assistant.
                </span>
              </div>

              <p style={{
                textAlign: 'center',
                marginBottom: '24px',
                fontSize: '16px',
                color: '#4B5563'
              }}>
                I can help you learn about Gastrointestinal Stromal Tumor (GIST) related knowledge:
              </p>

              <div style={{
                margin: '24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Dna size={20} color="#8B5CF6" />
                  <span style={{ fontSize: '15px', color: '#374151' }}>Basic concepts and molecular mechanisms of GIST</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Microscope size={20} color="#06B6D4" />
                  <span style={{ fontSize: '15px', color: '#374151' }}>Gene mutation information (KIT, PDGFRA, etc.)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Hospital size={20} color="#EF4444" />
                  <span style={{ fontSize: '15px', color: '#374151' }}>Diagnostic methods and treatment options</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Pill size={20} color="#F59E0B" />
                  <span style={{ fontSize: '15px', color: '#374151' }}>Drug information and mechanisms of action</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={20} color="#10B981" />
                  <span style={{ fontSize: '15px', color: '#374151' }}>Research progress and literature</span>
                </div>
              </div>

              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                Please note: I provide educational information. For specific medical decisions, please consult professional doctors.
              </p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown 
                    components={{
                      p: ({children}) => <p style={{margin: '0.5em 0', lineHeight: '1.6'}}>{children}</p>,
                      h1: ({children}) => <h1 style={{fontSize: '1.2em', fontWeight: 'bold', margin: '0.8em 0 0.4em 0'}}>{children}</h1>,
                      h2: ({children}) => <h2 style={{fontSize: '1.1em', fontWeight: 'bold', margin: '0.7em 0 0.3em 0'}}>{children}</h2>,
                      h3: ({children}) => <h3 style={{fontSize: '1.05em', fontWeight: 'bold', margin: '0.6em 0 0.3em 0'}}>{children}</h3>,
                      ul: ({children}) => <ul style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ul>,
                      ol: ({children}) => <ol style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ol>,
                      li: ({children}) => <li style={{margin: '0.2em 0'}}>{children}</li>,
                      code: ({children}) => <code style={{backgroundColor: '#f5f5f5', padding: '0.2em 0.4em', borderRadius: '3px', fontSize: '0.9em'}}>{children}</code>,
                      pre: ({children}) => <pre style={{backgroundColor: '#f5f5f5', padding: '0.8em', borderRadius: '6px', overflow: 'auto', margin: '0.5em 0'}}>{children}</pre>,
                      strong: ({children}) => <strong style={{fontWeight: 'bold'}}>{children}</strong>,
                      em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && <div className="loading">AI is thinking...</div>}
        </div>

        <div className="input-section">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(streamMode)}
            placeholder="Enter your GIST-related questions..."
            className="chat-input"
          />
          <button onClick={() => sendMessage(streamMode)} disabled={loading} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;