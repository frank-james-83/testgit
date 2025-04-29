const getLogsWithPuppeteer = require('./getLogsWithPuppeteer');
const path = require('path');
const express = require('express');
const app = express();
const port = 3000;

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 启动服务器
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // 生成本地 HTML 文件的 URL
    const url = `http://localhost:${port}/test_page.html`;
    debugger
    getLogsWithPuppeteer(url).then(() => {
        // 关闭服务器
        server.close();
    }).catch(error => {
        console.error('获取日志时出错:', error);
        // 关闭服务器
        server.close();
        //add new cooment!!!!
    });
}); 