// Bài thử Tinh đồ hai hệ mặt trời (chủ dự án 26/11/2026 00:17: Thiên Kiếm Tinh ở giữa, hai bên hai hệ, tràn màn thì vuốt kéo), trên bản đã gói,
// chơi khách màn dọc: mở Tinh đồ thì canh vào tinh cầu đang đứng; thế giới rộng hơn màn; vuốt ngang tới hệ thứ hai (Huyền Nhật + sáu tinh cầu
// mới), chạm tinh cầu sau khi vuốt vẫn chọn đúng; chạm mũi tên mép thì lướt; vuốt tới hệ cũ (Linh Nhật); tab "Tinh cầu này" không bị kéo lệch;
// nút Dịch chuyển trên thẻ đưa tới tinh cầu mới thật; không lỗi JS. Chạy: cd _site && node ../tools/kiem/tinh-do-hai-he.thu.mjs   (ANH=<thư mục> để chụp hình)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8812, ANH = process.env.ANH || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const sm = JSON.parse(await readFile(join(process.cwd(), 'data/starmap.json'), 'utf8')), N = sm.tv.ngang;
const MOI = sm.bodies.filter(b => b.he === 2).map(b => b.map);
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
thu(N.rong > 1920 && N.vong.L > 0 && N.he.sun.length === 2 && !!sm.sun2, `dữ liệu: thế giới rộng ${N.rong}, kết giới viên thuốc (L ${N.vong.L}), hai mặt trời`);
thu(MOI.length === 6 && MOI.every(id => N.pos[id]) && Math.abs(N.pos['thien-kiem-phong'][0] - N.rong / 2) < 2, 'dữ liệu: sáu tinh cầu mới có chỗ trên Tinh đồ, Thiên Kiếm Tinh ở chính giữa');
const b = await chromium.launch(), errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: 3, layer: 9, qi: 0, gioi: 'nam', flags: { 'dong-phu': true, 'na-thuc': true },
  visited: { 'thien-kiem-phong': true, 'thanh-khe': true }, ht: { intro: 1 },
  tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 }, theChat: 'moc-linh' };   // đã thức tỉnh huyết mạch, thể chất: bài này chạm thật nên máy tính là "có mặt", chưa thức tỉnh thì màn lễ che Tinh đồ giữa chừng
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(600);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
const quaThoai = () => p.evaluate(() => { const g = window.__game;   // thoại, bảng lúc vào game: cho qua
  if (g.dialog.open) { const c = document.querySelector('#dlg-choices .choice'); if (c && c.offsetParent) c.click(); else document.querySelector('#dialog')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
  for (const e of document.querySelectorAll('.ht-back')) e.click(); return g.dialog.open; });
for (let i = 0; i < 30 && (await quaThoai() || i < 4); i++) await p.waitForTimeout(300);
// Tinh cầu tông môn giả như trên máy chủ thật (cấp tới 5: kết giới nở, thế giới rộng thêm, tinh cầu sát mép hơn)
await p.evaluate(() => { const sm = window.__game.data.starmap; sm.kinds.khai ??= 'Khai hoang';
  [[4, 'tuyet', 0], [1, 'cat', 20], [4, 'tuyet', 52], [1, 'tro', 105], [5, 'rung', 137], [3, 'da-den', 190], [3, 'hau-tho', 242], [3, 'co', 275], [2, 'da-den', 327]].forEach(([cap, mat, goc], i) =>
    sm.bodies.push({ kh: true, map: 'kh-thu-' + i, name: 'Tông thử ' + (i + 1), kind: 'khai', orbit: 6, cap, ground: mat, angle: goc, size: 3 + cap, color: '#9a8aff', realm: 2, desc: 'thử' })); });
await p.evaluate(() => document.querySelector('#btn-world').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
await p.waitForTimeout(400);
await p.evaluate(() => [...document.querySelectorAll('.world-tabs button')].find(x => x.dataset.mode === 'sys').click());
await p.waitForTimeout(900);
const xem = () => p.evaluate(() => { const m = window.__game.worldMap, v = m.view, c = document.querySelector('#world-sky canvas'), r = c.getBoundingClientRect();
  return { x: v.x, ex: v.ex, z: v.z, w: c.clientWidth, h: c.clientHeight, l: r.left, t: r.top, sel: m.sel?.map || m.sel?.id || null, pts: Object.fromEntries(m.pts.flatMap(q => [[q.b.id, [q.x, q.y]], [q.b.map || q.b.id, [q.x, q.y]]])) }; });
const trong = (v, id) => !!v.pts[id] && v.pts[id][0] > 0 && v.pts[id][0] < v.w;
const keo = async dx => { const v = await xem(), x = v.l + v.w / 2, y = v.t + v.h * 0.78;
  await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(x + dx * i / 10, y); await p.mouse.up(); await p.waitForTimeout(350); };
let v = await xem();
thu(v.ex > 100 && v.z === 1, `thế giới rộng hơn màn: kéo ngang được ${Math.round(v.ex)} điểm mỗi bên`);
thu(trong(v, 'thien-kiem-phong') && Math.abs(v.pts['thien-kiem-phong'][0] - v.w / 2) < 14, 'mở Tinh đồ: canh vào Thiên Kiếm Tinh (đang đứng), ở giữa màn');
if (ANH) await p.screenshot({ path: `${ANH}/tinh-do-giua.png` });
await keo(-900);
v = await xem();
thu(Math.abs(v.x + v.ex) < 2, 'vuốt hết sang trái: dừng đúng mép phải của thế giới');
thu(trong(v, 'sun2') && MOI.filter(id => trong(v, id)).length >= 5 && !trong(v, 'sun'), `hệ thứ hai: thấy Huyền Nhật và ${MOI.filter(id => trong(v, id)).length} / 6 tinh cầu mới, không còn thấy Linh Nhật`);
if (ANH) await p.screenshot({ path: `${ANH}/tinh-do-phai.png` });
// Lục Dã Tinh lúc này nằm sát mép trái, ngay chỗ mũi tên: chạm trúng nó là CHỌN nó, không lướt (lỗi soát được trên bản thật 26/11/2026)
{ const q = v.pts['tc-luc-da'], x0 = v.x; await p.mouse.click(v.l + q[0], v.t + q[1]); await p.waitForTimeout(700);
  const u = await xem();
  thu(q[0] < 34 && u.sel === 'tc-luc-da' && Math.abs(u.x - x0) < 2, `chạm Lục Dã Tinh sát mép trái (cách mép ${Math.round(q[0])} điểm): chọn nó, bản đồ đứng yên`);
  v = u; }
{ const q = v.pts['tc-thuy-lam']; await p.mouse.click(v.l + q[0], v.t + q[1]); await p.waitForTimeout(300); }
v = await xem();
const the = await p.evaluate(() => document.querySelector('#world-card')?.textContent || document.querySelector('.world-card')?.textContent || '');
thu(v.sel === 'tc-thuy-lam' && the.includes('Thúy Lâm'), 'chạm Thúy Lâm Tinh sau khi vuốt: chọn đúng, thẻ hiện tên');
if (ANH) await p.screenshot({ path: `${ANH}/tinh-do-chon.png` });
// Dịch chuyển thật bằng nút trên thẻ (đang đứng giữa pháp trận Thiên Kiếm Tinh): tới Thúy Lâm Tinh, mở lại Tinh đồ thì canh sang hệ thứ hai
{
  const nut = await p.evaluate(() => { const x = document.querySelector('#world-card .wc-go:last-of-type'); return x && { chu: x.textContent, tat: x.disabled }; });
  await p.tap('#world-card .wc-go:last-of-type');
  const toi = await p.waitForFunction(() => window.__game.map?.id === 'tc-thuy-lam' && !window.__game.traveling && !window.__game.trip && !window.__game.tt, null, { timeout: 40000 }).then(() => true, () => false);
  thu(nut && !nut.tat && toi, `nút "${nut?.chu}" trên thẻ: truyền tống tới Thúy Lâm Tinh`);
  for (let i = 0; i < 20 && (await quaThoai() || i < 3); i++) await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#btn-world').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await p.waitForTimeout(400);
  await p.evaluate(() => [...document.querySelectorAll('.world-tabs button')].find(x => x.dataset.mode === 'sys').click());
  await p.waitForTimeout(900);
  v = await xem();
  thu(trong(v, 'tc-thuy-lam') && trong(v, 'sun2') && v.x < -v.ex * 0.6, 'mở Tinh đồ ở Thúy Lâm Tinh: canh sang hệ thứ hai');
  await keo(-900); v = await xem();
}
await p.mouse.click(v.l + v.w * 0.5, v.t + v.h * 0.04); await p.waitForTimeout(200);   // chạm chỗ trống: đóng thẻ
{ const x0 = v.x, trong_mep = Object.values(v.pts).filter(q => q[0] < 60).map(q => q[1]), ys = [0.5, 0.3, 0.7, 0.15, 0.85].map(k => v.h * k).filter(yy => trong_mep.every(py => Math.abs(py - yy) > 40));   // chỗ ở mép trái không trúng thiên thể nào
  // Máy CI chậm (26/11/2026, PR #827 lần chạy hai: "lướt sang trái 0 điểm" dù lần chạy trước của cùng mã đạt): lần chạm đầu có khi chỉ kịp đóng thẻ
  // đang mở, hoặc 1,4 giây chưa đủ cho khung hình lướt. Chờ theo trạng thái (tối đa 3 giây mỗi lần chạm), chưa lướt thì chạm lại ở chỗ trống khác.
  for (const y of (ys.length ? ys : [v.h * 0.5]).slice(0, 3)) {
    await p.mouse.click(v.l + 12, v.t + y);
    for (let i = 0; i < 12 && !(v.x > x0 + v.w * 0.6); i++) { await p.waitForTimeout(250); v = await xem(); }
    if (v.x > x0 + v.w * 0.6) break;
  }
  thu(v.x > x0 + v.w * 0.6, `chạm mũi tên mép trái: lướt sang trái ${Math.round(v.x - x0)} điểm`); }
// Máy chậm (27/11/2026: CI PR #832 và máy làm việc trượt ở đây cả trên main): vuốt chưa tới mép thì vuốt thêm, chờ khung hình theo kịp (tối đa 5 lần)
for (let i = 0; i < 5; i++) { await keo(900); for (let j = 0; j < 6; j++) { v = await xem(); if (Math.abs(v.x - v.ex) < 2) break; await p.waitForTimeout(200); } if (Math.abs(v.x - v.ex) < 2) break; }
v = await xem();
thu(Math.abs(v.x - v.ex) < 2 && trong(v, 'sun') && trong(v, 'ma-vuong') && !trong(v, 'sun2'), 'vuốt hết sang phải: hệ cũ, thấy Linh Nhật và Ma Vương Tinh');
if (ANH) await p.screenshot({ path: `${ANH}/tinh-do-trai.png` });
await p.evaluate(() => [...document.querySelectorAll('.world-tabs button')].find(x => x.dataset.mode === 'here').click());
await p.waitForTimeout(500);
await keo(-200);
v = await xem();
thu(v.x === 0 && v.z === 1, 'tab "Tinh cầu này": không phóng to thì không kéo lệch được');
thu(!errs.length, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n❌ ${hong} chỗ hỏng` : '\n✅ Tinh đồ hai hệ: canh chỗ đứng, vuốt kéo, chạm chọn, mũi tên mép đều chạy');
process.exit(hong ? 1 : 0);
