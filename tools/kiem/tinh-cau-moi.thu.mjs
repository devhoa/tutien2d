// Bài thử sáu tinh cầu farm mới (chủ dự án 26/11/2026 00:17; tools/the-gioi/tinh_cau_moi.py), trên bản đã gói, chơi khách:
// vào từng tinh cầu: nền vẽ được, đứng đúng pháp trận, đủ 22 bãi quái của ĐÚNG MỘT loại, quái sống, bật Tự đánh thì hạ được quái,
// Tinh đồ cho tới (đủ tu vi) / chặn (thiếu tu vi) đúng luật, không lỗi JS. Chạy: cd _site && node ../tools/kiem/tinh-cau-moi.thu.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8811, ANH = process.env.ANH || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const doc = async f => JSON.parse(await readFile(join(process.cwd(), f), 'utf8'));
const cfg = await doc('data/config.json'), realms = await doc('data/realms.json'), sm = await doc('data/starmap.json');
const MOI = sm.bodies.filter(b => b.he === 2).map(b => b.map).filter(id => !process.env.CHI || id === process.env.CHI);
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
thu(MOI.length === 6 && MOI.every(id => cfg.maps.includes(id) && cfg.quai_chung.maps.includes(id)), `Tinh đồ có ${MOI.length} tinh cầu hệ thứ hai, đều trong danh sách bản đồ và quái chung`);
const b = await chromium.launch();
const errs = [];
// MỘT trình duyệt đi lần lượt qua sáu tinh cầu (26/11/2026: trước đây mỗi tinh cầu mở game lại một lần, bước này mất 95 giây trên CI,
// đẩy cả việc choi-thu quá giới hạn giờ). Tu vi đủ cho tinh cầu khó nhất.
const DS = [];
for (const id of MOI) DS.push({ id, m: await doc(`data/maps/${id}.json`), can: realms.map_open[id] || 0 });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: Math.max(1, ...DS.map(x => Math.floor(x.can / realms.layers) + 1)), layer: 9, qi: 0, gioi: 'nam',
  flags: { 'dong-phu': true, 'na-thuc': true }, visited: { 'thien-kiem-phong': true, 'thanh-khe': true },   // na-thuc: đã qua lễ Kết Anh (lễ tự mở sẽ dừng game giữa bài)
  ht: { intro: 1 }, tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 }, theChat: 'moc-linh' };
await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
const p = await ctx.newPage();
let dang = '';
p.on('pageerror', e => errs.push(`${dang}: ${e.message}`));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(600);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.evaluate(() => { window.__manh = true; setInterval(() => {   // thoại, bảng lúc vào game: cho qua (hộp thoại mở thì vòng game đứng chờ, quái không mọc)
  const g = window.__game;
  if (g.dialog.open) { const c = document.querySelector('#dlg-choices .choice'); if (c && c.offsetParent) c.click(); else document.querySelector('#dialog')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
  for (const e of document.querySelectorAll('.ht-back')) e.click();
  if (window.__manh && g.player?.st) { g.player.atk = g.player.st.atk = 5e5; g.player.maxHp = g.player.hp = 9e9; }   // bài thử đường đi bãi → Tự đánh → đếm quái, không thử cân bằng: người thử đánh một đòn chết quái, không gục (đặt cả player.atk: đòn đánh thường đọc số này; trước 26/11 chỉ đặt st.atk nên tinh cầu Trúc Cơ, Kim Đan mất 16–27 giây mới hạ được một con)
}, 300); });
await p.waitForTimeout(1200);
for (const { id, m } of DS) {
  dang = id;
  const loai = [...new Set(m.spawners.map(s => s.mob))];
  // người đã có động phủ vào game luôn ở Thiên Kiếm Tinh (data/home.json start_map): sang tinh cầu mới bằng lệnh đi của game (như cổng / Tự hành)
  await p.evaluate(to => { const g = window.__game; g.auto = false; g.closeAll?.(); if (g.map.id !== to) g.travel(to, 'vao', false, { force: true }); }, id);   // sang thẳng, không diễn cảnh bay (bài này thử tinh cầu, đường truyền tống đã có tinh-do-hai-he.thu.mjs thử)
  await p.waitForFunction(to => window.__game.map?.id === to && !window.__game.traveling && !window.__game.trip, id, { timeout: 30000 }).catch(() => {});
  const nen = await p.waitForFunction(() => window.__thu.nenSan(), null, { timeout: 20000 }).then(() => true, () => false);
  const v = await p.evaluate(() => { const g = window.__game, T = g.map.T, t = g.map.def.phap_tran.at;
    return { map: g.map.id, cach: Math.hypot(g.player.x / T - t[0] - 0.5, g.player.y / T - t[1] - 0.5), bai: g.spawners.length }; });
  thu(v.map === id && nen && v.cach < 3, `${m.name}: vào được, nền vẽ được, đứng ở pháp trận`);
  // tới bãi gần nhất: quái của bãi mọc ra; bật Tự đánh thì phải hạ được quái
  await p.evaluate(() => { const g = window.__game, T = g.map.T, s = g.spawners.map(q => ({ q, d: Math.hypot(q.at[0] * T - g.player.x, q.at[1] * T - g.player.y) })).sort((a, c) => a.d - c.d)[0].q;
    g.player.x = (s.at[0] + 0.5) * T; g.player.y = (s.at[1] + 2) * T; });
  const song = await p.waitForFunction(() => { const g = window.__game; return g.mobs.filter(q => q.hp > 0 && Math.hypot(q.x - g.player.x, q.y - g.player.y) < 260).length >= 3; }, null, { timeout: 20000 }).then(() => true, () => false);
  if (!song) console.log('   trạng thái:', JSON.stringify(await p.evaluate(() => { const g = window.__game; return { dung: g.paused, thoai: g.dialog.open, bang: g.uiOpen, quai: g.mobs.length, qc: !!g.quaiChung, bai0: Object.keys(g.spawners[0] || {}), di: !!g.traveling }; })));
  thu(v.bai === 22 && loai.length <= 2 && song, `${m.name}: 22 bãi, ${loai.join(' + ')}, quái mọc ở bãi gần pháp trận`);
  await p.evaluate(() => { const g = window.__game; window.__dem = (g.save.stats?.kills | 0); g.auto = true; });
  if (process.env.SOI) { await p.evaluate(() => { window.__nk = []; setInterval(() => { const g = window.__game, T = g.map.T; window.__nk.push([g.map.id.slice(0, 8), Math.floor(g.player.x / T), Math.floor(g.player.y / T), Math.round(g.player.hp), g.ghost ? 'G' : '', g.traveling ? 'D' : '', g.trip ? 'B' : '', g.auto ? 'A' : ''].join(',')); }, 500); }); await p.waitForTimeout(9000); console.log(await p.evaluate(() => window.__nk.join(' | '))); }
  const ha = await p.waitForFunction(() => (window.__game.save.stats?.kills | 0) > window.__dem, null, { timeout: 30000 }).then(() => true, () => false);
  if (!ha) console.log('   trạng thái:', JSON.stringify(await p.evaluate(() => { const g = window.__game, T = g.map.T, q = g.mobs.filter(x => x.hp > 0).map(x => ({ d: Math.round(Math.hypot(x.x - g.player.x, x.y - g.player.y)), hp: Math.round(x.hp), id: x.id })).sort((a, c) => a.d - c.d).slice(0, 3);
    return { auto: g.auto, dung: g.paused, thoai: g.dialog.open, bang: g.uiOpen, o: [Math.floor(g.player.x / T), Math.floor(g.player.y / T)], atk: g.player.st?.atk, quai: q, ha: g.save.stats?.kills | 0, dem: window.__dem, chan: g.map.solidTile?.(Math.floor(g.player.x / T), Math.floor(g.player.y / T)) }; })));
  thu(ha, `${m.name}: Tự đánh hạ được quái`);
  if (ANH) await p.screenshot({ path: `${ANH}/${id}.png` });
  const td = await p.evaluate(mo => { const g = window.__game; const ds = window.__thu.tinhDo ? window.__thu.tinhDo() : null; return ds; }, id);
  if (td) thu(td.find(x => x.map === id)?.chan === null, `${m.name}: Tinh đồ cho tới khi đủ tu vi`);
}
await ctx.close();
thu(errs.length === 0, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
if (hong) { console.error(`${hong} bước hỏng`); process.exit(1); }
console.log('✅ Sáu tinh cầu mới: vào được, đủ bãi, Tự đánh chạy');
