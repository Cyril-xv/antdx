const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理到阿里云通义千问API
  app.use(
    '/compatible-mode',
    createProxyMiddleware({
      target: 'https://dashscope.aliyuncs.com',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/compatible-mode': '/compatible-mode', // 路径不变
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('----------------------------------------');
        console.log(`代理请求: ${req.method} ${req.url}`);
        console.log('目标地址:', 'https://dashscope.aliyuncs.com' + req.url);
        
        let rawBody = '';
        
        // 获取并记录请求体，用于调试
        if (req.body) {
          console.log('请求体:', JSON.stringify(req.body, null, 2));
          
          if (req.method === 'POST') {
            const bodyData = JSON.stringify(req.body);
            // 更新Content-Length头
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // 写入请求体
            proxyReq.write(bodyData);
            rawBody = bodyData;
          }
        }
        
        console.log('请求头:');
        // 打印请求头
        Object.keys(req.headers).forEach(key => {
          console.log(`  ${key}: ${req.headers[key]}`);
          if (key !== 'host') {
            proxyReq.setHeader(key, req.headers[key]);
          }
        });
        
        // 确保必要的头
        proxyReq.setHeader('Content-Type', 'application/json');
        
        // 记录完整的请求日志
        console.log('完整代理请求:', {
          method: req.method,
          url: req.url, 
          target: 'https://dashscope.aliyuncs.com' + req.url,
          headers: req.headers,
          body: rawBody
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`代理响应: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
        console.log('响应头:');
        
        // 打印响应头
        Object.keys(proxyRes.headers).forEach(key => {
          console.log(`  ${key}: ${proxyRes.headers[key]}`);
        });
        
        // 如果是JSON响应，尝试读取并打印内容
        if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('application/json')) {
          let responseBody = '';
          
          proxyRes.on('data', (chunk) => {
            responseBody += chunk.toString('utf8');
          });
          
          proxyRes.on('end', () => {
            try {
              const parsedBody = JSON.parse(responseBody);
              console.log('响应体 (JSON):', JSON.stringify(parsedBody, null, 2));
            } catch (e) {
              console.log('响应体 (raw):', responseBody);
            }
            console.log('----------------------------------------');
          });
        } else {
          console.log('响应类型:', proxyRes.headers['content-type'] || '未知');
          console.log('----------------------------------------');
        }
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        console.error('错误详情:', err.stack);
        
        // 发送详细的错误响应
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          error: true,
          message: `代理错误: ${err.message}`,
          code: err.code,
          stack: err.stack
        }));
      }
    })
  );
}; 