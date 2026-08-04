// 截取繁荣昌盛点云展陈页作为作品预览图
// 优先线上 GitHub Pages, 失败回退本地 file://
// 用法: node tools/shot-medallion.mjs [--out ../assets/medallion.png]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const out = process.argv.slice(2).includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : '../assets/medallion.png';
const URLS = [
  'https://2188195028-crypto.github.io/medallion-pointcloud/',
  'file:///E:/ClaudeProjects/medallion-pointcloud/index.html',
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

let ok = false;
for (const url of URLS) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(45000); // 等 CDN 冷缓存(~28s) + 粒子入场动画(2.2s)
    const ready = await page.evaluate(() => window.__showcaseReady === true);
    if (ready) { ok = true; console.log('loaded:', url, 'ready:', ready); break; }
    console.log('loaded but not ready:', url);
  } catch (e) {
    console.warn('failed:', url, e.message.split('\n')[0]);
  }
}

if (!ok) {
  // 看门狗可能已触发错误态, 仍截图记录
  console.warn('页面未就绪, 截取当前状态');
}

mkdirSync(dirname(resolve(out)), { recursive: true });
await page.screenshot({ path: out });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
console.log('saved:', resolve(out));
