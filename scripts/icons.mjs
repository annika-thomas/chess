// Render public/icons/icon.svg to the PNG sizes iOS and the web manifest need.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');
const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, name, round] of [[192, 'icon-192.png', true], [512, 'icon-512.png', true], [180, 'apple-touch-icon.png', false]]) {
  // iOS rounds corners itself, so its icon is a full square.
  const body = round ? svg : svg.replace('rx="112"', 'rx="0"');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent('<style>html,body{margin:0}svg{display:block;width:' + size + 'px;height:' + size + 'px}</style>' + body);
  await page.screenshot({ path: new URL('../public/icons/' + name, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
