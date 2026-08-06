// 截取理工文创小店管理后台作为作品预览图 (管理者版, 线上 GitHub Pages)
// 用法: node tools/shot-lgwc-admin.mjs
// 流程: 打开 admin.html → 密码门控(admin888) → 打开管理面板浮层 → 截图 900x1125(半格竖版比例) → WebP → ../assets/lgwc-admin.webp
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const URLS = [
  'https://2188195028-crypto.github.io/lgwc/admin.html',
  'file:///E:/ClaudeProjects/ligongwenchuang/admin.html',
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 1125 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

let ok = false;
for (const url of URLS) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // 1. 密码门控: 输入 admin888 并验证进入
    await page.waitForSelector('#loginPassword', { timeout: 15000 });
    await page.fill('#loginPassword', 'admin888');
    await page.click('#btnLogin');
    await page.waitForTimeout(1200); // 登录成功, 遮罩隐藏
    // 2. 打开管理面板浮层 (商品/分类/Banner 管理列表)
    await page.click('#adminToggle');
    await page.waitForTimeout(1200); // 面板滑入动画
    ok = true;
    console.log('logged-in & panel opened:', url);
    break;
  } catch (e) {
    console.warn('failed:', url, e.message.split('\n')[0]);
  }
}

if (!ok) console.warn('登录或面板未就绪, 截取当前状态');

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

const outPath = resolve('E:/ClaudeProjects/作品集/assets/lgwc-admin.webp');
writeFileSync(outPath, Buffer.from(webp, 'base64'));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
console.log('saved:', outPath, Math.round(webp.length * 3 / 4), 'B');
