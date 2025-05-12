import React, { useRef, useState, useEffect } from 'react';
// 使用Ant Design X的UI组件
import { Bubble, Sender } from '@ant-design/x';
import { Typography, Empty, Alert, Button, Spin } from 'antd';
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import DirectQwenService from '../AIChat/DirectQwenService';
import './XChatPage.css';

interface XChatPageProps {
  apiKey: string;
  apiEndpoint?: string;
}

// 定义文件类型
interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  originFileObj?: File;
}

// 定义消息类型
interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
}

/**
 * XChatPage组件 - 使用Ant Design X的UI构建AI聊天页面
 */
const XChatPage: React.FC<XChatPageProps> = ({ 
  apiKey, 
  apiEndpoint = '/compatible-mode/v1'
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // 创建聊天服务实例
  const chatService = React.useMemo(() => {
    return new DirectQwenService(apiKey, apiEndpoint);
  }, [apiKey, apiEndpoint]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // 创建用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      message: content,
      role: 'user'
    };
    
    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    // 清空输入框
    setInputText('');
    
    try {
      console.log('开始发送消息...');
      // 准备历史消息记录，最多保留10条
      const history = messages
        .slice(-10)
        .map(msg => ({ role: msg.role, content: msg.message }));
      
      console.log('发送历史记录:', history);
      
      // 使用直接通义千问服务发送消息
      const response = await chatService.sendMessage(content, history);
      
      console.log('收到AI回复:', response);
      
      // 创建AI回复消息
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        message: response || '抱歉，我无法生成回复。',
        role: 'assistant'
      };
      
      // 添加AI回复
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('发送消息时捕获到错误:', err);
      const errorMessage = err instanceof Error ? err.message : '发送消息失败';
      setError(`请求失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 文件上传处理函数
  const addFile = (file: File) => {
    const newFile: UploadFile = {
      uid: `file-${Date.now()}-${files.length}`,
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: file
    };
    setFiles(prev => [...prev, newFile]);
    return false; // 不使用默认上传行为
  };
  
  const removeFile = (file: UploadFile) => {
    setFiles(prev => prev.filter(f => f.uid !== file.uid));
  };
  
  const resetFiles = () => {
    setFiles([]);
  };
  
  // 处理文件上传时的消息添加
  const handleSubmitWithFiles = (message: string) => {
    // 如果有文件，将文件信息添加到消息中
    if (files.length > 0) {
      const fileInfo = files.map(file => `[文件: ${file.name}]`).join('\n');
      const combinedMessage = `${message}\n\n附件信息:\n${fileInfo}`;
      handleSendMessage(combinedMessage);
      resetFiles(); // 发送后重置文件
    } else {
      handleSendMessage(message);
    }
  };
  
  // 重置对话
  const resetMessages = () => {
    setMessages([]);
    resetFiles();
    setError(null);
  };
  
  // 处理拖放文件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        addFile(file);
      });
    }
  };
  
  // 格式化消息列表，让用户消息在右侧，AI回答在左侧
  const bubbleItems = messages.map((msg) => ({
    key: msg.id,
    content: msg.message,
    type: msg.role,
    position: msg.role === 'user' ? 'right' : 'left',
    meta: msg.role === 'user' ? '我' : 'AI助手',
    avatar: msg.role === 'assistant' ? {
      src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'
    } : undefined
  }));
  
  // 如果没有API密钥，显示空状态
  if (!apiKey) {
    return (
      <div className="empty-container">
        <Empty 
          description="请先在设置中配置API密钥" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }
  
  // 简化的欢迎界面
  const renderWelcome = () => (
    <div className="empty-chat">
      <Typography.Title level={4}>欢迎使用通义千问AI助手</Typography.Title>
      <Typography.Paragraph className="welcome-text">
        您可以向我询问任何问题，我会尽力帮助您。您还可以上传文件，我可以帮您分析文件内容。
      </Typography.Paragraph>
      
      <div className="suggestion-container">
        <Typography.Text type="secondary">您可以尝试这些问题：</Typography.Text>
        <div className="suggestion-items">
          <div 
            className="suggestion-item" 
            onClick={() => handleSendMessage('写一首关于春天的古诗')}
          >
            写一首关于春天的古诗
          </div>
          <div 
            className="suggestion-item" 
            onClick={() => handleSendMessage('讲解一下React hooks的原理')}
          >
            讲解一下React hooks的原理
          </div>
          <div 
            className="suggestion-item" 
            onClick={() => handleSendMessage('如何提高英语口语水平？')}
          >
            如何提高英语口语水平？
          </div>
          <div 
            className="suggestion-item" 
            onClick={() => handleSendMessage('帮我分析一篇英文文章的语法结构')}
          >
            帮我分析一篇英文文章的语法结构
          </div>
        </div>
      </div>
    </div>
  );
  
  // 渲染文件列表
  const renderFileList = () => (
    <div className="file-list">
      {files.map((file) => (
        <div key={file.uid} className="file-item">
          <div className="file-info">
            <PaperClipOutlined />
            <span className="file-name">{file.name}</span>
            <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <Button 
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => removeFile(file)}
            size="small"
          />
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="xchat-container">
      {/* 错误提示 */}
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          closable 
          onClose={() => setError(null)}
          className="error-alert"
        />
      )}
      
      {/* 聊天头部 */}
      <div className="chat-header">
        <Typography.Title level={4}>AI 对话</Typography.Title>
        <div 
          className="clean-button"
          onClick={resetMessages}
          style={{ opacity: messages.length ? 1 : 0.5, cursor: messages.length ? 'pointer' : 'not-allowed' }}
        >
          清空对话
        </div>
      </div>
      
      {/* 聊天消息区域 - 支持文件拖放 */}
      <div 
        className={`chat-messages scrollbar-custom ${isDragging ? 'dragging' : ''}`}
        ref={chatContainerRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          renderWelcome()
        ) : (
          <Bubble.List items={bubbleItems} />
        )}
        
        {isDragging && (
          <div className="drop-overlay">
            <Typography.Title level={4}>释放鼠标上传文件</Typography.Title>
          </div>
        )}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="loading-indicator">
            <Spin size="small" />
            <span>AI正在思考中...</span>
          </div>
        )}
      </div>
      
      {/* 文件列表 */}
      {files.length > 0 && renderFileList()}
      
      {/* 输入区域 - 使用Sender组件 */}
      <div className="chat-input-container">
        <div className="input-wrapper">
          <Sender 
            onSubmit={handleSubmitWithFiles}
            loading={isLoading}
            placeholder="请输入您的问题..."
            value={inputText}
            onChange={setInputText}
          />
          <Button
            type="text"
            icon={<PaperClipOutlined />}
            className="upload-button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png';
              input.multiple = true;
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files) {
                  Array.from(target.files).forEach(file => {
                    addFile(file);
                  });
                }
              };
              input.click();
            }}
            title="上传文件"
          />
        </div>
      </div>
    </div>
  );
};

export default XChatPage; 