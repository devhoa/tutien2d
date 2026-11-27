// Bài thử KHUNG DỌC TRÊN MÁY TÍNH (src/core/khung-doc.js; chủ dự án 23/11/2026 03:31 "khung màn hình cố định cho mọi máy", 22:02 gửi ảnh
// máy tính của người chơi "trên máy đth thì ok rồi mà trên máy tính nó vỡ khung với hình"). Khung phải luôn là 390 × 844 điểm như điện thoại
// (laptop thấp trước đây chỉ còn 304 điểm: chữ chỉ số bị cắt, Lực chiến mất số), phóng vừa màn, nằm giữa; độ phân giải vẽ trong khung đúng
// bằng số điểm màn hình thật (không nhoè); chuột bấm trúng nút qua phép phóng; bấm ra viền đen rồi bàn phím vẫn đi được; đổi cỡ cửa sổ thì
// khung và khung vẽ theo. Chạy trong thư mục site (CI: _site): node ../tools/kiem/khung-doc.thu.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'moc', weapon: 'kiem', realm: 2, layer: 4, qi: 0, gioi: 'nu', visited: { 'thien-kiem-phong': true } };
const b = await chromium.launch(), errs = [];
for (const [w, h, d] of [[1366, 657, 1], [1920, 969, 1], [1517, 683, 1.25]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, locale: 'vi-VN' });
  await ctx.route(/supabase-js|posthog/, r => r.abort());
  await ctx.addInitScript(s => { try { localStorage.setItem('p2d.save.v1:guest', s); } catch { /* không có bộ nhớ */ } }, JSON.stringify(save));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForFunction(() => document.querySelector('iframe.khung-doc'), null, { timeout: 15000 });
  await p.waitForTimeout(1500);
  const fr = p.frames().find(f => f.url().includes('khung=trong'));
  await fr.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(400);
  const k = Math.min(w / 390, h / 844), o = await p.evaluate(() => { const r = document.querySelector('iframe.khung-doc').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const tr = await fr.evaluate(() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio }));
  thu(tr.w === 390 && tr.h === 844, `${w}×${h}: trong khung luôn 390 × 844 (được ${tr.w} × ${tr.h})`);
  thu(Math.abs(o.w - 390 * k) < 1.5 && Math.abs(o.h - 844 * k) < 1.5 && Math.abs(o.x - (w - o.w) / 2) < 1.5 && o.y >= -0.5 && o.y + o.h <= h + 0.5,
    `${w}×${h}: khung phóng ${k.toFixed(3)} vừa màn, nằm giữa (${o.w.toFixed(0)} × ${o.h.toFixed(0)} ở x ${o.x.toFixed(0)})`);
  thu(Math.abs(tr.dpr - d * k) < 1e-6, `${w}×${h}: độ phân giải vẽ = màn thật × hệ số phóng (${tr.dpr.toFixed(3)})`);
  // bấm Chơi thử bằng chuột thật ở toạ độ trang ngoài (đi qua phép phóng)
  const bb = await (await fr.$('#btn-guest')).boundingBox();
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  const vao = await fr.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 }).then(() => true, () => false);
  thu(vao, `${w}×${h}: chuột bấm trúng nút Chơi thử qua khung phóng`);
  if (!vao) { await ctx.close(); continue; }
  await fr.evaluate(() => {
    const g = window.__game, dl = g.dialog;
    for (const x of Object.keys(dl)) if (typeof dl[x] === 'function' && x !== 'close') dl[x] = async () => null;
    const tat = () => { dl.open = false; const x = document.getElementById('dialog'); if (x) x.hidden = true; g.closeAll?.(); g.uiOpen = false; for (const e of document.querySelectorAll('.ht-back')) e.hidden = true; };
    tat(); setInterval(tat, 250);
  });
  await fr.waitForFunction(() => !window.__game.cheMan, null, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const cv = await fr.evaluate(() => { const c = document.querySelector('canvas'); return { w: c.width, cw: c.getBoundingClientRect().width }; });
  thu(Math.abs(cv.w - Math.round(390 * d * k)) <= 1 && Math.abs(cv.cw - 390) < 1, `${w}×${h}: khung vẽ ${cv.w} điểm = đúng số điểm màn hình của khung`);
  if (w === 1920) {   // bàn phím sau khi bấm viền đen; đổi cỡ cửa sổ
    const x0 = await fr.evaluate(() => window.__game.player.x);
    await p.mouse.click(20, h / 2);
    await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(700); await p.keyboard.up('ArrowLeft');
    const x1 = await fr.evaluate(() => window.__game.player.x);
    thu(x1 < x0 - 5, `bấm ra viền đen rồi bàn phím vẫn điều khiển (x ${x0.toFixed(0)} → ${x1.toFixed(0)})`);
    await p.setViewportSize({ width: 1280, height: 720 }); await p.waitForTimeout(900);
    const k2 = Math.min(1280 / 390, 720 / 844), c2 = await fr.evaluate(() => [innerWidth, document.querySelector('canvas').width]);
    thu(c2[0] === 390 && Math.abs(c2[1] - Math.round(390 * k2)) <= 1, `đổi cỡ cửa sổ 1280 × 720: khung vẽ theo (${c2[1]} điểm)`);
  }
  await ctx.close();
}
thu(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
