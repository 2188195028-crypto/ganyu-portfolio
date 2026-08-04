// 验证 work-title 的 background-clip 和标题区域像素(找黄色底条)
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.evaluate(() => document.getElementById('works').scrollIntoView());
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const a = document.querySelector('.work-title a');
  const cs = getComputedStyle(a);
  return { clip: cs.backgroundClip, webkitClip: cs.webkitBackgroundClip, color: cs.color, filter: cs.filter };
});
console.log(JSON.stringify(r));
await page.screenshot({ path: '../shots/works2.png' });
await browser.close();
