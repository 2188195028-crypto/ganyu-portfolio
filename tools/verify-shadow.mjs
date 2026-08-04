// 验证浮雕 text-shadow 计算值
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);
const r = await page.evaluate(() => {
  const base = document.querySelector('.layer-base .hero-title');
  const inv = document.querySelector('.layer-invert .hero-title');
  const h2 = document.querySelector('.sec h2');
  const wt = document.querySelector('.work-title a');
  const cs = (el) => {
    const s = getComputedStyle(el);
    return { shadow: s.textShadow, bg: s.backgroundImage.slice(0, 80), color: s.color };
  };
  return { base: cs(base), invert: cs(inv), h2: cs(h2), workTitle: cs(wt) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
