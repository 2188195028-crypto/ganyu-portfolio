// 截图验证工具: playwright-core + 系统 Edge, 无头截图首页
// 用法: node tools/shot.mjs [--demo] [--w 1600] [--out ../shots/xxx.png]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const args = process.argv.slice(2);
const demo = args.includes('--demo');
function getVal(key, fallback) {
  const i = args.indexOf(key);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const out = getVal('--out', demo ? '../shots/demo.png' : '../shots/normal.png');
const width = Number(getVal('--w', 1600));
const height = Number(getVal('--h', 1000));
const url = 'file:///E:/ClaudeProjects/作品集/index.html' + (demo ? '?demo=1' : '');

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--disable-gpu', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1600); // 等字体与首帧稳定

// 滚动到指定区块(截作品/联系等)
const scrollTo = args.includes('--works') ? 'works' : args.includes('--contact') ? 'contact' : args.includes('--about') ? 'about' : null;
if (scrollTo) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), scrollTo);
  await page.waitForTimeout(900);
}

// demo 模式: 模拟真实操作——鼠标先扫过标题(触发反色)再移到标题上方(截图时中文完整可见)
if (demo) {
  await page.mouse.move(width * 0.50, height * 0.50);
  await page.waitForTimeout(1000); // 圆跟到标题上, 反色效果出现
  await page.mouse.move(width * 0.50, height * 0.30);
  await page.waitForTimeout(1500); // 圆移开, lerp 跟上, 截图时中文完整
}

// 移动鼠标到标题处触发反色(非 demo 模式也看一眼交互; --works 截卡片时跳过, 避免 hover 触发彩色预览)
if (!demo && !args.includes('--works')) {
  await page.mouse.move(width * 0.42, height * 0.44);
  await page.waitForTimeout(900); // 等缓动跟上
}

mkdirSync(dirname(resolve(out)), { recursive: true });
await page.screenshot({ path: out, fullPage: args.includes('--full') });

const info = await page.evaluate(() => {
  const hero = document.querySelector('.hero');
  const inv = document.querySelector('.layer-invert');
  const cs = getComputedStyle(inv);
  const layer = document.querySelector('.layer-base');
  const ls = getComputedStyle(layer);
  return {
    clipPath: cs.clipPath,
    layerTransform: ls.transform,
    heroRect: { w: hero.getBoundingClientRect().width, h: hero.getBoundingClientRect().height },
  };
});
console.log('info:', JSON.stringify(info));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
console.log('saved:', resolve(out));
