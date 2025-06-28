import React from 'react';

interface PageNavigatorProps {
  currentPage: 'main' | 'database';
  onPageChange: (page: 'main' | 'database') => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({ currentPage, onPageChange }) => {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ffffff',
      borderBottom: '3px solid #e0e0e0',
      padding: '0',
      position: 'relative',
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 30px',
        position: 'relative'
      }}>
        {/* 左侧 - 返回按钮 */}
        <button
          onClick={() => onPageChange('main')}
          disabled={currentPage === 'main'}
          style={{
            backgroundColor: currentPage === 'main' ? '#f5f5f5' : '#4a90e2',
            color: currentPage === 'main' ? '#999' : 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '15px 25px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: currentPage === 'main' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            boxShadow: currentPage === 'main' ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
            transform: currentPage === 'main' ? 'scale(0.95)' : 'scale(1)'
          }}
          title="返回GIST AI主页"
          onMouseEnter={(e) => {
            if (currentPage !== 'main') {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'main') {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <span style={{ fontSize: '20px' }}>←</span>
          GIST AI 主页
        </button>

        {/* 中央 - 页面标题 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '30px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: currentPage === 'main' ? '#4a90e2' : '#ddd',
              border: `3px solid ${currentPage === 'main' ? '#4a90e2' : '#ccc'}`,
              transition: 'all 0.3s ease'
            }}></div>
            <span style={{ 
              color: currentPage === 'main' ? '#4a90e2' : '#666',
              fontSize: '20px'
            }}>
              GIST AI
            </span>
            <div style={{
              width: '60px',
              height: '4px',
              backgroundColor: '#e0e0e0',
              borderRadius: '2px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: currentPage === 'main' ? '0' : 'calc(100% - 20px)',
                width: '20px',
                height: '4px',
                backgroundColor: '#4a90e2',
                borderRadius: '2px',
                transition: 'all 0.4s ease'
              }}></div>
            </div>
            <span style={{ 
              color: currentPage === 'database' ? '#4a90e2' : '#666',
              fontSize: '20px'
            }}>
              数据库
            </span>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: currentPage === 'database' ? '#4a90e2' : '#ddd',
              border: `3px solid ${currentPage === 'database' ? '#4a90e2' : '#ccc'}`,
              transition: 'all 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* 右侧 - 数据库按钮 */}
        <button
          onClick={() => onPageChange('database')}
          disabled={currentPage === 'database'}
          style={{
            backgroundColor: currentPage === 'database' ? '#f5f5f5' : '#4a90e2',
            color: currentPage === 'database' ? '#999' : 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '15px 25px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: currentPage === 'database' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            boxShadow: currentPage === 'database' ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
            transform: currentPage === 'database' ? 'scale(0.95)' : 'scale(1)'
          }}
          title="前往GIST数据库"
          onMouseEnter={(e) => {
            if (currentPage !== 'database') {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'database') {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          GIST 数据库
          <span style={{ fontSize: '20px' }}>→</span>
        </button>
      </div>
    </div>
  );
};

export default PageNavigator;