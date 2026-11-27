// Bài thử nhiệm vụ săn rải trong trình duyệt (chủ dự án 26/11/2026 13:40; src/game/san-rai.js, src/game/story.js, src/ui/nv-hud.js, src/game/pilot.js),
// trên bản đã gói, chơi khách: thẻ nhiệm vụ có dòng nơi đang nhắm; quái gục trong vòng thì tính cho đúng nơi, ngoài mọi vòng thì không; Tự hành
// đánh quái trong vòng của nơi đang nhắm; số từng nơi còn nguyên sau khi tải lại trang; đủ mọi nơi thì nhiệm vụ xong và sang bước kế; không lỗi JS.
// Chạy: cd _site && node ../tools/kiem/san-rai.thu.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8813;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const doc = async f => JSON.parse(await readFile(join(process.cwd(), f), 'utf8'));
const S = await doc('data/story.json'), cfg = await doc('data/config.json');
const buoc = S.steps.findIndex(s => s.until?.san), U = S.steps[buoc].until, K0 = U.san[0];
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
thu(buoc > 0 && U.san.length >= 6 && U.san.length <= 8 && U.n === 5000, `truyện có nhiệm vụ săn rải (${S.steps[buoc].id}: ${U.san.length} nơi, ${U.n} con)`);
const b = await chromium.launch(), errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const flags = Object.fromEntries(cfg.season.open_flags.map(f => [f, true]));
const save = { step: buoc, stepDone: true, storyV: 2, mua: 2, name: 'Người Thử Săn', map: K0.in, spawn: 'vao', element: 'kim', weapon: 'kiem', realm: 2, layer: 7, qi: 0, gioi: 'nam', flags,
  visited: { 'thien-kiem-phong': true, 'thanh-khe': true, [K0.in]: true }, ht: { intro: 1 }, tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 }, theChat: 'moc-linh' };
await ctx.addInitScript(s => { if (!localStorage.getItem('p2d.save.v1:guest')) localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
const vao = async () => {
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 }); await p.waitForTimeout(600); await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(() => setInterval(() => {   // thoại, bảng lúc vào game: cho qua (hộp thoại mở thì vòng game đứng chờ)
    const g = window.__game;
    if (g.dialog.open) { const c = document.querySelector('#dlg-choices .choice'); if (c && c.offsetParent) c.click(); else g.dialog.skip?.(); }
    for (const e of document.querySelectorAll('.ht-back')) e.click();
    if (g.player) { g.player.hp = g.player.maxHp; g.player.atk = 9e6; if (g.player.st) g.player.st.atk = 9e6; }
  }, 150));
  await p.waitForFunction(() => !!window.__game.story.goal(), null, { timeout: 20000 });
  await p.evaluate(async m => { const g = window.__game; if (g.map.id !== m) await g.travel(m, 'vao', false, { force: true }); }, K0.in);   // người đã có động phủ vào game ở Thiên Kiếm Tinh: sang tinh cầu của nơi đầu
  await p.waitForFunction(m => window.__game.map.id === m && !window.__game.traveling, K0.in, { timeout: 20000 }); await p.waitForTimeout(900);
};
await vao();
const tt = () => p.evaluate(() => { const g = window.__game, G = g.story.goal(), h = document.getElementById('nv-hud'), r = h?.querySelector('.bh-noi'); return { map: g.map.id, n: G?.n, of: G?.of, san: G?.san && { i: G.san.i, ten: G.san.ten, da: G.san.da, of: G.san.of, trong: G.san.trong }, hud: h && !h.hidden ? h.innerText.replace(/\s+/g, ' ') : '', noi: r && !r.hidden ? r.innerText.replace(/\s+/g, ' ') : '', step: g.save.step, c: { ...(g.save.nvDem?.c || {}) } }; });
// 1. thẻ nhiệm vụ: tổng 0/5000 và dòng nơi đang nhắm
let s = await tt();
thu(s.of === U.n && s.n === 0 && s.san && U.san.some(k => k.ten === s.san.ten) && s.noi.includes(s.san.ten) && s.noi.includes(`0/${s.san.of}`), `thẻ nhiệm vụ: 0/${U.n}, dòng nơi đang nhắm "${s.noi}"`);
// 2. đứng giữa nơi đầu: nơi đang nhắm đổi sang nơi đó; quái gục trong vòng tính cho nó, ngoài mọi vòng thì không, trong vòng nơi khác thì tính cho nơi khác
const dem = await p.evaluate(([k0, ds]) => {
  const g = window.__game, T = g.map.T, c = g.map.center(k0.at[0], k0.at[1]); g.player.x = c.x; g.player.y = c.y;
  const kq = { truoc: g.story.goal().san };
  g.story.notify('kill', 'kiem-hon', { x: c.x + 8, y: c.y }); g.story.notify('kill', 'kiem-hon', { x: c.x - 8, y: c.y + 8 });
  kq.trong = { ...g.story.goal() };
  let ngoai = null;   // một điểm trên bản đồ này không nằm trong vòng nào
  for (let x = 2; x < 80 && !ngoai; x += 3) for (let y = 2; y < 80 && !ngoai; y += 3) if (ds.every(k => k.in !== g.map.id || Math.hypot(k.at[0] - x, k.at[1] - y) > k.r + 1)) ngoai = g.map.center(x, y);
  g.story.notify('kill', 'kiem-hon', ngoai); kq.ngoai = g.story.goal().n; kq.coNgoai = !!ngoai;
  const k1 = ds.findIndex((k, i) => i && k.in === g.map.id), o1 = g.map.center(ds[k1].at[0], ds[k1].at[1]);
  g.story.notify('kill', 'kiem-hon', { x: o1.x, y: o1.y }); kq.k1 = k1; kq.sau = { n: g.story.goal().n, c: { ...g.save.nvDem.c } };
  return kq;
}, [K0, U.san]);
thu(dem.trong.san.i === 0 && dem.trong.san.da === 2 && dem.trong.n === 2, `đứng giữa "${K0.ten}": hai con gục trong vòng tính cho nơi này (${dem.trong.san.da}/${K0.n})`);
thu(dem.coNgoai && dem.ngoai === 2, 'quái gục ngoài mọi vòng: không tính');
thu(dem.sau.n === 3 && dem.sau.c['san:' + dem.k1] === 1 && dem.sau.c['san:0'] === 2 && dem.sau.c.san === 3, `quái gục trong vòng "${U.san[dem.k1].ten}" tính cho nơi đó, số từng nơi ghi vào bản lưu`);
await p.waitForTimeout(400); s = await tt();
thu(s.noi.includes(K0.ten) && s.noi.includes(`2/${K0.n}`) && /3\/5000/.test(s.hud), `thẻ hiện "${s.noi}", tổng 3/5000`);
// 3. Tự hành: đánh quái TRONG vòng của nơi đang nhắm, số của nơi ấy tăng
await p.evaluate(() => { const g = window.__game; if (!g.pilot) document.getElementById('nv-hud').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
const tang = await p.waitForFunction(n0 => { const G = window.__game.story.goal(); return G?.san?.i === 0 && G.san.da >= n0 + 3; }, 2, { timeout: 40000 }).then(() => true, () => false);
const pl = await p.evaluate(k0 => { const g = window.__game, c = g.map.center(k0.at[0], k0.at[1]); return { pilot: !!g.pilot, xa: Math.hypot(g.player.x - c.x, g.player.y - c.y) / g.map.T, da: g.story.goal()?.san?.da }; }, K0);
thu(tang && pl.pilot && pl.xa <= K0.r + 2, `Tự hành hạ quái trong vòng "${K0.ten}" (${pl.da}/${K0.n}, đang đứng cách tâm ${pl.xa.toFixed(1)} ô, vòng ${K0.r} ô)`);
// 4. ghi gần đủ rồi tải lại trang: số từng nơi còn, thẻ chỉ đúng nơi còn thiếu; hạ nốt là xong, sang bước kế
const j = U.san.findIndex((k, i) => i && k.in === K0.in), c = { san: 0 };
U.san.forEach((k, i) => { c['san:' + i] = i === j ? k.n - 1 : k.n; c.san += c['san:' + i]; });
// (Trước khi ghi phải cho truyện thôi nghe tin hạ quái: một con gục trong nửa giây chờ tải lại sẽ ghi đè số đếm thật của ván này lên số vừa đặt;
// lần chạy CI đầu tiên trượt đúng chỗ này: "tải lại trang: 7/5000".)
await p.evaluate(([id, c]) => { const g = window.__game; g.story.notify = () => {}; if (g.pilot) document.getElementById('nv-hud').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); g.auto = false; g.save.nvDem = { s: id, c }; g.persist(); }, [S.steps[buoc].id, c]);
await p.waitForTimeout(500); await vao(); await p.waitForTimeout(800);
s = await tt();
thu(s.n === U.n - 1 && s.san?.i === j && s.san.da === U.san[j].n - 1 && s.noi.includes(U.san[j].ten), `tải lại trang: ${s.n}/${U.n}, còn thiếu "${s.noi}"`);
await p.evaluate(k => { const g = window.__game, o = g.map.center(k.at[0], k.at[1]); g.player.x = o.x; g.player.y = o.y; g.story.notify('kill', 'kiem-hon', { x: o.x, y: o.y }); }, U.san[j]);
const xong = await p.waitForFunction(b0 => window.__game.save.step > b0, buoc, { timeout: 30000 }).then(() => true, () => false);
thu(xong, 'đủ mọi nơi: nhiệm vụ xong, truyện sang bước kế');
thu(errs.length === 0, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `❌ ${hong} mục hỏng` : '✅ Săn rải chạy đúng trong trình duyệt');
process.exit(hong ? 1 : 0);
