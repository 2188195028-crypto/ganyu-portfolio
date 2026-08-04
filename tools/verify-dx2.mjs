import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const line = document.querySelector('.tl-item .tl-line');
  const cs = getComputedStyle(line);
  const before = line.getBoundingClientRect().width;
  line.style.flexGrow = '5';
  const grow5 = line.getBoundingClientRect().width;
  line.style.flexGrow = '';
  line.style.position = 'static';
  const st = line.getBoundingClientRect().width;
  line.style.position = '';
  // 有没有匹配的 width 规则
  let wRules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.style && rule.style.width && line.matches(rule.selectorText)) wRules.push(rule.selectorText + '→' + rule.style.width);
      }
    } catch (e) {}
  }
  return {
    before,
    grow5,
    afterStatic: st,
    pos: cs.position, display: cs.display, float: cs.float,
    whiteSpace: cs.whiteSpace,
    widthRules: wRules,
    width: cs.width,
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
