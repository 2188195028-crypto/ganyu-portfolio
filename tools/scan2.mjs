// 验证: 圆内白色(I AM GANYU) / 圆外黑色(你好,我叫甘宇) / 圆背景 / 暖白底
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
const { width, height, bpp, px } = decodePNG(readFileSync('../shots/demo.png'));
const get = (x, y) => { const i = y * width * bpp + x * bpp; return [px[i], px[i+1], px[i+2]]; };
const hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
// demo: 圆中心 (800,470) r=235, 标题中心 (800,470)
// 标题字高约 112px*1.05 ≈ 118px → 字号范围 470±59
const checks = {
  '圆中心背景(两字母间)': [820, 470],
  '圆内标题白色(x=740)': [740, 470],
  '圆内标题白色(x=860)': [860, 470],
  '圆外背景': [1500, 500],
  'HELLO区域(x=800)': [800, 402],
};
for (const [k, [x, y]] of Object.entries(checks)) console.log(k.padEnd(22), hex(get(x, y)));
// 扫描: 圆内白色像素数(标题英文) 与 圆外黑色像素数(中文标题)
let white = 0, blackOut = 0;
for (let y = 400; y < 540; y++) for (let x = 575; x < 1025; x++) {
  const [r, g, b] = get(x, y);
  if (r > 235 && g > 235 && b > 235) white++;
}
for (let y = 400; y < 540; y++) for (let x = 200; x < 560; x++) {
  const [r, g, b] = get(x, y);
  if (r < 40 && g < 40 && b < 40) blackOut++;
}
console.log('圆内白色像素:', white, ' 圆外左侧黑色像素(你好,我叫甘宇):', blackOut);
