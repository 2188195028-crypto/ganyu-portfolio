// 验证: 静止 vs hover 时 img 的 computed filter
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/ganyu-portfolio/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);
const getFilter = () => page.evaluate(() => {
  const img = document.querySelector('.work-thumb img');
  const cs = getComputedStyle(img);
  return { filter: cs.filter, hovered: img.closest('a').matches(':hover') };
});
console.log('静止状态:', JSON.stringify(await getFilter()));
const thumb = await page.$('.work-thumb');
await thumb.hover();
await page.waitForTimeout(700);
console.log('hover 状态:', JSON.stringify(await getFilter()));
await browser.close();
