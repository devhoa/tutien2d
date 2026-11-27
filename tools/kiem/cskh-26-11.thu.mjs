// Bài thử CSKH 26/11/2026 (chủ dự án chọn): #286 nút CSKH nhỏ sát mép, kéo được, nhớ chỗ, kéo không mở bảng; #291 đả tọa mở bảng
// vẫn cộng linh khí; #267 vào bản đồ trận Khai Tinh thì có nút Rời trận, bấm hai lần thì ra khỏi trận.
// Chạy ở gốc kho: node tools/kiem/cskh-26-11.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8798;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
async function vao() {
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
}
async function dongThoai() {
  for (let i = 0; i < 40 && await p.evaluate(() => window.__game.dialog.open); i++) {
    const c = await p.$('#dlg-choices .choice');
    if (c && await c.isVisible()) await c.tap().catch(() => {}); else await p.mouse.click(195, 760);
    await p.waitForTimeout(250);
  }
}
await vao(); await dongThoai();

// #286 nút CSKH
const o = await p.$eval('#btn-cskh', e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, r: innerWidth - r.right, t: r.top }; });
thu(o.w <= 32 && o.h <= 32, `nút CSKH nhỏ (${o.w}×${o.h})`);
thu(o.r <= 6, `nút sát mép phải (cách ${o.r})`);
await p.mouse.move(390 - o.r - o.w / 2, o.t + o.h / 2); await p.mouse.down();
for (let i = 1; i <= 8; i++) await p.mouse.move(390 - o.r - o.w / 2 - i * 8, o.t + o.h / 2 + i * 40);
await p.mouse.up(); await p.waitForTimeout(500);
const o2 = await p.$eval('#btn-cskh', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top }; });
thu(Math.abs(o2.t - (o.t + 320)) < 12, `kéo xuống được (top ${o.t} → ${o2.t})`);
thu(await p.$eval('#cskh', e => e.hidden), 'kéo xong không mở bảng CSKH');
thu(o2.l > 300, `nhả tay thì hút về mép gần (left ${o2.l})`);
await p.waitForTimeout(400); await p.tap('#btn-cskh'); await p.waitForTimeout(600);
thu(!(await p.$eval('#cskh', e => e.hidden)), 'bấm thì mở bảng CSKH');
await p.tap('#cskh .bag-head > button:last-child'); await p.waitForTimeout(300);
await p.reload(); await p.waitForSelector('#btn-cskh'); await p.waitForTimeout(1500);
const o3 = await p.$eval('#btn-cskh', e => e.getBoundingClientRect().top);
thu(Math.abs(o3 - o2.t) < 12, `tải lại vẫn nhớ chỗ (${o3})`);
await p.evaluate(() => localStorage.removeItem('p2d_cskh_cho'));

// #291 đả tọa mở bảng
await p.goto(`http://localhost:${PORT}/?thu=1`); await vao(); await dongThoai();
const lk = await p.evaluate(async () => {
  const g = window.__game; g.player.meditating = true; g.uiOpen = true;
  const t0 = g.time; await new Promise(r => setTimeout(r, 1500));
  const chay = g.time - t0, st = !g.paused; g.uiOpen = false; g.player.meditating = false; return { chay, st };
});
thu(lk.st, 'đang đả tọa mà mở bảng thì vòng game không dừng');

// #267 Rời trận Khai Tinh
const kt = await p.evaluate(async () => {
  const g = window.__game, id = g.map.id;
  g.map.def.kh = { fight: true };
  await new Promise(r => setTimeout(r, 700));
  const hien = !document.querySelector('.kh-roi').hidden;
  return { hien, id };
});
thu(kt.hien, 'ở bản đồ trận Khai Tinh thì hiện nút Rời trận');
await p.tap('.kh-roi'); await p.waitForTimeout(300);
thu(await p.evaluate(() => !document.querySelector('.kh-roi').hidden), 'bấm lần đầu chỉ nhắc, chưa rời');
await p.tap('.kh-roi'); await p.waitForTimeout(6000);
const ra = await p.evaluate(() => ({ id: window.__game.map.id, kh: !!window.__game.map.def.kh?.fight, an: document.querySelector('.kh-roi').hidden }));
thu(!ra.kh && ra.an, `bấm lần hai thì ra khỏi trận (về ${ra.id})`);

thu(!errs.length, `không lỗi JavaScript ${errs.slice(0, 2).join(' | ')}`);
await b.close(); server.close();
console.log(hong ? `cskh-26-11: HỎNG ${hong} mục` : 'cskh-26-11: đạt');
process.exit(hong ? 1 : 0);
