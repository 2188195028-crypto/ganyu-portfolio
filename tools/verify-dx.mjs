import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/作品集/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const item = document.querySelector('.tl-item');
  const line = document.querySelector('.tl-item .tl-line');
  const time = document.querySelector('.tl-item .tl-time');
  const ic = getComputedStyle(item);
  const lc = getComputedStyle(line);
  // 试验: 强制 line width 100%
  line.style.width = '100%';
  const w100 = line.getBoundingClientRect().width;
  line.style.width = '';
  // 试验: item justify-content
  return {
    item: { display: ic.display, flexDir: ic.flexDirection, gap: ic.gap, w: item.getBoundingClientRect().width, children: item.children.length },
    line: { flexBasis: lc.flexBasis, flexGrow: lc.flexGrow, flexShrink: lc.flexShrink, w: line.getBoundingClientRect().width },
    time: { w: time.getBoundingClientRect().width },
    width100Test: w100,
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
