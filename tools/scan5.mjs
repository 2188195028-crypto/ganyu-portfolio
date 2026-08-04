// 验证作品区: 预览图应显示彩色(金色/朱红粒子), 非灰度
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
let colorful = 0, gold = 0, total = 0;
for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
  const i = y * width * bpp + x * bpp;
  const r = px[i], g = px[i+1], b = px[i+2];
  total++;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn > 15) colorful++;
  // 金色: 偏红偏绿、蓝低 (如 200/170/60)
  if (r > 140 && g > 120 && b < 120) gold++;
}
console.log('彩色像素:', colorful, `(${(colorful/total*100).toFixed(1)}%)`, ' 金色像素:', gold);
