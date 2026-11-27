// Bài thử Chợ Phiên dạng lưới (chủ dự án 26/11/2026 08:56: "chợ cũng sẽ hiển thị ở dạng lưới giống trong kho, chỉ khi ấn vào mới có thể xem
// và mua"): tab Mua là lưới ô khung theo phẩm, giá dưới ô, chưa chạm thì không có nút Mua; chạm ô mới hiện tấm chi tiết (tên, chỉ số, người
// bán, giá) và nút Mua; chạm lại / ✕ thì đóng. Tab Bán: lưới đồ trong túi, chạm ô mới hiện ô nhập giá. Máy chủ chợ giả bằng page.route.
// Chạy ở gốc kho: node tools/kiem/cho-luoi.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8799;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => { if (!/game\.online\./.test(e.message)) errs.push(e.message); });   // game.online giả trong bài này
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const mon = (uid, rarity, plus) => ({ uid, base: 'thien-mach-kiem', rarity, lvl: 10, main: { atk: 32 }, plus, lines: [{ s: 'atk', t: 0, v: 4 }], cap: 3, sockets: [null, null, null], el: 'hoa' });
const ROWS = [
  { id: 11, loai: 'mon', mon: mon(5001, 'thien', 7), gia: 120000, ten: 'Người Bán A', la_toi: false },
  { id: 12, loai: 'nl', mon: { id: 'linh-thao', n: 30 }, gia: 900, ten: 'Người Bán B', la_toi: false },
  { id: 13, loai: 'mon', mon: mon(5002, 'pham', 0), gia: 500, ten: 'Tôi', la_toi: true },
];
await p.route('**/rest/v1/rpc/**', r => {
  const fn = r.request().url().split('/rpc/')[1].split('?')[0];
  const body = fn === 'p2d_xem_cho' ? ROWS : fn === 'p2d_cho_mo_trang_thai' ? {} : [];
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
for (let i = 0; i < 40 && await p.evaluate(() => window.__game.dialog.open); i++) {
  const c = await p.$('#dlg-choices .choice');
  if (c && await c.isVisible()) await c.tap().catch(() => {}); else await p.mouse.click(195, 760);
  await p.waitForTimeout(250);
}
await p.evaluate(() => {
  const g = window.__game; g.closeAll?.();
  g.online = true; g.cloud = g.cloud || {}; g.cloud.run = fn => fn();
  g.save.bag.push({ uid: 7001, base: 'thien-mach-kiem', rarity: 'dia', lvl: 8, main: { atk: 20 }, plus: 2, lines: [], cap: 3, sockets: [null], el: 'hoa' });
  g.openMarket();
});
await p.waitForSelector('#market-list .mk-luoi', { timeout: 8000 });
await p.waitForTimeout(400);
const dem = sel => p.$$eval(sel, e => e.length);
thu(await dem('#market-list .mk-luoi .mk-o .sv-stk') === 2, 'tab Mua: 2 ô hàng người khác (hàng của mình không lẫn vào)');
thu(await dem('#market-list .mk-tam') === 0 && await dem('#market-list button.mini') === 0, 'chưa chạm ô: không có tấm chi tiết, không có nút Mua');
const gia = await p.$$eval('#market-list .mk-o-gia', e => e.map(x => x.textContent));
thu(gia.includes('120.000') && gia.includes('900'), 'giá nằm dưới ô: ' + gia.join(', '));
const khung = await p.$$eval('#market-list .mk-o .sv-stk', e => e.map(x => x.dataset.o));
thu(khung[0] && khung[0] !== khung[1], 'ô có mã khung theo phẩm (data-o): ' + khung.join(', '));
thu(await p.$eval('#market-list .mk-o .sv-stk', e => getComputedStyle(e).backgroundImage.includes('ui-pc-')), 'ô có ảnh khung phẩm như Kho');
await p.tap('#market-list .mk-o .sv-stk');
await p.waitForTimeout(250);
const tam = await p.$eval('#market-list .mk-tam', e => e.textContent).catch(() => '');
thu(tam.includes('Người Bán A') && tam.includes('120.000'), 'chạm ô: tấm chi tiết có người bán, giá');
thu(await dem('#market-list .mk-tam .item-stats, #market-list .mk-tam [class*="stat"]') > 0 || tam.length > 60, 'tấm chi tiết có chỉ số món');
thu(await p.$eval('#market-list .mk-tam .mini', e => e.textContent) === 'Mua', 'tấm chi tiết có nút Mua');
await p.tap('#market-list .mk-tam-x');
await p.waitForTimeout(200);
thu(await dem('#market-list .mk-tam') === 0, '✕ đóng tấm chi tiết');
await p.tap('#market-list .mk-o:nth-child(2) .sv-stk');
await p.waitForTimeout(200);
thu((await p.$eval('#market-list .mk-tam', e => e.textContent).catch(() => '')).includes('Linh Thảo'), 'ô nguyên liệu: chi tiết đúng món');
await p.tap('#market-list .mk-o:nth-child(2) .sv-stk');
await p.waitForTimeout(200);
thu(await dem('#market-list .mk-tam') === 0, 'chạm lại ô đang mở thì đóng');
await p.tap('#market-tabs [data-tab="mine"]');
await p.waitForTimeout(500);
await p.tap('#market-list .mk-o .sv-stk');
await p.waitForTimeout(200);
thu(await p.$eval('#market-list .mk-tam .mini', e => e.textContent).catch(() => '') === 'Thu về', 'tab Của tôi: chạm ô hiện nút Thu về');
await p.tap('#market-tabs [data-tab="sell"]');
await p.waitForTimeout(400);
thu(await dem('#market-list .mk-luoi .mk-o .sv-stk') >= 1 && await p.$eval('#market-form', e => e.hidden), 'tab Bán: lưới đồ trong túi, chưa chọn thì ẩn ô nhập giá');
await p.tap('#market-list .mk-o .sv-stk');
await p.waitForTimeout(250);
thu(!await p.$eval('#market-form', e => e.hidden) && await dem('#market-list .mk-tam') === 1, 'tab Bán: chạm ô hiện chi tiết + ô nhập giá');
if (process.env.ANH) await p.screenshot({ path: process.env.ANH });
thu(!errs.length, 'không lỗi JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
await b.close(); server.close();
console.log(hong ? `HỎNG ${hong} mục` : 'Đạt hết');
process.exit(hong ? 1 : 0);
