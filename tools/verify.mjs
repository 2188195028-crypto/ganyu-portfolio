// DOM 层验证: 圆内/圆外应分别命中反色层与基础层, 标题颜色随之切换
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('file:///E:/ClaudeProjects/作品集/index.html', { waitUntil: 'load' });
await page.waitForTimeout(800);
// 鼠标移到标题中部 → 圆应盖住标题中部
await page.mouse.move(600, 470);
await page.waitForTimeout(1200);
const result = await page.evaluate(() => {
  const hero = document.querySelector('.hero');
  const rc = hero.getBoundingClientRect();
  // 取样点: 圆中心 / 圆外远点 / 标题上两点
  const cs = getComputedStyle(document.querySelector('.layer-invert'));
  const clip = cs.clipPath.match(/circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/);
  const r = +clip[1], cx = rc.left + +clip[2], cy = rc.top + +clip[3];
  function sample(x, y) {
    const el = document.elementFromPoint(x, y);
    return { tag: el.tagName, cls: el.className?.toString().slice(0, 60) };
  }
  return {
    clip: { r, cx, cy },
    inCircleCenter: sample(cx, cy),
    outsideCircle: sample(cx + r + 30, cy),       // 圆外
    titleInside: sample(cx + r * 0.5, cy),        // 圆内标题区域
    titleOutside: sample(cx + r + 80, cy + 60),   // 圆外标题区域
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
