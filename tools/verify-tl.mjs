import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1000);
const r = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.tl-item')];
  return items.map((it) => {
    const line = it.querySelector('.tl-line');
    const time = it.querySelector('.tl-time');
    return {
      lineH: line.getBoundingClientRect().height,
      lineW: line.getBoundingClientRect().width,
      fontSize: getComputedStyle(line).fontSize,
      wraps: line.getBoundingClientRect().height > parseFloat(getComputedStyle(line).fontSize) * 1.8,
      timeW: time.getBoundingClientRect().width,
      itemW: it.getBoundingClientRect().width,
      scrollW: it.scrollWidth,
    };
  });
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
