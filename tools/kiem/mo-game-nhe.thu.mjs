// Bài thử "mở game không tải thừa" (26/11/2026, chủ dự án 10:49: "cứ update là game của tui bị lỗi lag chậm"). Trước bản sửa, 8 giây sau khi
// game nạp xong MỌI máy tự đọc lại 209 hình trong CSS (5,3 MB) để chuẩn bị lớp giao diện cho clip (src/core/lop-ui.js soanSan), chen ngang lúc
// game đang tải hình của chính nó; mỗi lần có bản mới là mọi máy tải lại trang nên ai cũng dính lại. Luật giữ từ nay:
//   1. Vào game rồi đứng chơi, KHÔNG bấm nút Quay: không có hình nào bị đọc lại bằng fetch (hình của game tải bằng thẻ ảnh).
//   2. Bấm nút Quay: lúc đó mới chuẩn bị (có hình đọc bằng fetch), quay được, bấm lần nữa thì dừng.
// Trình duyệt thử bị gỡ requestIdleCallback cho giống iPhone (ở đó việc "làm lúc rảnh" chạy ngay). Chạy: cd _site && node ../tools/kiem/mo-game-nhe.thu.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8814;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: 0, layer: 5, qi: 0, gioi: 'nam', flags: { 'dong-phu': true }, visited: { 'thien-kiem-phong': true }, ht: { intro: 1 } };
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); try { window.requestIdleCallback = undefined; } catch { /* trình duyệt không cho gỡ */ } }, JSON.stringify(save));
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
const docLai = [];   // hình bị đọc lại bằng fetch (không phải thẻ ảnh)
p.on('request', r => { if (r.resourceType() === 'fetch' && /\.(png|webp|jpg|gif)(\?|$)/.test(r.url())) docLai.push(r.url().split('/').pop()); });
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(600);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.evaluate(() => { setInterval(() => { const g = window.__game;
  if (g.dialog.open) { const c = document.querySelector('#dlg-choices .choice'); if (c && c.offsetParent) c.click(); else document.querySelector('#dialog')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
  for (const e of document.querySelectorAll('.ht-back')) e.click(); }, 300); });
const coNut = await p.waitForSelector('#btn-rec', { state: 'attached', timeout: 15000 }).then(() => true, () => false);
thu(coNut, 'có nút Quay');
await p.waitForTimeout(13000);   // quá mốc 8 giây của bản cũ
thu(docLai.length === 0, `đứng chơi 13 giây không bấm Quay: không hình nào bị đọc lại (${docLai.length} hình${docLai.length ? ', ví dụ ' + docLai.slice(0, 3).join(', ') : ''})`);
// bấm Quay: giờ mới chuẩn bị
await p.evaluate(() => { const g = window.__game; g.closeAll?.(); document.querySelector('#btn-rec').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
const dangQuay = await p.waitForFunction(() => window.__game.recording === true, null, { timeout: 20000 }).then(() => true, () => false);
await p.waitForTimeout(3500);
thu(dangQuay, 'bấm nút Quay: bắt đầu quay được');
thu(docLai.length > 20, `bấm Quay rồi mới chuẩn bị lớp giao diện cho clip (${docLai.length} hình đọc lúc này)`);
await p.evaluate(() => document.querySelector('#btn-rec').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
const dung = await p.waitForFunction(() => window.__game.recording === false && !window.__game.dungClip, null, { timeout: 40000 }).then(() => true, () => false);
thu(dung, 'bấm lần nữa: dừng quay, dựng clip xong');
thu(errs.length === 0, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n❌ ${hong} chỗ hỏng` : '\n✅ Mở game không tải thừa: lớp giao diện cho clip chỉ chuẩn bị khi bấm nút Quay');
process.exit(hong ? 1 : 0);
