// Bài thử hình SAI CỠ (26/11/2026 02:2x, iPhone chủ dự án: tắt mở lại game vẫn mất hình nhân vật; máy thử cùng bộ đồ thì đủ hình). Một tấm tải
// về được nhưng khác cỡ data/art.json (bản cũ còn lưu tạm: service worker lúc mạng hỏng từng trả bản khác ?v=, hoặc bộ nhớ đệm trình duyệt)
// trước đây bị coi như chưa có hình MÃI MÃI, không tải lại. Máy chủ giả trả tấm nhân vật của bộ khác (khác cỡ) cho HAI lần gọi đầu của
// hình nhân vật hero-tp-02.png, sau đó trả đúng. Kiểm: (1) lúc đầu nhân vật chưa vẽ được (đúng cảnh lỗi), sổ hình ghi "sai cỡ";
// (2) không ai chạm gì, game tự tải lại, nhân vật vẽ được và sổ gạch tấm đó; (3) không gọi dồn dập; (4) sw.js lúc mất mạng chỉ trả bản bỏ
// qua ?v= cho trang chính; (5) không lỗi JS.
// Chạy trong thư mục đã gói: cd _site && node ../tools/kiem/hinh-sai-co.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8810, LAN = 2, SAI = /assets\/art\/hero-tp-02\.png$/, THAY = 'assets/art/hero-tp-10.png';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const goi = [];
const server = createServer(async (req, res) => {
  let file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  if (SAI.test(file)) { goi.push(Date.now()); if (goi.length <= LAN) file = THAY; }
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'max-age=600' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); },
  JSON.stringify({ step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: 0, layer: 5, qi: 0, gioi: 'nam', look: 'nam', flags: { 'dong-phu': true }, visited: { 'thien-kiem-phong': true }, items: {} }));
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.waitForTimeout(1200);
const ve = () => p.evaluate(() => window.__thu.veThan(window.__game, null).diem);
const dau = await ve(), so1 = await p.evaluate(() => window.__thu.soHinh());
thu(goi.length > 0 && dau === 0 && so1.saiCo > 0, `lúc đầu hình nhân vật tải về sai cỡ: chưa vẽ được, sổ hình ghi ${so1.saiCo} tấm sai cỡ (${so1.mau.saiCo.join('; ')})`);
const duoc = await p.waitForFunction(() => window.__thu.veThan(window.__game, null).diem > 50, null, { timeout: 30000 }).then(() => true, () => false);
const so2 = await p.evaluate(() => window.__thu.soHinh());
thu(duoc && so2.saiCo === 0, `không chạm gì: game tải lại tấm đó, nhân vật vẽ được (${await ve()} điểm), sổ đã gạch tấm sai cỡ`);
thu(goi.length <= 4 && goi.slice(1).every((t, i) => t - goi[i] >= 1000), `không gọi dồn dập: tấm nhân vật được gọi ${goi.length} lần, cách nhau ≥ 1 giây`);
const sw = await readFile(join(process.cwd(), 'sw.js'), 'utf8');
thu(/r\.mode === 'navigate' \? caches\.match\(r, \{ ignoreSearch: true \}\)/.test(sw), 'service worker lúc mất mạng: chỉ trang chính được lấy bản khác ?v=');
thu(errs.length === 0, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
if (hong) { console.error(`${hong} bước hỏng`); process.exit(1); }
console.log('✅ Hình sai cỡ: game tự tải lại, nhân vật hiện lại');
