import React, { useRef } from 'react';
import FloatingChat from '../components/FloatingChat';
import SmartCapture from '../components/SmartCapture';

const GistDatabase: React.FC = () => {
  const floatingChatRef = useRef<any>(null);

  // 处理智能截图
  const handleSmartCapture = (imageData: string) => {
    // 将图片数据发送给FloatingChat组件
    // 这里我们需要通过某种方式将图片传递给FloatingChat
    // 最简单的方式是通过自定义事件
    const event = new CustomEvent('smartCaptureImage', { 
      detail: { image: imageData } 
    });
    window.dispatchEvent(event);
  };

  // Use local Shiny app if available, otherwise use remote
  const shinyUrl = process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:4964/'
    : 'http://117.72.75.45/dbGIST_shiny/';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <iframe
        src={shinyUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="GIST Database"
      />
      
      {/* 智能截图按钮 */}
      <SmartCapture onCapture={handleSmartCapture} />
      
      {/* 浮动AI助手 */}
      <FloatingChat ref={floatingChatRef} />
    </div>
  );
};

export default GistDatabase;