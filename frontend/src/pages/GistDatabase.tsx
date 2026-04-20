import React from 'react';
import FloatingChat from '../components/FloatingChat';
import SmartCapture from '../components/SmartCapture';
import config from '../config';

const GistDatabase: React.FC = () => {
  // const floatingChatRef = useRef<any>(null);

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

  const shinyUrl = config.shinyUrls.transcriptomics.ai;

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
      <FloatingChat />
    </div>
  );
};

export default GistDatabase;
