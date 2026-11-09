import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
/** Minimal read-only decoder for our RGBA8 PNG fixtures; validates actual pixels, not just IHDR. */
export function rgbaPng(path: string) {
  const b = readFileSync(path),
    w = b.readUInt32BE(16),
    h = b.readUInt32BE(20);
  if (b[24] !== 8 || b[25] !== 6 || b[28] !== 0)
    throw Error("Expected non-interlaced RGBA8 PNG: " + path);
  const chunks: Buffer[] = [];
  for (let p = 8; p < b.length;) {
    const n = b.readUInt32BE(p);
    if (b.toString("ascii", p + 4, p + 8) === "IDAT")
      chunks.push(b.subarray(p + 8, p + 8 + n));
    p += n + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)),
    stride = w * 4,
    out = Buffer.alloc(w * h * 4);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x,
        a = x >= 4 ? out[i - 4] : 0,
        c = y && x >= 4 ? out[i - stride - 4] : 0,
        up = y ? out[i - stride] : 0;
      let v = 0;
      if (f === 1) v = a;
      else if (f === 2) v = up;
      else if (f === 3) v = Math.floor((a + up) / 2);
      else if (f === 4) {
        const q = a + up - c,
          pa = Math.abs(q - a),
          pb = Math.abs(q - up),
          pc = Math.abs(q - c);
        v = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      } else if (f !== 0) throw Error("PNG filter");
      out[i] = (raw[p++] + v) & 255;
    }
  }
  return { width: w, height: h, data: out };
}
