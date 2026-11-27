// Bài thử BÀN PHÍM ẢO CHE Ô GÕ (chủ dự án 23/11/2026 17:25, ảnh iPhone: "Sửa bảng chat đi, k thấy chữ đang chat rồi").
// Gốc: src/core/xoay.js (bản 03:58, sửa nút lệch sau khi xoay máy) nghe cả visualViewport resize, mà bàn phím bật lên cũng làm khung nhìn
// đổi cỡ; 150 / 400 / 900 ms sau nó kéo trang về góc, bỏ mất lần Safari cuộn trang cho ô gõ nổi trên bàn phím: ô gõ chui xuống dưới.
// Trình duyệt thử không có bàn phím ảo, nên bài này thay window.visualViewport bằng bản giả (đặt cao, độ dời như iPhone lúc bàn phím
// bật), thay scrollY / scrollTo bằng bản giả ghi lại (Safari cuộn trang được dù html overflow hidden; Chromium thì không).
// Soát: (1) đang gõ thì không kéo trang về góc; (2) thôi gõ thì kéo về góc; (3) không gõ mà khung nhìn đổi cỡ (xoay máy) vẫn đo lại,
// kéo về góc như bản 03:58; (4) bảng Trò chuyện dời lên trên mép bàn phím, ô gõ nằm trong phần còn thấy, cả khi Safari đã dời khung nhìn;
// (5) thôi gõ bảng về chỗ cũ; (6) trình duyệt tự thu khung bố cục thì không dời.
// Chạy ở gốc kho: node tools/kiem/ban-phim.thu.mjs   (cần playwright; NODE_PATH nếu cài chỗ khác)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8795;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.addInitScript(() => {
  // khung nhìn giả: __ban(cao, dời) như lúc bàn phím bật; __ban(null, 0) là bàn phím cụp
  const f = new EventTarget();
  let h = null, top = 0;
  const so = (k, g) => Object.defineProperty(f, k, { get: g });
  so('height', () => h ?? innerHeight); so('width', () => innerWidth); so('offsetTop', () => top); so('offsetLeft', () => 0); so('scale', () => 1); so('pageTop', () => top); so('pageLeft', () => 0);
  Object.defineProperty(window, 'visualViewport', { value: f, configurable: true });
  window.__ban = (hh, t = 0) => { h = hh; top = t; f.dispatchEvent(new Event('resize')); f.dispatchEvent(new Event('scroll')); };
  // trang cuộn giả: Safari cuộn trang cho ô gõ nổi lên; scrollTo(0, 0) ghi lại số lần kéo về góc
  window.__y = 0; window.__keo = 0;
  Object.defineProperty(window, 'scrollY', { get: () => window.__y, configurable: true });
  Object.defineProperty(window, 'scrollX', { get: () => 0, configurable: true });
  window.scrollTo = () => { window.__keo++; window.__y = 0; };
});
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map, null, { timeout: 30000 });
for (let i = 0; i < 40 && await p.evaluate(() => window.__game.dialog.open); i++) {   // qua hội thoại truyện đầu game
  const c = await p.$('#dlg-choices .choice');
  if (c && await c.isVisible()) await c.tap().catch(() => {}); else await p.mouse.click(195, 760);
  await p.waitForTimeout(250);
}

let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const cho = ms => p.waitForTimeout(ms);
const KB = 380, CAO = 844 - KB;   // bàn phím iPhone dọc + thanh trên bàn phím

// mở bảng Trò chuyện, con trỏ vào ô gõ (khách chưa vào mạng nên ô bị khoá: mở khoá cho bài thử)
await p.evaluate(() => { window.__game.openSocial?.('chat'); const i = document.getElementById('social-input'); i.disabled = false; });
await cho(300);
const goc = await p.evaluate(() => document.getElementById('social').getBoundingClientRect().toJSON());
await p.focus('#social-input');
// (1) bàn phím bật, Safari cuộn trang 300 cho ô gõ nổi lên, khung nhìn thấp lại: không được kéo về góc
await p.evaluate(([c]) => { window.__y = 300; window.__keo = 0; window.__ban(c, 0); window.__ban(c, 0); }, [CAO]);
await cho(1200);
let r = await p.evaluate(() => ({ keo: window.__keo, y: window.__y }));
thu(r.keo === 0 && r.y === 300, `đang gõ: không kéo trang về góc (kéo ${r.keo} lần, trang còn cuộn ${r.y})`);

// (4) bảng nằm trên mép bàn phím, ô gõ trong phần còn thấy
const doBang = () => p.evaluate(() => {
  const s = document.getElementById('social'), i = document.getElementById('social-input'), v = window.visualViewport;
  return { s: s.getBoundingClientRect().toJSON(), i: i.getBoundingClientRect().toJSON(), lo: v.offsetTop, hi: v.offsetTop + v.height, on: s.classList.contains('bp-o') };
});
r = await doBang();
thu(r.on && r.i.bottom <= r.hi && r.i.top >= r.lo && r.s.top >= r.lo - 1, `bàn phím bật: ô gõ ${Math.round(r.i.top)}–${Math.round(r.i.bottom)} nằm trong phần thấy ${r.lo}–${r.hi}, bảng ${Math.round(r.s.top)}–${Math.round(r.s.bottom)}`);
// Safari dời khung nhìn xuống 250 (khung nhìn nằm ở 250–714 của khung bố cục)
await p.evaluate(([c]) => window.__ban(c, 250), [CAO]);
await cho(200);
r = await doBang();
thu(r.i.bottom <= r.hi && r.i.top >= r.lo && r.s.top >= r.lo - 1, `khung nhìn dời 250: ô gõ ${Math.round(r.i.top)}–${Math.round(r.i.bottom)} trong ${r.lo}–${r.hi}`);
// máy nhỏ (iPhone SE: còn 363 điểm): bảng thấp lại cho vừa
await p.evaluate(() => window.__ban(363, 0));
await cho(200);
r = await doBang();
thu(r.s.top >= -1 && r.i.bottom <= 363 && r.s.height <= 363, `máy nhỏ: bảng cao ${Math.round(r.s.height)} vừa phần thấy 363, ô gõ đáy ${Math.round(r.i.bottom)}`);

// (2), (5) thôi gõ: bàn phím cụp, bảng về chỗ cũ, trang kéo về góc
await p.evaluate(() => { document.getElementById('social-input').blur(); window.__ban(null, 0); });
await cho(1200);
r = await doBang();
const y2 = await p.evaluate(() => window.__y);
thu(!r.on && Math.abs(r.s.top - goc.top) < 1 && Math.abs(r.s.bottom - goc.bottom) < 1, `thôi gõ: bảng về chỗ cũ (${Math.round(r.s.top)}–${Math.round(r.s.bottom)}, gốc ${Math.round(goc.top)}–${Math.round(goc.bottom)})`);
thu(y2 === 0, `thôi gõ: trang kéo về góc (còn cuộn ${y2})`);

// (3) không gõ, xoay máy (khung nhìn đổi cỡ, trang bị cuộn): vẫn kéo về góc và đo lại như bản 03:58
await p.evaluate(() => { window.__y = 120; window.__keo = 0; window.__ban(null, 0); });
await cho(1100);
r = await p.evaluate(() => ({ keo: window.__keo, y: window.__y }));
thu(r.keo >= 1 && r.y === 0, `không gõ, khung nhìn đổi cỡ: kéo về góc (${r.keo} lần)`);

// (6) trình duyệt tự thu khung bố cục (khung nhìn = cả khung bố cục): không dời bảng
await p.focus('#social-input');
await p.evaluate(() => window.__ban(innerHeight, 0));
await cho(200);
r = await doBang();
thu(!r.on, 'khung bố cục đã thu theo bàn phím: không dời bảng');
await p.evaluate(() => { document.getElementById('social-input').blur(); window.__ban(null, 0); });

thu(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
