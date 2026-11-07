export type PixelPlane = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};
/** Box means use the original continuous snow surface. No synthesized pattern or random tiles. */
export function quietSnow(image: PixelPlane): Uint8ClampedArray {
  const { width: w, height: h, data } = image,
    stride = w + 1;
  const sums = [
    new Uint32Array(stride * (h + 1)),
    new Uint32Array(stride * (h + 1)),
    new Uint32Array(stride * (h + 1)),
  ];
  for (let y = 0; y < h; y++)
    for (let c = 0; c < 3; c++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += data[(y * w + x) * 4 + c];
        sums[c][(y + 1) * stride + x + 1] = sums[c][y * stride + x + 1] + row;
      }
    }
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 5),
        x1 = Math.min(w, x + 6),
        y0 = Math.max(0, y - 5),
        y1 = Math.min(h, y + 6),
        n = (x1 - x0) * (y1 - y0),
        i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const s = sums[c],
          mean =
            (s[y1 * stride + x1] -
              s[y0 * stride + x1] -
              s[y1 * stride + x0] +
              s[y0 * stride + x0]) /
            n;
        out[i + c] =
          Math.round(
            ([228, 235, 243][c] + (mean - [190, 200, 215][c]) * 0.22) / 2,
          ) * 2;
      }
      // This is a ground surface, not a sprite: source alpha holes exposed the dark world background.
      out[i + 3] = 255;
    }
  return out;
}
/** Keep the main connected silhouette. Clear only exterior grey matte / detached sheet fragments. */
export function isolateSprite(image: PixelPlane, matte = false): number {
  const { width: w, height: h, data } = image,
    n = w * h,
    seen = new Uint8Array(n),
    queue = new Int32Array(n);
  let removed = 0;
  if (matte) {
    let head = 0,
      tail = 0;
    const exterior = (p: number) => {
      const i = p * 4,
        a = data[i + 3],
        r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      return (
        a < 24 ||
        (a < 220 &&
          Math.max(r, g, b) - Math.min(r, g, b) < 32 &&
          b >= r - 8 &&
          r > 45 &&
          r < 212)
      );
    };
    const push = (p: number) => {
      if (!seen[p] && exterior(p)) {
        seen[p] = 1;
        queue[tail++] = p;
      }
    };
    for (let x = 0; x < w; x++) {
      push(x);
      push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      push(y * w);
      push(y * w + w - 1);
    }
    while (head < tail) {
      const p = queue[head++];
      if (data[p * 4 + 3]) removed++;
      data[p * 4 + 3] = 0;
      const x = p % w,
        y = Math.floor(p / w);
      if (x) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (y) push(p - w);
      if (y < h - 1) push(p + w);
    }
  }
  seen.fill(0);
  let largest = new Int32Array(0);
  for (let p = 0; p < n; p++)
    if (!seen[p] && data[p * 4 + 3] >= 24) {
      let head = 0,
        tail = 1;
      queue[0] = p;
      seen[p] = 1;
      const push = (q: number) => {
        if (!seen[q] && data[q * 4 + 3] >= 24) {
          seen[q] = 1;
          queue[tail++] = q;
        }
      };
      while (head < tail) {
        const q = queue[head++],
          x = q % w,
          y = Math.floor(q / w);
        if (x) push(q - 1);
        if (x < w - 1) push(q + 1);
        if (y) push(q - w);
        if (y < h - 1) push(q + w);
      }
      if (tail > largest.length) largest = queue.slice(0, tail);
    }
  const keep = new Uint8Array(n);
  for (const p of largest) keep[p] = 1;
  // A one-pixel fringe remains with its own RGB/alpha; avoid hard clipped antialiasing.
  for (const p of largest) {
    const x = p % w,
      y = Math.floor(p / w);
    if (x) keep[p - 1] = 1;
    if (x < w - 1) keep[p + 1] = 1;
    if (y) keep[p - w] = 1;
    if (y < h - 1) keep[p + w] = 1;
  }
  for (let p = 0; p < n; p++)
    if (!keep[p] && data[p * 4 + 3]) {
      data[p * 4 + 3] = 0;
      removed++;
    }
  return removed;
}
export function alphaBounds(
  image: PixelPlane,
  rect: { x: number; y: number; w: number; h: number },
) {
  let top = rect.h,
    bottom = -1,
    left = rect.w,
    right = -1;
  for (let y = 0; y < rect.h; y++)
    for (let x = 0; x < rect.w; x++)
      if (image.data[((y + rect.y) * image.width + x + rect.x) * 4 + 3] >= 96) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return { top, bottom, left, right };
}
