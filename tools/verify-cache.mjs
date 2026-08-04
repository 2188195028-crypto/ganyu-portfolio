import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const item = document.querySelector('.tl-item');
  const line = document.querySelector('.tl-item .tl-line');
  const ic = getComputedStyle(item);
  return {
    itemDisplay: ic.display,
    gridCols: ic.gridTemplateColumns,
    lineW: line.getBoundingClientRect().width,
    // 内联覆盖测试: 强制 item 宽度确认布局上下文
    itemW: item.getBoundingClientRect().width,
  };
});
console.log(JSON.stringify(r));
await browser.close();
