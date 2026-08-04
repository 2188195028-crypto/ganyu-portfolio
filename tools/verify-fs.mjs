import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const line = document.querySelector('.tl-line');
  const style = getComputedStyle(line);
  // 找所有 font-size 声明匹配的规则
  let rules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.style && rule.style.fontSize && line.matches(rule.selectorText)) {
          rules.push(rule.selectorText + ' → ' + rule.style.fontSize);
        }
      }
    } catch (e) {}
  }
  return { fontSize: style.fontSize, lineHeight: style.lineHeight, rules };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
