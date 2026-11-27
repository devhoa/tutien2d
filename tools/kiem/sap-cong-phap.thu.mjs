// Bài thử CSKH 25/11/2026 (chủ dự án chọn): (1) Sắp xếp giao diện: kéo một khung đè lên giữa màn thì nút Lưu / Huỷ vẫn bấm được
// (trước: khung nằm trên thanh nút, người chơi kẹt không thoát ra được, CSKH #223); (2) bản lưu đã đi truyện mà thiếu công pháp
// khởi đầu (truyện Trấn Ma Kỷ 21/11 bỏ bước tặng Kiếm Tông Tâm Pháp, CSKH #224) thì vào game tự nhận (src/game/game.js pendingTech).
// Chạy ở gốc kho: node tools/kiem/sap-cong-phap.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797;
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

// (1) Sắp xếp giao diện
await p.evaluate(() => { window.__game.closeAll?.(); window.__game.openSapXep(); });
await p.waitForSelector('.sap-root:not([hidden]) .sap-box', { timeout: 5000 });
// Khung chỉ có chỗ, có cỡ sau khung hình đầu (openSapXep: build() rồi requestAnimationFrame(paint)): chờ nó vẽ xong mới đo, kẻo máy chậm
// (CI) bấm vào khung chưa có cỡ, không kéo được gì (PR #807 trượt đúng chỗ này, tái hiện bằng cách làm chậm khung hình đầu 0,6 giây).
await p.waitForFunction(() => { const r = document.querySelector('.sap-box')?.getBoundingClientRect(); return r && r.width > 40 && r.height > 20; }, null, { timeout: 10000 });
const keo = await p.evaluate(() => {   // dời khung đầu tiên cho tâm nó trùng tâm thanh nút
  const box = document.querySelector('.sap-box'), bar = document.querySelector('.sap-bar');
  const a = box.getBoundingClientRect(), c = bar.getBoundingClientRect();
  return { x: a.x + a.width / 2, y: a.y + a.height / 2, tx: c.x + c.width / 2, ty: c.y + c.height / 2 };
});
await p.mouse.move(keo.x, keo.y); await p.mouse.down(); await p.mouse.move(keo.tx, keo.ty, { steps: 8 }); await p.mouse.up();
const de = await p.evaluate(() => {
  const bar = document.querySelector('.sap-bar'), r = bar.getBoundingClientRect();
  const box = [...document.querySelectorAll('.sap-box')].some(x => { const q = x.getBoundingClientRect(); return q.x < r.right && q.right > r.x && q.y < r.bottom && q.bottom > r.y; });
  const btns = [...bar.querySelectorAll('button')];
  const tren = btns.every(n => { const q = n.getBoundingClientRect(); return bar.contains(document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2)); });
  return { box, tren, n: btns.length };
});
thu(de.box, 'có khung đè lên thanh nút (đúng cảnh khách gặp)');
thu(de.n >= 3 && de.tren, 'khung đè lên mà mọi nút Lưu / Mặc định / Huỷ vẫn nằm trên cùng');
const nutHuy = (await p.$$('.sap-bar button')).at(-1);
await nutHuy.click();
thu(await p.evaluate(() => document.querySelector('.sap-root').hidden), 'bấm Huỷ thoát được bảng Sắp xếp');

// (2) Công pháp khởi đầu
const st = await p.evaluate(() => window.__game.data.techniques.starter);
await p.evaluate(st => {
  const g = window.__game, s = g.save;
  s.step = Math.max(s.step, 30); s.techs = { 'loi-am-quyet': { lv: 10, exp: 0 } }; s.techSlots = ['loi-am-quyet'];
  delete s.techs[st]; g.persist?.(); g.saveNow?.();
}, st);
await p.waitForTimeout(1500);
await p.reload();
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(800);
if (await p.$('#btn-guest:not([disabled])')) await p.tap('#btn-guest').catch(() => {});
await p.waitForFunction(() => window.__game?.save && window.__game.player, null, { timeout: 30000 });
await p.waitForTimeout(1000);
const kq = await p.evaluate(st => { const s = window.__game.save; return { co: !!s.techs[st], cu: !!s.techs['loi-am-quyet'], cuLv: s.techs['loi-am-quyet']?.lv }; }, st);
thu(kq.cu && kq.cuLv === 10, 'bản lưu được giữ qua lần tải lại (công pháp cũ còn tầng 10)');
thu(kq.co, 'đã đi truyện mà thiếu Kiếm Tông Tâm Pháp: vào game tự nhận');
thu(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `HỎNG ${hong} mục` : 'ĐẠT hết');
process.exit(hong ? 1 : 0);
