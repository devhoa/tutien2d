// Bài thử hình tải hỏng (26/11/2026 00:40, máy chủ dự án: trang tự tải lại đúng lúc đưa bản mới, vài hình tải hỏng; trước đây game không bao
// giờ tải lại hình hỏng nên nền đất vẽ khối màu, mất khung bảng trên và khung nút tới khi mở lại game), trên bản đã gói, chơi khách.
// Máy chủ giả trả 404 (kèm cache-control như GitHub Pages) cho HAI lần gọi đầu của mỗi hình nền đất và hình khung; sau đó trả đúng.
// (1) lúc đầu nền chưa vẽ được (đúng cảnh lỗi); (2) không ai chạm gì, game tự tải lại: nền vẽ được; (3) tệp CSS khung được nạp lại sau khi hình
// khung tải được; (4) hình hỏng được gọi lại có giãn nhịp, không dồn dập; (5) data/config.json → guard.ban_moi.tre_s hợp lệ.
// Chạy trong thư mục đã gói: cd _site && node ../tools/kiem/hinh-hong.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8809, LAN = 2, HONG = /assets\/art\/(nen-tk-[a-z]+\.png|ui-kg-(tren|o|danh|bang)\.webp)$/;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const goi = {};   // tệp → các lúc được gọi (ms)
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  if (HONG.test(file)) { (goi[file] ||= []).push(Date.now()); if (goi[file].length <= LAN) { res.writeHead(404, { 'cache-control': 'max-age=600' }); res.end(); return; } }
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'max-age=600' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const visited = { 'thien-kiem-phong': true, 'thanh-khe': true };
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); },
  JSON.stringify({ step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: 0, layer: 5, qi: 0, gioi: 'nam', flags: { 'dong-phu': true }, visited, ht: { intro: 1 } }));
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.evaluate(() => { for (const l of document.querySelectorAll('link[rel="stylesheet"]')) l.__goc = true; });   // dấu trên đối tượng (bản sao không mang theo)
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.waitForTimeout(1200);   // khung hình đầu đã gọi các tấm nền
const nen = Object.keys(goi).filter(f => f.includes('nen-tk-')), khung = () => Object.keys(goi).filter(f => f.includes('ui-kg-'));
thu(nen.length > 0 && !await p.evaluate(() => window.__thu.nenSan()), `lúc đầu ${nen.length} hình nền tải hỏng: nền chưa vẽ được (đúng cảnh lỗi)`);
const san = await p.waitForFunction(() => window.__thu.nenSan(), null, { timeout: 40000 }).then(() => true, () => false);
thu(san, 'không chạm gì: hình nền tự tải lại, nền vẽ được');
const nap = await p.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => /hud-khung\.css/.test(l.href) && !l.__goc)
  && ![...document.querySelectorAll('link[rel="stylesheet"]')].some(l => /hud-khung\.css/.test(l.href) && l.__goc), null, { timeout: 45000 }).then(() => true, () => false);
thu(khung().length > 0 && nap, `${khung().length} hình khung tải hỏng: tải lại được thì tệp CSS khung được nạp lại`);
await p.waitForTimeout(1500);
const sau = await p.evaluate(async () => { const o = {}; for (const f of ['ui-kg-tren.webp', 'ui-kg-o.webp']) o[f] = await new Promise(ok => { const im = new Image(); im.onload = () => ok(im.naturalWidth > 0); im.onerror = () => ok(false); im.src = 'assets/art/' + f; }); return o; });
thu(Object.values(sau).every(Boolean), 'hình khung giờ tải được ở đúng đường dẫn cũ (bản hỏng lưu tạm đã bị ghi đè)');
const gap = Object.values(goi).flatMap(t => t.slice(1).map((x, i) => x - t[i])), nhieu = Math.max(...Object.values(goi).map(t => t.length));
thu(nhieu <= 8, `không gọi dồn dập: hình bị gọi nhiều nhất ${nhieu} lần`);
await p.screenshot({ path: process.env.ANH || '/tmp/hinh-hong-sau.png' }).catch(() => {});
const C = JSON.parse(await readFile(join(process.cwd(), 'data/config.json'), 'utf8')).guard.ban_moi;
thu(Array.isArray(C.tre_s) && C.tre_s[0] >= 10 && C.tre_s[1] > C.tre_s[0] && C.tre_s[1] <= 300, `bản mới: mỗi máy chờ ngẫu nhiên ${C.tre_s?.join('–')} giây rồi mới tải lại`);
thu(errs.length === 0, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
if (hong) { console.error(`${hong} bước hỏng`); process.exit(1); }
console.log('✅ Hình tải hỏng: nền và khung tự tải lại');
