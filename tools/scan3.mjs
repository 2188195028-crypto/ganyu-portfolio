// 验证两张截图: demo(圆在标题上缘) / normal(圆在标题上方)
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
for (const [file, cx, cy, r] of [['../shots/demo.png', 800, 376, 150], ['../shots/normal.png', 800, 244, 150]]) {
  const { width, height, bpp, px } = decodePNG(readFileSync(file));
  const get = (x, y) => { const i = y * width * bpp + x * bpp; return [px[i], px[i+1], px[i+2]]; };
  const hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  // 标题区(411-529)在圆内/圆外的黑色像素计数
  let blackIn = 0, blackOut = 0;
  for (let y = 415; y < 525; y++) for (let x = 400; x < 1200; x++) {
    const [rr, gg, bb] = get(x, y);
    if (rr < 40 && gg < 40 && bb < 40) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) blackIn++; else blackOut++;
    }
  }
  let whiteIn = 0;
  for (let y = 415; y < 525; y++) for (let x = 400; x < 1200; x++) {
    const [rr, gg, bb] = get(x, y);
    if (rr > 235 && gg > 235 && bb > 235) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) whiteIn++;
    }
  }
  console.log(file, '圆内白色像素:', whiteIn, '| 标题黑字-圆内:', blackIn, ' 圆外:', blackOut);
}
