// Procedurally paint an inlaid wooden chessboard (maple + walnut) to src/assets/wood.jpg.
// Each square is its own "piece" of wood: random grain offset, grain direction alternating.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const SIZE = 1024;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent(`<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas><style>body{margin:0}</style>`);
await page.evaluate((SIZE) => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  // Smooth value noise.
  const G = 64;
  const grid = Array.from({ length: G * G }, rand);
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const g = (i, j) => grid[(((j % G) + G) % G) * G + (((i % G) + G) % G)];
    const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  const fbm = (x, y) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1;

  const maple = [[236, 209, 166], [214, 178, 128]];
  const walnut = [[150, 98, 60], [108, 66, 38]];
  const ctx = document.getElementById('c').getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  const sq = SIZE / 8;
  const offsets = Array.from({ length: 64 }, () => [rand() * 40, rand() * 40, 0.8 + rand() * 0.5]);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const fx = Math.floor(px / sq), fy = Math.floor(py / sq);
      const light = (fx + fy) % 2 === 0;
      const [ox, oy, density] = offsets[fy * 8 + fx];
      // Alternate grain direction square by square, like an inlaid board.
      const along = (fx + fy) % 4 < 2 ? px : py;
      const across = (fx + fy) % 4 < 2 ? py : px;
      const u = along / 260 + ox, v = across / 22 + oy;
      const warp = fbm(u, v * 0.15) * 6;
      const rings = Math.sin((across / 9) * density + warp * 2.2 + fbm(u * 0.5, oy) * 4);
      const fiber = fbm(u * 6, v * 2.5);
      let t = 0.5 + 0.32 * rings * Math.abs(rings) + (fiber - 0.5) * 0.35;
      t = Math.max(0, Math.min(1, t));
      const [c0, c1] = light ? maple : walnut;
      const lx = (px % sq) / sq, ly = (py % sq) / sq;
      // Faint bevel at the seams between squares.
      const edge = Math.min(lx, ly, 1 - lx, 1 - ly);
      const shade = edge < 0.012 ? 0.86 : 1;
      const i = (py * SIZE + px) * 4;
      for (let k = 0; k < 3; k++) img.data[i + k] = (c0[k] + (c1[k] - c0[k]) * t) * shade;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}, SIZE);
await page.locator('#c').screenshot({ path: new URL('../src/assets/wood.jpg', import.meta.url).pathname, type: 'jpeg', quality: 82 });
await browser.close();
