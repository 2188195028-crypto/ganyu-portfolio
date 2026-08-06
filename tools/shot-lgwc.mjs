// 截取理工文创小店页作为作品预览图 (消费者版, 线上 GitHub Pages)
// 用法: node tools/shot-lgwc.mjs
// 流程: 截图 900x1125(半格竖版比例 0.8:1, 填满框零裁切) → WebP(0.85) → ../assets/lgwc.webp
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const URLS = [
  'https://2188195028-crypto.github.io/lgwc/',
  'file:///E:/ClaudeProjects/ligongwenchuang/index.html',
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 1125 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

let ok = false;
for (const url of URLS) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // 等 Google Fonts / 图片 / 轮播首帧
    const ready = await page.evaluate(() => document.readyState === 'complete');
    if (ready) { ok = true; console.log('loaded:', url); break; }
    console.log('loaded but not ready:', url);
  } catch (e) {
    console.warn('failed:', url, e.message.split('\n')[0]);
  }
}

if (!ok) console.warn('页面未就绪, 截取当前状态');

const png = await page.screenshot(); // viewport 900x1125 = 0.8:1, 与半格比例一致
mkdirSync(dirname(resolve('../assets/')), { recursive: true });

// PNG → 900x1125 WebP(0.85)
const b64 = png.toString('base64');
const webp = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const W = 900, H = 1125;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  return cv.toDataURL('image/webp', 0.85).split(',')[1];
}, b64);

const outPath = resolve('E:/ClaudeProjects/作品集/assets/lgwc.webp');
writeFileSync(outPath, Buffer.from(webp, 'base64'));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
console.log('saved:', outPath, Math.round(webp.length * 3 / 4), 'B');
