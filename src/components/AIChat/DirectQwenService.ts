/**
 * DirectQwenService.ts
 * 根据Ant Design X的通义千问官方示例实现的聊天服务
 */
import { XRequest } from '@ant-design/x';

interface Message {
  role: string;
  content: string;
}

export class DirectQwenService {
  private apiKey: string;
  private xrequestInstance: any;

  constructor(
    apiKey: string, 
    baseURL: string = '/compatible-mode/v1',
    model: string = 'qwen-max'
  ) {
    this.apiKey = apiKey;
    
    console.log('初始化通义千问服务:', {
      baseURL,
      model,
      apiKey: apiKey ? '已设置' : '未设置'
    });
    
    // 使用官方文档中通义千问的方式创建XRequest
    this.xrequestInstance = XRequest({
      baseURL: baseURL,
      model: model,
      dangerouslyApiKey: `Bearer ${this.apiKey}`
    });
  }

  /**
   * 发送消息到通义千问API
   */
  async sendMessage(
    message: string,
    conversationHistory: Array<Message> = []
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // 准备消息
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      let content = '';
      let hasReceivedContent = false;
      let retryCount = 0;
      const maxRetries = 1;
      
      console.log('发送请求到通义千问:', {
        baseURL: this.xrequestInstance.baseURL,
        messages: messages
      });
      
      const sendRequest = () => {
        try {
          // 使用官方示例中的create方法
          this.xrequestInstance.create(
            {
              messages,
              stream: true,
              // 添加用于调试的随机参数，避免缓存
              _t: Date.now()
            },
            {
              onSuccess: (chunks: any) => {
                console.log('请求成功，接收到的数据:', chunks);
                
                // 如果没有收到任何内容，但请求成功了
                if (!hasReceivedContent && retryCount < maxRetries) {
                  console.log(`未收到内容，尝试重试 (${retryCount + 1}/${maxRetries})`);
                  retryCount++;
                  sendRequest();
                  return;
                }
                
                resolve(content || '对不起，我无法回答这个问题。');
              },
              onError: (error: any) => {
                console.error('请求失败:', error);
                
                // 重试逻辑
                if (retryCount < maxRetries) {
                  console.log(`请求失败，尝试重试 (${retryCount + 1}/${maxRetries})`);
                  retryCount++;
                  // 延迟重试
                  setTimeout(sendRequest, 1000);
                  return;
                }
                
                reject(error);
              },
              onUpdate: (chunk: any) => {
                console.log('收到数据块:', typeof chunk, chunk);
                try {
                  if (typeof chunk === 'string') {
                    // 处理[DONE]标记
                    if (chunk.trim() === '[DONE]') {
                      console.log('收到流结束标记: [DONE]');
                      return;
                    }
                    
                    try {
                      // 尝试解析JSON
                      const data = JSON.parse(chunk);
                      console.log('解析的JSON数据:', data);
                      
                      if (data.choices && data.choices[0]?.delta?.content) {
                        const delta = data.choices[0].delta.content;
                        content += delta;
                        hasReceivedContent = true;
                        console.log(`解析到内容(${delta.length}字符):`, delta);
                      }
                    } catch (e) {
                      // 如果不是JSON，直接添加
                      console.log('非JSON字符串，直接添加:', chunk);
                      if (chunk) {
                        content += chunk;
                        hasReceivedContent = true;
                      }
                    }
                  } else if (chunk && typeof chunk === 'object') {
                    // 对象格式的数据
                    console.log('对象数据:', JSON.stringify(chunk, null, 2));
                    
                    if (chunk.choices && chunk.choices[0]?.delta?.content) {
                      const delta = chunk.choices[0].delta.content;
                      content += delta;
                      hasReceivedContent = true;
                      console.log(`得到内容(${delta.length}字符):`, delta);
                    } else if (chunk.data) {
                      try {
                        // 处理data字段前检查是否为[DONE]标记
                        if (typeof chunk.data === 'string' && chunk.data.trim() === '[DONE]') {
                          console.log('收到流结束标记: [DONE]');
                          return;
                        }
                        
                        // 如果有data字段，可能需要额外解析
                        const data = typeof chunk.data === 'string' 
                          ? JSON.parse(chunk.data) 
                          : chunk.data;
                        
                        if (data.choices && data.choices[0]?.delta?.content) {
                          const delta = data.choices[0].delta.content;
                          content += delta;
                          hasReceivedContent = true;
                          console.log(`从data字段得到内容(${delta.length}字符):`, delta);
                        } else {
                          console.log('data字段中没有找到delta内容:', data);
                        }
                      } catch (e) {
                        console.error('解析data字段失败:', e, '原始数据:', chunk.data);
                      }
                    } else if (chunk.content) {
                      content += chunk.content;
                      hasReceivedContent = true;
                      console.log(`得到content字段内容(${chunk.content.length}字符):`, chunk.content);
                    } else {
                      console.log('对象中没有找到内容:', chunk);
                    }
                  }
                  
                  // 输出当前累积内容长度
                  console.log('当前累积内容长度:', content.length);
                } catch (e) {
                  console.error('处理数据块出错:', e);
                }
              }
            }
          );
        } catch (error) {
          console.error('创建请求出错:', error);
          
          // 重试逻辑
          if (retryCount < maxRetries) {
            console.log(`创建请求失败，尝试重试 (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            setTimeout(sendRequest, 1000);
            return;
          }
          
          reject(error);
        }
      };
      
      // 开始发送请求
      sendRequest();
    });
  }
}

export default DirectQwenService; 