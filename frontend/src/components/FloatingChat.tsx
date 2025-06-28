import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { Bot, User, Camera, BarChart3, X, Image, Hand, Target, Lightbulb } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 encoded image
}

const FloatingChat: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamMode, setStreamMode] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 监听智能截图事件
  useEffect(() => {
    const handleSmartCaptureImage = (event: CustomEvent) => {
      const imageData = event.detail.image;
      
      // 展开聊天窗口
      setIsExpanded(true);
      
      // 添加用户消息
      const userMessage: Message = { 
        role: 'user', 
        content: '我截取了R Shiny数据库中的图表，请帮我分析', 
        image: imageData 
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 自动发送AI分析请求
      sendImageAnalysis(imageData);
    };

    window.addEventListener('smartCaptureImage', handleSmartCaptureImage as EventListener);
    
    return () => {
      window.removeEventListener('smartCaptureImage', handleSmartCaptureImage as EventListener);
    };
  }, []);

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 处理图片文件
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      const userMessage: Message = { 
        role: 'user', 
        content: '请分析这个GIST相关的图表', 
        image: base64 
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 自动发送AI分析请求
      sendImageAnalysis(base64);
    } catch (error) {
      console.error('文件处理失败:', error);
      alert('图片处理失败，请重试');
    }
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    // 清空input以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖拽
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageFile(imageFile);
    } else {
      alert('请拖拽图片文件');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // 处理剪贴板粘贴
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        handleImageFile(file);
      }
    }
  };

  // 自动截图分析当前页面的图表
  const captureAndAnalyzeChart = async () => {
    setCapturing(true);
    
    try {
      // 先尝试截取整个页面容器
      const pageContainer = document.querySelector('.content-wrapper') || document.body;
      
      // 提示用户等待
      const waitMessage: Message = { 
        role: 'user', 
        content: '正在截取数据库页面，请稍候...' 
      };
      setMessages(prev => [...prev, waitMessage]);

      // 等待一下让页面完全渲染
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 使用html2canvas截取整个页面
      const canvas = await html2canvas(pageContainer as HTMLElement, {
        useCORS: false, // 不使用CORS，避免跨域问题
        allowTaint: false, // 不允许污染画布
        foreignObjectRendering: false, // 不渲染外部对象
        scale: 1,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          // 处理iframe - 尝试用占位符替代
          const iframes = clonedDoc.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            const placeholder = clonedDoc.createElement('div');
            placeholder.style.width = iframe.style.width || '100%';
            placeholder.style.height = iframe.style.height || '800px';
            placeholder.style.backgroundColor = '#f0f0f0';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.border = '2px dashed #ccc';
            placeholder.innerHTML = '<div style="text-align: center; color: #666;"><h3>R Shiny 数据库区域</h3><p>请手动截图此区域的图表</p></div>';
            iframe.parentNode?.replaceChild(placeholder, iframe);
          });
        }
      });

      // 转换为base64
      const base64Image = canvas.toDataURL('image/png');
      
      // 添加用户消息  
      const userMessage: Message = { 
        role: 'user', 
        content: '我截取了当前页面，请帮我分析其中的GIST相关内容', 
        image: base64Image 
      };
      setMessages(prev => [...prev, userMessage]);
      
      // 发送提示消息
      const tipMessage: Message = { 
        role: 'assistant', 
        content: '我看到了页面截图。由于技术限制，iframe中的R Shiny内容无法直接捕获。\n\n请您：\n1. 使用系统截图工具（Mac: Cmd+Shift+4, Win: Win+Shift+S）\n2. 截取数据库中的具体图表\n3. 按Ctrl+V粘贴到这里\n\n我将为您提供专业的GIST图表分析。' 
      };
      setMessages(prev => [...prev, tipMessage]);
      
    } catch (error) {
      console.error('截图失败:', error);
      
      const errorMessage: Message = { 
        role: 'assistant', 
        content: '截图遇到问题。建议您使用以下方式：\n\n**快速截图方法：**\n• Mac: Cmd + Shift + 4 选择区域截图\n• Windows: Win + Shift + S 选择区域截图\n• 截图后直接Ctrl+V粘贴到这里\n\n或者从数据库Download菜单下载图片后拖拽进来。' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCapturing(false);
    }
  };

  // 发送图片分析请求
  const sendImageAnalysis = async (base64Image: string) => {
    setLoading(true);
    
    try {
      const analysisPrompt = "请分析这个GIST相关的图表。包括：1. 图表类型和数据特征 2. 主要发现和趋势 3. 对GIST研究的意义 4. 可能的临床应用";
      
      if (streamMode) {
        // 流式处理图片分析
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: analysisPrompt,
            image: base64Image,
            stream: true
          }),
        });

        if (!response.ok) {
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
      } else {
        // 非流式处理图片分析
        const response = await axios.post('http://localhost:8000/api/chat', {
          message: analysisPrompt,
          image: base64Image,
          stream: false
        });
        
        const aiMessage: Message = { 
          role: 'assistant', 
          content: response.data.reply 
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error: any) {
      console.error('图片分析错误:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: '抱歉，图片分析服务暂时不可用。请确保图片清晰可读，或稍后重试。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (useStream: boolean = streamMode) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (useStream) {
      // 流式处理
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
      // 非流式处理（备用方案）
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
        
        const errorMessage: Message = { 
          role: 'assistant', 
          content: errorContent
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isExpanded) {
    // 收缩状态 - 只显示聊天图标
    return (
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
      }}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4a90e2',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
          }}
          title="打开GIST AI助手"
        >
          <Bot size={24} />
        </button>
      </div>
    );
  }

  // 展开状态 - 显示完整聊天界面
  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '400px',
      height: '500px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid #e0e0e0'
    }}>
      {/* 头部 */}
      <div style={{
        backgroundColor: '#4a90e2',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Bot size={20} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>GIST AI助手</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>随时为您解答GIST问题</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={captureAndAnalyzeChart}
            disabled={capturing || loading}
            style={{
              backgroundColor: capturing ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              color: capturing ? '#999' : '#4a90e2',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: capturing || loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
            title="尝试截图分析"
          >
            {capturing ? <><Camera size={12} />...</> : <><BarChart3 size={12} />分析</>}
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px'
          }}>
            <span>流式</span>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '30px',
              height: '16px'
            }}>
              <input
                type="checkbox"
                checked={streamMode}
                onChange={(e) => setStreamMode(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: streamMode ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '12px',
                  width: '12px',
                  left: streamMode ? '16px' : '2px',
                  bottom: '2px',
                  backgroundColor: streamMode ? '#4a90e2' : '#ffffff',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}></span>
              </span>
            </label>
          </div>
          <button
            onClick={clearChat}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="清空对话"
          >
            清空
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 5px'
            }}
            title="最小化"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div 
        style={{
          flex: 1,
          padding: '15px',
          overflowY: 'auto',
          backgroundColor: dragOver ? '#e8f4fd' : '#fafafa',
          border: dragOver ? '2px dashed #4a90e2' : 'none',
          position: 'relative'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
      >
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            marginTop: '50px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}><Hand size={40} /></div>
            <div>我是GIST辅助智能助手</div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              您可以边查看数据库边向我咨询问题
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              <Target size={12} style={{display: 'inline', marginRight: '4px'}} /> 点击"分析"尝试自动截图分析
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#999' }}>
              <Lightbulb size={12} style={{display: 'inline', marginRight: '4px'}} /> 支持拖拽图片或Ctrl+V粘贴图片进行分析
            </div>
          </div>
        )}
        
        {/* 拖拽提示 */}
        {dragOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(74, 144, 226, 0.9)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{ fontSize: '30px', marginBottom: '10px' }}><BarChart3 size={30} /></div>
            <div>释放图片开始分析</div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} style={{
            marginBottom: '15px',
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: msg.role === 'user' ? '#4a90e2' : '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: msg.role === 'user' ? 'white' : '#666',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div style={{
              backgroundColor: msg.role === 'user' ? '#4a90e2' : 'white',
              color: msg.role === 'user' ? 'white' : '#333',
              padding: '10px 12px',
              borderRadius: '12px',
              maxWidth: '80%',
              fontSize: '14px',
              lineHeight: '1.4',
              border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
            }}>
              {/* 显示图片 */}
              {msg.image && (
                <div style={{ marginBottom: '8px' }}>
                  <img 
                    src={msg.image} 
                    alt="用户上传的图片" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}
              
              {/* 显示文本内容 */}
              {msg.role === 'assistant' ? (
                <ReactMarkdown 
                  components={{
                    p: ({children}) => <p style={{margin: '0.3em 0', lineHeight: '1.4'}}>{children}</p>,
                    h1: ({children}) => <h1 style={{fontSize: '1.1em', fontWeight: 'bold', margin: '0.5em 0 0.3em 0'}}>{children}</h1>,
                    h2: ({children}) => <h2 style={{fontSize: '1.05em', fontWeight: 'bold', margin: '0.4em 0 0.2em 0'}}>{children}</h2>,
                    h3: ({children}) => <h3 style={{fontSize: '1.02em', fontWeight: 'bold', margin: '0.4em 0 0.2em 0'}}>{children}</h3>,
                    ul: ({children}) => <ul style={{margin: '0.3em 0', paddingLeft: '1.2em'}}>{children}</ul>,
                    ol: ({children}) => <ol style={{margin: '0.3em 0', paddingLeft: '1.2em'}}>{children}</ol>,
                    li: ({children}) => <li style={{margin: '0.1em 0'}}>{children}</li>,
                    code: ({children}) => <code style={{backgroundColor: '#f0f0f0', padding: '0.1em 0.3em', borderRadius: '2px', fontSize: '0.9em'}}>{children}</code>,
                    pre: ({children}) => <pre style={{backgroundColor: '#f0f0f0', padding: '0.5em', borderRadius: '4px', overflow: 'auto', margin: '0.3em 0', fontSize: '0.85em'}}>{children}</pre>,
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
        
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            fontSize: '14px'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              backgroundColor: 'white',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0'
            }}>
              {streamMode ? 'AI正在回复...' : 'AI正在思考...'}
            </div>
          </div>
        )}
        
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: 'white'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="输入您的GIST相关问题或拖拽图片..."
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              resize: 'none'
            }}
            disabled={loading}
          />
          
          {/* 图片上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              backgroundColor: '#f0f0f0',
              color: '#666',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="上传图片进行分析"
          >
            <Image size={16} />
          </button>
          
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: loading || !input.trim() ? '#ccc' : '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 15px',
              fontSize: '14px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            发送
          </button>
        </div>
        
        {/* 提示信息 */}
        <div style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          支持拖拽图片、点击📊按钮上传图片，或按Ctrl+V粘贴图片进行分析
        </div>
      </div>
    </div>
  );
};

export default FloatingChat;