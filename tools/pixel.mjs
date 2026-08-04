// 最小 PNG 解码器(仅 RGB/RGBA, 无隔行) + 关键点采样
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';

function decodePNG(buf) {
  let off = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
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

const file = process.argv[2] || '../shots/demo.png';
const { width, height, bpp, px } = decodePNG(readFileSync(file));
function rgb(x, y) {
  const i = y * width * bpp + x * bpp;
  return [px[i], px[i + 1], px[i + 2]];
}
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

// demo.png 几何: hero 从 y=60 开始, 圆中心 (672, 60+413.6≈474), 半径 470
const cx = 672, cy = 474, r = 470;
console.log('尺寸:', width + 'x' + height, ' bpp:', bpp);
const pts = {
  '圆中心': [cx, cy],
  'HELLO上方(圆内, y=cy-0.3r)': [cx, Math.round(cy - r * 0.3)],
  '圆外背景(右侧)': [1500, 500],
  '圆外背景(左上)': [200, 150],
  '标题线上_圆内(x=900)': [900, 492],
  '标题线上_圆内(x=700)': [700, 492],
  '标题线上_圆外(x=260)': [260, 492],
  '标题线上_圆外(x=200)': [200, 492],
};
for (const [k, [x, y]] of Object.entries(pts)) {
  console.log(k.padEnd(26), '(', x, ',', y, ')', hex(rgb(x, y)));
}
