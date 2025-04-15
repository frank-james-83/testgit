const puppeteer = require('puppeteer');

async function getLogsWithPuppeteer(url, filterOptions = {}) {
    const browser = await puppeteer.launch({ 
        headless: false,
    });
    const page = await browser.newPage();

    try {
        const client = await page.target().createCDPSession();
        console.log('CDP 会话已创建');

        await client.send('Log.enable');
        console.log('日志监听已启用');

        const logs = [];

        client.on('Log.entryAdded', (result) => {
            if (result.entry) {
                let shouldInclude = true;

                // 过滤日志来源
                if (filterOptions.sources && filterOptions.sources.length > 0) {
                    const source = result.entry.source;
                    shouldInclude = filterOptions.sources.includes(source);
                }

                // 过滤日志级别
                if (shouldInclude && filterOptions.levels && filterOptions.levels.length > 0) {
                    const level = result.entry.level;
                    shouldInclude = filterOptions.levels.includes(level);
                }

                // 过滤包含特定关键词的日志
                if (shouldInclude && filterOptions.keywords && filterOptions.keywords.length > 0) {
                    const logText = result.entry.text || '';
                    shouldInclude = filterOptions.keywords.some(keyword => logText.includes(keyword));
                }

                if (shouldInclude) {
                    logs.push(result.entry);
                    console.log('新捕获的 CDP 日志信息:', JSON.stringify(result.entry, null, 2));
                }
            } else {
                console.log('未找到有效的日志信息:', result);
            }
        });

        // 监听网页的 console 输出
        page.on('console', (msg) => {
            const text = msg.text();
            let shouldInclude = true;

            // 过滤包含特定关键词的 console 日志
            if (filterOptions.keywords && filterOptions.keywords.length > 0) {
                shouldInclude = filterOptions.keywords.some(keyword => text.includes(keyword));
            }

            if (shouldInclude) {
                const consoleLog = {
                    source: 'console',
                    level: 'log',
                    text: text
                };
                logs.push(consoleLog);
                console.log('新捕获的 console 日志信息:', JSON.stringify(consoleLog, null, 2));
            }
        });

        // 暴露一个函数给页面，用于处理点击事件信息
        await page.exposeFunction('handleClick', (tagName, id, className) => {
            console.log(`点击事件发生在元素: <${tagName}> (ID: ${id}, Class: ${className})`);
        });


        console.log('开始监听日志和点击事件');

        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            await page.goto(url)//, { waitUntil: 'networkidle2', timeout: 60000, cacheEnabled: false });
            // await page.waitForSelector('body', { timeout: 5000 });
            // const resourceTree = await client.send('Page.getResourceTree');
            // console.log('获取到的资源树:', JSON.stringify(resourceTree, null, 2));
        } catch (error) {
            console.error('Error navigating to page:', error);
        }
        // 在页面中注入 JavaScript 代码，监听点击事件
        await page.evaluate(() => {
            document.addEventListener('click', (event) => {
                const target = event.target;
                const tagName = target.tagName;
                const id = target.id;
                const className = target.className;
                try {
                    window.handleClick(tagName, id, className);
                } catch (error) {
                    console.error('调用 handleClick 函数时出错:', error.message);
                }
            });
        });

        // 保持浏览器打开以持续监听
        await new Promise(() => {});
        return logs;
    } catch (error) {
        console.error('CDP 通讯出错:', error);
    }
}

module.exports = getLogsWithPuppeteer;    