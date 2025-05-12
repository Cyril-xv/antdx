import React, { useState, useEffect } from 'react';
import './App.css';
import XChatPage from './components/XChatPage/XChatPage';
import { ConfigProvider, theme as antTheme, Layout, Button, Modal, Input, Form, Switch, Typography, Space, notification, Spin } from 'antd';
import { SettingOutlined, KeyOutlined, LinkOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// 默认API密钥和端点
const DEFAULT_API_KEY = '';//输入自己的APIkey
const DEFAULT_API_ENDPOINT = '/compatible-mode/v1'; //可以切换模型的API端点

function App() {
  // 使用默认值初始化
  const [apiKey, setApiKey] = useState<string>(DEFAULT_API_KEY);
  const [apiEndpoint, setApiEndpoint] = useState<string>(DEFAULT_API_ENDPOINT);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [form] = Form.useForm();

  // 组件加载时从本地存储中获取API Key和主题设置
  useEffect(() => {
    const savedApiKey = localStorage.getItem('ai_chat_api_key');
    const savedEndpoint = localStorage.getItem('ai_chat_api_endpoint');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      // 如果没有本地存储的API Key，保存默认值到存储
      localStorage.setItem('ai_chat_api_key', DEFAULT_API_KEY);
    }
    
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint);
    } else {
      // 保存默认端点
      localStorage.setItem('ai_chat_api_endpoint', DEFAULT_API_ENDPOINT);
    }
    
    // 初始化完成
    setTimeout(() => {
      setIsInitializing(false);
    }, 800);
  }, []);

  const handleSaveSettings = () => {
    form.validateFields()
      .then((values) => {
        const { apiKey: newApiKey, apiEndpoint: newEndpoint, advancedMode } = values;
        
    setApiKey(newApiKey);
        if (advancedMode && newEndpoint) {
      setApiEndpoint(newEndpoint);
          localStorage.setItem('ai_chat_api_key', newApiKey);
          localStorage.setItem('ai_chat_api_endpoint', newEndpoint);
        } else {
          localStorage.setItem('ai_chat_api_key', newApiKey);
          // 重置为默认端点
          localStorage.setItem('ai_chat_api_endpoint', DEFAULT_API_ENDPOINT);
          setApiEndpoint(DEFAULT_API_ENDPOINT);
    }
    
    notification.success({
      message: '设置已保存',
      description: 'API密钥已成功保存，您现在可以开始聊天了',
      duration: 3
        });
        
        setShowSettings(false);
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-content">
            <div></div>
            <Space>
        <Button 
          icon={<SettingOutlined />} 
          onClick={() => setShowSettings(true)}
        >
                设置
        </Button>
            </Space>
          </div>
        </Header>
      
        <Content className="app-content">
          {isInitializing ? (
            <div className="loading-container">
              <Spin size="large">
                <div className="loading-content">
                  <p>正在初始化应用...</p>
                </div>
              </Spin>
            </div>
          ) : (
            <XChatPage apiKey={apiKey} apiEndpoint={apiEndpoint} />
          )}
        </Content>

        <Footer className="app-footer">
          <Typography.Text type="secondary">
            ©{new Date().getFullYear()} 基于 Ant Design X 构建
          </Typography.Text>
        </Footer>
      </Layout>

      <Modal
        title="API密钥设置"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        onOk={handleSaveSettings}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            apiKey: apiKey || '',
            apiEndpoint: apiEndpoint || DEFAULT_API_ENDPOINT,
            advancedMode: !!apiEndpoint
          }}
        >
          <Form.Item
            name="apiKey"
            label="API密钥"
            rules={[{ required: true, message: '请输入你的API密钥' }]}
          >
            <Input 
              prefix={<KeyOutlined />} 
              placeholder="输入阿里云通义千问API密钥"
              type="password" 
            />
          </Form.Item>
          
          <Form.Item name="advancedMode" valuePropName="checked">
            <Switch checkedChildren="高级设置" unCheckedChildren="基础设置" />
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.advancedMode !== currentValues.advancedMode}
          >
            {({ getFieldValue }) => 
              getFieldValue('advancedMode') ? (
                <Form.Item
                  name="apiEndpoint"
                  label="API端点"
                  rules={[{ required: true, message: '请输入API端点URL' }]}
                >
                  <Input 
                    prefix={<LinkOutlined />} 
                    placeholder={DEFAULT_API_ENDPOINT}
      />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}

export default App;
