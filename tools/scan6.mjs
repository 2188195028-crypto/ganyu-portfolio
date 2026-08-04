// 验证 works.png 金标题区域: 找黄色底条(整行淡黄带) vs 纯金色文字
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
function decodePNG(buf) {
  let off = 8, width = 0, height = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = raw[src++];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
      row[i] = v;
    }
  }
  return { width, height, bpp, px };
}
const { width, height, bpp, px } = decodePNG(readFileSync('../shots/works.png'));
// 找出金色文字的实际位置(扫描全图找金色像素 r>140,g>110,b<110)
let minY = 1e9, maxY = -1, minX = 1e9, maxX = -1, gold = 0;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x += 2) {
  const i = y * width * bpp + x * bpp;
  const r = px[i], g = px[i+1], b = px[i+2];
  if (r > 140 && g > 110 && b < 110 && r - b > 60) {
    gold++;
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  }
}
console.log('金色像素:', gold, ' 区域 x:', minX, '-', maxX, ' y:', minY, '-', maxY);
// 检查文字区域下方 15px 内是否有"淡黄色带"(非深色投影): 采样 y=maxY+5..maxY+20 找 r>200,g>180 的像素
if (maxY > 0) {
  let yellowBand = 0, bandSample = 0;
  for (let y = maxY + 4; y < Math.min(maxY + 24, height); y += 2) for (let x = minX; x < maxX; x += 4) {
    const i = y * width * bpp + x * bpp;
    const r = px[i], g = px[i+1], b = px[i+2];
    bandSample++;
    if (r > 200 && g > 180 && b < 150) yellowBand++;
  }
  console.log('文字下方带内 淡黄色像素:', yellowBand, '/', bandSample);
}
