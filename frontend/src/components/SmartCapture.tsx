import React, { useState } from 'react';
import { Camera, Target, Sparkles } from 'lucide-react';

interface SmartCaptureProps {
  onCapture: (imageData: string) => void;
}

const SmartCapture: React.FC<SmartCaptureProps> = ({ onCapture }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSmartCapture = async () => {
    setIsCapturing(true);
    setShowGuide(true);
    
    // 添加事件监听器来捕获剪贴板
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            onCapture(base64);
            setShowGuide(false);
            setIsCapturing(false);
            // 移除监听器
            document.removeEventListener('paste', handlePaste);
          };
          reader.readAsDataURL(file);
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    
    // 30秒后自动关闭
    setTimeout(() => {
      setShowGuide(false);
      setIsCapturing(false);
      document.removeEventListener('paste', handlePaste);
    }, 30000);
  };

  return (
    <>
      {/* 智能分析按钮 */}
      <div style={{
        position: 'fixed',
        top: '100px',
        right: '30px',
        zIndex: 999
      }}>
        <button
          onClick={handleSmartCapture}
          disabled={isCapturing}
          style={{
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: isCapturing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
          }}
        >
          {isCapturing ? (
            <>
              <Camera size={16} style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              等待截图...
            </>
          ) : (
            <>
              <Target size={16} />
              智能分析图表
            </>
          )}
        </button>
      </div>

      {/* 截图指引 */}
      {showGuide && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          zIndex: 1001,
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}><Camera size={48} /></div>
          <h3 style={{ marginBottom: '15px' }}>请截取图表</h3>
          <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            1. 使用截图工具截取R Shiny中的图表<br/>
            <span style={{ color: '#4a90e2' }}>Mac: Cmd + Shift + 4</span><br/>
            <span style={{ color: '#4a90e2' }}>Windows: Win + Shift + S</span><br/><br/>
            2. 截图后系统会自动检测并分析
          </p>
          <div style={{ 
            backgroundColor: 'rgba(74, 144, 226, 0.2)', 
            padding: '10px', 
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <Sparkles size={16} style={{display: 'inline', marginRight: '4px'}} /> 正在监听剪贴板，截图后会自动分析
          </div>
          <button
            onClick={() => {
              setShowGuide(false);
              setIsCapturing(false);
            }}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #666',
              color: '#999',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            取消
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </>
  );
};

export default SmartCapture;