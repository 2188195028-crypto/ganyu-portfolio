// 压缩作品预览图: PNG → 1280x800 WebP/JPEG 取体积最小者
// 用法: node tools/optimize.mjs [输入PNG路径] [输出名]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const inPath = args[0] || 'E:/ClaudeProjects/作品集/assets/medallion.png';
const outName = args[1] || 'medallion';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage();
const b64 = readFileSync(inPath).toString('base64');

const result = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const W = 1280, H = 800;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  return {
    webp: cv.toDataURL('image/webp', 0.85).split(',')[1],
    jpeg: cv.toDataURL('image/jpeg', 0.88).split(',')[1],
  };
}, b64);

const webpSize = Math.round(result.webp.length * 3 / 4);
const jpegSize = Math.round(result.jpeg.length * 3 / 4);
console.log('webp:', webpSize, 'B  jpeg:', jpegSize, 'B');

if (webpSize <= jpegSize) {
  writeFileSync('E:/ClaudeProjects/作品集/assets/medallion.new.webp', Buffer.from(result.webp, 'base64'));
  console.log('选用 webp (medallion.new.webp)');
} else {
  writeFileSync('E:/ClaudeProjects/作品集/assets/medallion.new.jpg', Buffer.from(result.jpeg, 'base64'));
  console.log('选用 jpeg (medallion.new.jpg)');
}
await browser.close();
