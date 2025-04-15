const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 暴露一个函数给页面，用于处理点击事件信息
    await page.exposeFunction('handleClick', (tagName, id, className) => {
        console.log(`点击事件发生在元素: <${tagName}> (ID: ${id}, Class: ${className})`);
    });

    try {
        // 打开网页，确保页面完全加载
        await page.goto('http://www.baidu.com', { waitUntil: 'networkidle2' });
    } catch (error) {
        console.error('打开网页时出错:', error);
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

    // 保持浏览器打开
    await new Promise(() => {});
})();
    