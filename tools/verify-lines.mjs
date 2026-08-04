import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/作品集/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const line = document.querySelector('.tl-item .tl-line');
  const cs = getComputedStyle(line);
  const text = line.textContent.replace(/\s+/g, ' ');
  // 逐字符 Range 测 y
  const ys = new Set();
  const range = document.createRange();
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let node;
  let prevY = null;
  const rows = [];
  while ((node = walker.nextNode())) {
    for (let i = 0; i < node.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (prevY === null || Math.abs(rect.top - prevY) > 2) rows.push({ y: Math.round(rect.top), x: Math.round(rect.left), ch: node.textContent[i] });
      prevY = rect.top;
    }
  }
  return {
    text,
    flex: cs.flex,
    minWidth: cs.minWidth,
    width: cs.width,
    lineHeight: cs.lineHeight,
    fontSize: cs.fontSize,
    rows,
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
