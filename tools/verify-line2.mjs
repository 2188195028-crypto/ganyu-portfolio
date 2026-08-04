import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const item = document.querySelector('.tl-item');
  const line = item.querySelector('.tl-line');
  const strong = line.querySelector('strong');
  const sep = line.querySelector('.tl-sep');
  const lr = line.getBoundingClientRect();
  const sr = strong.getBoundingClientRect();
  const sepr = sep.getBoundingClientRect();
  // 文本末尾位置(最后一个文本节点)
  const range = document.createRange();
  const lastText = [...line.childNodes].filter(n => n.nodeType === 3).pop();
  range.setStart(lastText, lastText.length - 2);
  range.setEnd(lastText, lastText.length);
  const endRect = range.getBoundingClientRect();
  return {
    line: { x: lr.x, w: lr.width, h: lr.height },
    strong: { x: sr.x, w: sr.width, h: sr.height },
    sep: { x: sepr.x, w: sepr.width },
    textEnd: { x: endRect.x, y: endRect.y },
    lineBottom: lr.bottom,
    textBottom: endRect.bottom,
    gap: getComputedStyle(item).gap,
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
