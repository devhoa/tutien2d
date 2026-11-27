// Bài thử PHÁP TRẬN TRUYỀN TỐNG (chủ dự án 23/11/2026 19:31: mỗi khu một pháp trận; chạy vào trận có nút Dịch chuyển như nút Đả tọa; mở Tinh
// đồ chọn tinh cầu; cột sáng quanh trận chọc lên trời 2–5 giây rồi tới tinh cầu mới; tinh cầu mới tải NGAY trong lúc trận chạy, không truyền
// xong mới tải). Khách vào game (bản lưu giữa game, đã tới các tinh cầu), đứng giữa trận Thiên Kiếm Tinh:
//   1. nút hành động là Dịch chuyển; ra khỏi trận thì không
//   2. bấm: Tinh đồ mở chế độ truyền tống (tiêu đề, không tab Tinh cầu này); chạm Xích Diễm Tinh, nút trên thẻ là Dịch chuyển
//   3. trận chạy: người đứng yên giữa trận, có cảnh cột sáng, không đi được; tới nơi trong min…max giây (src/game/truyen-tong.js)
//   4. tới nơi: KHÔNG có màn che Đang tải khung nào, đứng giữa trận bên kia, có cảnh cột sáng giáng, chốc lát sau đi được
//   4b. Bản đồ chỉ để xem (23/11/2026 "Bỏ bay ở Tinh hệ"): thẻ tinh cầu là Tới pháp trận, đi bộ tới trận rồi Tinh đồ truyền tống tự mở chọn sẵn;
//       giữa trận thì Dịch chuyển; truyện bảo sang tinh cầu khác thì mũi tên trỏ trận
//   5. mạng chậm (ảnh trả chậm): trận chạy lâu hơn chờ ảnh, tới nơi vẫn không màn che
//   6. gục giữa lúc trận chạy: trận tan, không bị đưa đi
// Chạy ở gốc kho hoặc trong bản đã gói: node tools/kiem/truyen-tong.thu.mjs   (cần playwright; NODE_PATH nếu cài chỗ khác)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const visited = Object.fromEntries(['thien-kiem-phong', 'thanh-khe', 'dao-xich-dien', 'dao-han-bang', 'hac-phong-dao', 'dao-moc', 'dao-thien-kim', 'dao-hau-tho'].map(k => [k, true]));
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'moc', weapon: 'kiem', realm: 4, layer: 6, qi: 0, gioi: 'nu', flags: { 'dong-phu': true, 'na-thuc': true }, visited,
  tiem: { toc: 'nhan', goc: { atk_pct: 2, hp_pct: 2, def_pct: 2 }, cong: {}, max: 4 } };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
let cham = 0;   // ms trả chậm ảnh (mục 5)
await ctx.route(/\/assets\/.*\.(png|webp)(\?|$)/, async r => { if (cham) await new Promise(ok => setTimeout(ok, cham)); r.continue(); });
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(600);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
// hội thoại truyện, bảng chọn của Hệ Thống: thôi hiện (bài này chỉ thử pháp trận); bảng nào bật lên giữa chừng thì đóng (trừ Tinh đồ đang thử)
await p.evaluate(() => {
  const g = window.__game, d = g.dialog;
  for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
  const tat = () => { d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; if (document.getElementById('world')?.hidden) { g.closeAll?.(); g.uiOpen = false; } for (const e of document.querySelectorAll('.ht-back')) e.hidden = true; };
  tat(); setInterval(tat, 250);
});
await p.waitForFunction(() => !window.__game.cheMan, null, { timeout: 20000 }).catch(() => {});

let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const dung = (dx = 0, dy = 0) => p.evaluate(([dx, dy]) => { const g = window.__game, tr = window.__thu.tranCua(g); g.player.x = tr.x + dx; g.player.y = tr.y + dy; g.player.meditating = false; return { x: tr.x, y: tr.y, r: tr.r }; }, [dx, dy]);
const nhan = () => p.evaluate(() => ({ act: window.__game.actLabel, nut: document.querySelector('#btn-act')?.textContent, an: document.querySelector('#btn-act')?.hidden }));
// Chạm một tinh cầu trên Tinh đồ. Lần mở đầu trong phiên chữ, khung còn đổi cỡ nên chỗ vẽ tinh cầu xê dịch (máy chậm thì lâu hơn: chạm lệch, thẻ
// không hiện): chờ chỗ vẽ đứng yên rồi mới chạm, chưa trúng thì chạm lại (tối đa 3 lần). Trả true nếu thẻ đúng tinh cầu đó.
async function chonTinh(id, ten) {
  await p.evaluate(() => document.fonts?.ready);
  for (let lan = 0; lan < 3; lan++) {
    let a = null;
    for (let k = 0; k < 12; k++) {
      const b = await p.evaluate(id => { const pt = window.__game.worldMap.pts.find(q => q.b.map === id), r = document.querySelector('#world-sky canvas').getBoundingClientRect(); return pt && { x: r.left + pt.x, y: r.top + pt.y }; }, id);
      if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < 0.5) break;
      a = b; await p.waitForTimeout(250);
    }
    if (a) await p.mouse.click(a.x, a.y);
    await p.waitForTimeout(350);
    if (await p.evaluate(() => document.querySelector('#world-card b')?.textContent) === ten) return true;
  }
  return false;
}

// 1. nút Dịch chuyển giữa trận, ra ngoài thì không
const tk = await dung();
thu(!!tk, `Thiên Kiếm Tinh có pháp trận (tâm ${Math.round(tk.x)}, ${Math.round(tk.y)}, vùng đứng ${Math.round(tk.r)})`);
await p.waitForTimeout(400);
let n = await nhan();
thu(n.act === 'Dịch chuyển' && n.nut === 'Dịch chuyển' && !n.an, `đứng giữa trận: nút hành động "${n.nut}"`);
await dung(tk.r * 2.6, 0); await p.waitForTimeout(400); n = await nhan();
thu(n.act !== 'Dịch chuyển', `ra khỏi vùng giữa trận: nút "${n.act}"`);
await dung(); await p.waitForTimeout(400);

// 2. Tinh đồ chế độ truyền tống, chạm Xích Diễm Tinh
await p.tap('#btn-act');
await p.waitForSelector('#world:not([hidden])', { timeout: 5000 }).catch(() => {});
await p.waitForTimeout(900);
const tinhDo = await p.evaluate(() => ({ mo: !document.querySelector('#world').hidden, ten: document.querySelector('#world-title').textContent, tab: [...document.querySelectorAll('.world-tabs button')].map(x => !x.hidden) }));
thu(tinhDo.mo && tinhDo.ten === 'Pháp Trận Truyền Tống', `bấm Dịch chuyển mở Tinh đồ chế độ truyền tống ("${tinhDo.ten}")`);
thu(tinhDo.tab[0] === false, 'không có tab Tinh cầu này');
await chonTinh('dao-xich-dien', 'Xích Diễm Tinh');
const nut = await p.evaluate(() => { const x = document.querySelector('#world-card .wc-go'); return x && { chu: x.textContent, tat: x.disabled, tt: x.classList.contains('wc-tt') }; });
thu(nut && nut.chu === 'Dịch chuyển' && !nut.tat && nut.tt, `thẻ Xích Diễm Tinh: nút "${nut?.chu}"${nut?.tat ? ' (bị khoá)' : ''}`);

// 3. trận chạy
const t0 = Date.now();
await p.tap('#world-card .wc-go');
await p.waitForTimeout(150);
const dangChay = await p.evaluate(() => { const g = window.__game; return { tt: !!g.tt, fx: (g.ttFx || []).some(f => f.loai === 'di' && f.own), dong: document.querySelector('#world').hidden, map: g.map.id }; });
thu(dangChay.tt && dangChay.fx && dangChay.dong && dangChay.map === 'thien-kiem-phong', 'bấm Dịch chuyển: Tinh đồ đóng, trận khởi, có cảnh cột sáng');
await p.waitForTimeout(700);
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
const giua = await p.evaluate(() => { const g = window.__game, tr = window.__thu.tranCua(g); return { d: Math.hypot(g.player.x - tr.x, g.player.y - tr.y), tt: !!g.tt, map: g.map.id, act: g.actLabel }; });
thu(giua.tt && giua.map === 'thien-kiem-phong' && giua.d < 2, `trận đang chạy: người đứng yên giữa trận dù bấm đi (lệch ${giua.d.toFixed(1)})`);
thu(!giua.act, 'trận đang chạy: nút hành động ẩn');
// theo dõi từng khung tới lúc sang nơi mới: lúc sang có màn che không, đã tải xong chưa
const ket = await p.evaluate(() => new Promise(ok => {
  const g = window.__game, bd = performance.now(), che = [];
  let toi = 0;
  const tick = () => {
    const now = performance.now();
    if (!toi && g.map.id === 'dao-xich-dien') toi = now;
    if (toi) che.push(!!g.cheMan);
    if (toi && now - toi > 1500) { ok({ ms: toi - bd, che: che.filter(Boolean).length, khung: che.length }); return; }
    if (now - bd > 20000) { ok({ ms: -1, che: 0, khung: 0 }); return; }
    requestAnimationFrame(tick);
  };
  tick();
}));
const giay = (Date.now() - t0) / 1000;
const lan = await p.evaluate(() => window.__game.ttLan);
thu(ket.ms > 0 && lan?.to === 'dao-xich-dien', `tới Xích Diễm Tinh (bấm tới lúc tới ${giay.toFixed(1)} giây)`);
thu(lan && lan.t >= 2 && lan.t <= 5.6, `trận chạy ${lan?.t} giây (2–5 giây và lúc bùng sáng)`);
thu(ket.khung > 0 && ket.che === 0, `tới nơi không có màn che Đang tải (${ket.che}/${ket.khung} khung bị che)`);
const toi = await p.evaluate(() => { const g = window.__game, tr = window.__thu.tranCua(g); return { d: tr ? Math.hypot(g.player.x - tr.x, g.player.y - tr.y) : 99, den: (g.ttFx || []).length, tt: !!g.tt, trav: g.traveling }; });
thu(toi.d < 2, `đứng giữa pháp trận Xích Diễm Tinh (lệch ${toi.d.toFixed(1)})`);
await p.waitForTimeout(300);
const x0 = await p.evaluate(() => window.__game.player.x);
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
const x1 = await p.evaluate(() => window.__game.player.x);
const sau = await p.evaluate(() => ({ tt: !!window.__game.tt, trav: window.__game.traveling }));
thu(!sau.tt && !sau.trav && x1 - x0 > 5, `tới nơi chốc lát là đi được (đi ${(x1 - x0).toFixed(0)} đơn vị)`);

// 4b. Bản đồ chỉ để xem (chủ dự án 23/11/2026 21:41 "Bỏ bay ở Tinh hệ"): nút Bản đồ → Tinh hệ → thẻ tinh cầu là Tới pháp trận (đi bộ tới giữa
// trận, tới nơi Tinh đồ truyền tống mở chọn sẵn nơi đã chọn); đứng giữa trận rồi thì Dịch chuyển; truyện bảo sang tinh cầu khác thì mũi tên trỏ trận
await p.evaluate(() => { const g = window.__game; g.save.visited['dao-han-bang'] = true; });
const xa = await p.evaluate(() => {   // ô đi được cách tâm trận 5–9 ô (loang từ tâm trận nên chắc đi tới được)
  const g = window.__game, m = g.map, tr = window.__thu.tranCua(g), T = m.T, x0 = Math.floor(tr.x / T), y0 = Math.floor(tr.y / T), seen = new Set([y0 * m.w + x0]), hang = [[x0, y0]];
  while (hang.length) {
    const [x, y] = hang.shift(), d = Math.hypot(x - x0, y - y0);
    if (d >= 5 && d <= 9) { const c = m.center(x, y); g.player.x = c.x; g.player.y = c.y; return { d, trong: window.__thu.trongTran(g) }; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(ny * m.w + nx) || m.solidTile(nx, ny)) continue; seen.add(ny * m.w + nx); hang.push([nx, ny]); }
  }
  return null;
});
thu(xa && !xa.trong, `đứng cách trận ${xa?.d?.toFixed?.(1)} ô, ngoài vùng đứng`);
const moBanDo = () => p.evaluate(() => { document.getElementById('btn-world').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); document.querySelector('.world-tabs button[data-mode="sys"]')?.click(); });
const theTinh = () => p.evaluate(() => { const c = document.querySelector('#world-card'), x = c?.querySelector('.wc-go:last-of-type'); return { ten: c?.querySelector('b')?.textContent, chu: x?.textContent, tat: x?.disabled, tt: x?.classList.contains('wc-tt'), ghi: c?.querySelector('.wc-ghi')?.textContent || '', bay: [...(c?.querySelectorAll('button') || [])].some(e => /Bay tới/.test(e.textContent)), mo: !document.querySelector('#world').hidden, tieuDe: document.querySelector('#world-title').textContent }; });
await moBanDo(); await p.waitForTimeout(700);
await chonTinh('dao-han-bang', 'Hàn Băng Tinh');
let the = await theTinh();
thu(the.mo && the.ten === 'Hàn Băng Tinh' && the.chu === 'Tới pháp trận' && !the.tat && the.tt && !the.bay && !!the.ghi, `Bản đồ → Tinh hệ → Hàn Băng Tinh: nút "${the.chu}", không có Bay tới, dòng "${the.ghi}"`);
await p.tap('#world-card .wc-go:last-of-type');
await p.waitForTimeout(300);
const diBo = await p.evaluate(() => { const g = window.__game; return { di: !!g.diToi, dong: document.querySelector('#world').hidden, map: g.map.id, tt: !!g.tt }; });
thu(diBo.di && diBo.dong && diBo.map === 'dao-xich-dien' && !diBo.tt, 'bấm Tới pháp trận: Bản đồ đóng, nhân vật tự đi bộ, chưa đi tinh cầu nào');
const toiTran = await p.waitForFunction(() => window.__thu.trongTran(window.__game) && !document.querySelector('#world').hidden, null, { timeout: 15000 }).then(() => true).catch(() => false);
await p.waitForTimeout(400);
the = await theTinh();
thu(toiTran && the.tieuDe === 'Pháp Trận Truyền Tống' && the.ten === 'Hàn Băng Tinh' && the.chu === 'Dịch chuyển' && !the.tat, `tới giữa trận: Tinh đồ truyền tống tự mở, chọn sẵn "${the.ten}", nút "${the.chu}"`);
await p.tap('#world-close'); await p.waitForTimeout(400);
await moBanDo(); await p.waitForTimeout(700);
await chonTinh('dao-han-bang', 'Hàn Băng Tinh');
the = await theTinh();
thu(the.tieuDe !== 'Pháp Trận Truyền Tống' && the.chu === 'Dịch chuyển' && !the.tat && the.tt, `đứng giữa trận, mở Bản đồ thường: nút "${the.chu}" (truyền tống luôn)`);
await p.tap('#world-close'); await p.waitForTimeout(300);
const muiTen = await p.evaluate(() => {
  const g = window.__game, cu = { step: g.save.step, done: g.save.stepDone }, i = g.data.story.steps.findIndex(s => s.id === 'nv-han-bang');
  g.save.step = i; g.save.stepDone = true;
  const goal = g.story.goal(), t = window.__thu.guideTarget(g), tr = window.__thu.tranCua(g);
  g.save.step = cu.step; g.save.stepDone = cu.done;
  return { chu: goal?.text, toi: goal?.toi, lech: t ? Math.hypot(t.x - tr.x, t.y - tr.y) : -1 };
});
thu(muiTen.toi === 'dao-han-bang' && muiTen.lech >= 0 && muiTen.lech < 1 && /truyền tống/.test(muiTen.chu || ''), `truyện "${muiTen.chu}": mũi tên trỏ giữa pháp trận Xích Diễm Tinh (lệch ${muiTen.lech})`);

// 5. mạng chậm: ảnh Hàn Băng Tinh trả chậm 0,45 giây mỗi tấm (6 đường tải song song: vài giây mới đủ); trận chờ tải xong mới sang, không màn che
await p.evaluate(() => { const g = window.__game; g.save.visited['dao-han-bang'] = true; });
await dung(); await p.waitForTimeout(300);
cham = 450;
const t1 = Date.now();
const chay = await p.evaluate(() => { const g = window.__game, b = window.__game.worldMap.pts.find(q => q.b.map === 'dao-han-bang')?.b || { map: 'dao-han-bang', name: 'Hàn Băng Tinh' }; return window.__thu.batDauTruyen(g, b); });
const ket2 = await p.evaluate(() => new Promise(ok => {
  const g = window.__game, bd = performance.now(), che = [];
  let toi = 0, tai = null;
  const tick = () => {
    const now = performance.now();
    if (g.tt && !g.tt.den) tai = g.tt.td;
    if (!toi && g.map.id === 'dao-han-bang') toi = now;
    if (toi) che.push(!!g.cheMan);
    if (toi && now - toi > 1500) { ok({ ms: toi - bd, che: che.filter(Boolean).length, khung: che.length, tai }); return; }
    if (now - bd > 25000) { ok({ ms: -1, che: 0, khung: 0, tai }); return; }
    requestAnimationFrame(tick);
  };
  tick();
}));
cham = 0;
const lan2 = await p.evaluate(() => window.__game.ttLan);
thu(chay && ket2.ms > 0 && lan2?.to === 'dao-han-bang', `mạng chậm: vẫn tới Hàn Băng Tinh (trận chạy ${lan2?.t} giây, bấm tới lúc tới ${((Date.now() - t1) / 1000).toFixed(1)} giây)`);
thu(ket2.tai?.chinh >= 1, `mạng chậm: lúc bùng sáng nền và đồ nơi đến đã tải xong (phần chính ${ket2.tai?.chinh?.toFixed?.(2)}, NPC/quái ${ket2.tai?.phu?.toFixed?.(2)})`);
thu(ket2.khung > 0 && ket2.che === 0, `mạng chậm: tới nơi không có màn che Đang tải (${ket2.che}/${ket2.khung} khung)`);

// 6. gục giữa lúc trận chạy: trận tan, không bị đưa đi
await p.waitForTimeout(800);
await dung(); await p.waitForTimeout(300);
await p.evaluate(() => { const g = window.__game, b = window.__game.worldMap.pts.find(q => q.b.map === 'dao-xich-dien')?.b || { map: 'dao-xich-dien', name: 'Xích Diễm Tinh' }; window.__thu.batDauTruyen(g, b); });
await p.waitForTimeout(600);
await p.evaluate(() => { window.__game.player.hp = 0; });
await p.waitForTimeout(3500);
const tan = await p.evaluate(() => ({ tt: !!window.__game.tt, map: window.__game.map.id, trav: window.__game.traveling }));
thu(!tan.tt && tan.map === 'dao-han-bang', `gục lúc trận chạy: trận tan, vẫn ở ${tan.map}`);

thu(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
