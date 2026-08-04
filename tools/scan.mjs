// 在指定区域内扫描接近纯白的像素(验证白色文字渲染)
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import { execSync } from 'child_process';

// 复用 pixel.mjs 的解码(简化: 直接复制逻辑)
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

const { width, height, bpp, px } = decodePNG(readFileSync('../shots/demo.png'));
function isWhite(x, y) {
  const i = y * width * bpp + x * bpp;
  return px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235;
}
// 扫描区域: [x0,y0,x1,y1]
const [x0, y0, x1, y1] = [540, 300, 810, 370]; // HELLO 区域(圆内上方)
let white = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
  if (isWhite(x, y)) { white++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
}
console.log('HELLO区域白色像素:', white, ' 包围盒 x:', minX + '-' + maxX, ' y:', minY + '-' + maxY);
